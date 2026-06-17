# 工作流构建器（workflow builder）设计文档

- 日期：2026-06-17
- 项目：workfolw_fly
- 状态：设计已确认，待写实施计划

---

## 1. 背景与目标

### 1.1 问题陈述

在软件开发项目中，常见流程如"澄清需求 → 生成 PRD → 生成设计方案 → 审核 → 生成实施计划 → 开发 → 测试"，以及"代码审查后修复"等任务，都遵循固定节点顺序的工作流。目前这些流程靠人工记忆和口头约定，缺乏标准化与可复用性。

### 1.2 目标

构建一个工作流构建工具，让用户以声明式方式定义标准工作流，并编译为 Claude Code 可执行的 skill + slash command 产物。用户在日常工作中通过 `/wf-<name>` 或自动触发关键词启动工作流，按节点顺序执行，支持节点级提示词、人审暂停、节点间上下文传递。

### 1.3 非目标

- 不自建编排引擎或状态机运行时
- 不支持条件边、循环、子工作流
- 不做多 agent CLI 导出（只面向 Claude Code）
- 不做跨会话状态持久化
- 不做可视化编辑器

---

## 2. 边界决策

| 决策项 | 选择 | 理由 |
|---|---|---|
| 运行时 | 复用 Claude Code 现有机制（skill / command / TodoWrite / AskUserQuestion） | 避免造编排引擎，与 CC 会话模型贴合 |
| 目标 CLI | 只做 Claude Code | 聚焦，避免多 CLI 调研成本 |
| 源文件格式 | Markdown frontmatter + 正文 | 与 SKILL.md 同构，可读性最高，提示词自然 |
| 节点模型 | 极简：id + prompt + needs_review | 工具/skill 调用写进 prompt，不强行分类型 |
| 人审实现 | 会话内 AskUserQuestion，零状态 | 与 CC 会话模型一致，不需持久化 |
| 产物形态 | skill + slash command 双产物 | skill 负责逻辑与自动触发，command 作为显式入口 |
| 生成器形态 | 生成器本身也是 Claude Code skill | 与"复用现有机制"边界一致，零额外依赖 |

---

## 3. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Code 会话（用户环境）                                │
│                                                              │
│  用户 ─── /wf-build ──→ [wf-build skill]                     │
│                          │                                   │
│                          ├─ create 阶段：交互提问             │
│                          ├─ 写 .workflows/<name>.md（源文件） │
│                          └─ compile 阶段：编译                │
│                                   │                          │
│                                   ▼                          │
│                          [编译器逻辑]                        │
│                          │                                   │
│                          ├─ 校验 frontmatter vs schema        │
│                          ├─ 分节生成 SKILL.md                 │
│                          └─ 生成 slash command .md            │
│                                   │                          │
│                                   ▼                          │
│  产物：                                                       │
│    .claude/skills/wf-<name>/SKILL.md                         │
│    .claude/commands/wf-<name>.md                             │
│    .workflows/<name>.md（源文件，可 git）                     │
│                                   │                          │
│                                   ▼                          │
│  用户日常使用：/wf-<name> ──→ [wf-<name> skill 执行]          │
│                                │                             │
│                                ├─ TodoWrite 建节点 todo       │
│                                ├─ 逐节点执行 prompt           │
│                                ├─ needs_review → AskUserQ    │
│                                └─ 产出 artifact 文件          │
└─────────────────────────────────────────────────────────────┘
```

### 三个 skill 角色

1. **wf-build**（生成器）：交互式创建/修改 `.workflows/<name>.md`，并编译为产物
2. **wf-<name>**（产物 skill）：用户日常工作流执行入口，由 wf-build 编译生成
3. **wf-<name> command**：薄入口，激活对应 skill

wf-build 的 create 与 compile 共享 workflow.md 的 schema 知识，合并在一个 skill 内，通过 `/wf-build create` 与 `/wf-build compile <name>` 区分阶段。无参调用 `/wf-build` 进入引导菜单。

---

## 4. workflow.md 源文件 schema

### 4.1 文件位置

`.workflows/<name>.md`（项目根目录下，可 git 版本控制）

### 4.2 结构

YAML frontmatter（元数据 + 节点列表）+ Markdown 正文（按节点 id 分章节写 prompt）

### 4.3 frontmatter schema

```yaml
---
name: prd-to-impl          # 工作流标识，生成产物目录名 wf-<name>
description: >             # 生成 SKILL.md 的 description，用于自动触发
  从需求澄清到实施落地的标准工作流。
  触发条件：用户说"走 PRD 流程"、"从需求开始"、"标准开发流程"等。
triggers:                  # 自动触发关键词（写入 SKILL.md description）
  - PRD流程
  - 从需求开始
  - 标准开发流程
artifacts:                 # 显式声明产出物路径，节点间解耦传递
  prd: docs/prd.md
  design: docs/design.md
  plan: docs/plan.md
nodes:                     # 有序列表，顺序即执行顺序（不支持条件边）
  - id: clarify            # 节点唯一标识，对应正文章节 ## clarify
    needs_review: true     # 默认 false
  - id: prd
    needs_review: true
  - id: design
    needs_review: true
  - id: plan
    needs_review: true
  - id: implement
    needs_review: false
  - id: test
    needs_review: false
---
```

### 4.4 正文结构

```markdown
# 工作流：PRD 到实施

## clarify

你是需求分析师。任务：与用户交互澄清需求。

具体步骤：
1. 读取用户提供的原始需求描述
2. 用 AskUserQuestion 逐个澄清：目标用户、核心场景、成功标准、约束
3. 将澄清结果写入 {{artifacts.prd}} 的"需求澄清"章节

注意：不要跳过澄清直接写 PRD。

## prd

你是产品经理。任务：基于澄清结果撰写 PRD。

读取 {{artifacts.prd}} 的"需求澄清"章节，补充以下章节：
- 背景与目标
- 用户故事
- 功能范围（In/Out scope）
- 验收标准

写入 {{artifacts.prd}}。

## design
...
```

### 4.5 关键设计点

1. **`{{artifacts.xxx}}` 占位符**：编译器在生成 SKILL.md 时替换为实际路径。prompt 不硬编码路径，改路径只改 frontmatter。

2. **正文章节 id 与 frontmatter nodes[].id 一一对应**：编译器校验这一点，不一致则报错。

3. **`needs_review` 只在 frontmatter 声明，正文不写审核逻辑**：编译器在 needs_review=true 的节点章节末尾自动追加人审模板。

4. **不支持条件边**：节点顺序就是执行顺序。未来需要分支时再加 `edges` 字段。

5. **`triggers` 和 `description`**：直接写入生成 SKILL.md 的 frontmatter，让工作流产物 skill 能被 Claude 自动激活。

---

## 5. 编译器（wf-build 的 compile 阶段）

### 5.1 输入与输出

- 输入：`.workflows/<name>.md`
- 输出：
  - `.claude/skills/wf-<name>/SKILL.md`
  - `.claude/commands/wf-<name>.md`

### 5.2 编译步骤

```
1. 解析 workflow.md
   ├─ 提取 frontmatter（YAML）
   └─ 提取正文，按 ## <id> 分割成节点 prompt 映射

2. 校验
   ├─ name/description/triggers/nodes/artifacts 字段完整
   ├─ nodes[].id 唯一
   ├─ 正文章节 id 与 frontmatter nodes[].id 一一对应
   └─ artifacts 引用的路径在 prompt 中至少被引用一次（可选检查）

3. 替换占位符
   └─ 每个 prompt 中的 {{artifacts.xxx}} 替换为实际路径

4. 生成 SKILL.md
   ├─ frontmatter: name/description/allowed-tools
   └─ 正文: 工作流总指令 + 每节点章节

5. 生成 command.md
   ├─ frontmatter: description/allowed-tools
   └─ 正文: 激活 wf-<name> skill 的入口指令
```

### 5.3 生成的 SKILL.md 模板

```markdown
---
name: wf-<name>
description: >
  <原 description>
  触发条件：<triggers 拼接>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, TodoWrite, Skill
---

# <工作流名称>

你是工作流执行者。严格按以下节点顺序执行。

## 执行规则

1. 启动时，用 TodoWrite 为每个节点创建一个 todo：
   <节点列表，逐个对应 nodes 数组>

2. 逐节点执行：
   - 标记当前节点 todo 为 in_progress
   - 执行该节点章节的 prompt
   - 若节点标记 needs_review，执行完 prompt 后调用 AskUserQuestion：
     - 问题："节点 <id> 完成，如何继续？"
     - 选项：["继续", "回退并附加说明", "修改并附加说明"]

   - 用户选"继续" → 标记 completed，进入下一节点

   - 用户选"回退并附加说明" → 进入回退流程：
     - 再次调用 AskUserQuestion：
       - 问题："请输入回退提示词，将作为上一节点重做的上下文"
       - 选项：["需求理解有偏差", "范围需要调整", "遗漏关键信息", Other]
     - 接收用户输入（选项标签或 Other 文本）
     - 当前节点 todo 重新置 pending，上一节点 todo 置 in_progress
     - 重新执行上一节点 prompt，在 prompt 前附加：
       "用户回退反馈：<用户输入>"
     - 上一节点若 needs_review=true，重做后再次走人审；否则执行完继续往下

   - 用户选"修改并附加说明" → 进入修改流程：
     - 再次调用 AskUserQuestion：
       - 问题："请输入修改建议，将作为当前节点重做的上下文"
       - 选项：["补充遗漏内容", "调整方向", "修正错误", Other]
     - 接收用户输入
     - 当前节点 todo 保持 in_progress
     - 重新执行当前节点 prompt，在 prompt 前附加：
       "用户修改反馈：<用户输入>"
     - 重做后再次走人审（因为 needs_review=true）

   - 若 needs_review=false，执行完直接标记 completed，进入下一节点

3. 所有节点完成后，总结产出物路径，结束。

## artifact 写入规则

- 节点只能写 frontmatter 里 artifacts 映射中声明的路径（不能写映射外的文件）
- 节点写哪个 artifact 由其 prompt 指示，schema 不做 per-node 所有权强制
- 若多个节点共享同一 artifact 文件，节点 prompt 必须明确指示
  "读取现有内容，仅追加/修改指定章节，保留其他章节"
- 回退重做时，节点应先读取当前 artifact 状态，基于状态增量修改，
  而非盲目覆盖整个文件

## 节点定义

### clarify

<节点 prompt 正文，占位符已替换>

### prd

<节点 prompt 正文>

### design

<节点 prompt 正文>

...
```

### 5.4 生成的 command.md 模板

```markdown
---
description: 启动 <name> 工作流
allowed-tools: Skill
---

启动工作流 `wf-<name>`。

使用 Skill 工具调用 `wf-<name>` skill 执行。参数：$ARGUMENTS（作为工作流输入上下文）。
```

### 5.5 关键设计点

1. **`allowed-tools` 统一在生成时写死**：不按节点配置，整个 skill 用一个白名单。需要收紧工具白名单时，在 workflow.md frontmatter 加可选字段 `allowed_tools` 覆盖默认值（YAGNI 边界：现在不加，预留扩展点）。

2. **TodoWrite 的任务列表在 SKILL.md 指令里写死节点顺序**：编译器把 nodes 数组编译成 TodoWrite 的 tasks 参数模板，skill 执行时直接用。编译时确定，运行时执行。

3. **人审回退/修改支持用户输入提示词**：第二次 AskUserQuestion 提供常见模板选项降低输入成本，同时保留 Other 供自由输入。回退/修改后重做的节点，如果本身 needs_review=true，会再次触发人审，确保闭环。

4. **command 是薄入口**：只做"激活 skill + 传参数"，逻辑全在 skill 里。skill 也能被自动触发（通过 description 关键词），command 只是显式入口。

5. **编译错误处理**：校验失败时，编译器不写任何文件，直接在会话里报告错误位置（缺字段 / id 不匹配 / 等），让用户改 workflow.md 后重新 `/wf-build compile`。

---

## 6. 运行时执行模型

### 6.1 启动阶段

用户输入 `/wf-<name> [参数]` 或 Claude 检测到 triggers 关键词自动激活 skill：

```
1. Claude 读取 SKILL.md 指令
2. 用 TodoWrite 一次性创建所有节点 todo：
   [
     {subject: "节点 clarify: 需求澄清", status: "pending"},
     {subject: "节点 prd: 撰写 PRD", status: "pending"},
     {subject: "节点 design: 设计方案", status: "pending"},
     ...
   ]
3. 若 $ARGUMENTS 非空，作为工作流初始输入上下文
4. 进入第一个节点
```

### 6.2 节点执行循环

```
for each node in nodes:
    TodoUpdate(node.id, status="in_progress")

    execute(node.prompt)

    if node.needs_review:
        result = AskUserQuestion("节点 <id> 完成，如何继续？",
                                 ["继续", "回退并附加说明", "修改并附加说明"])

        if result == "继续":
            TodoUpdate(node.id, status="completed")
            continue

        elif result == "回退并附加说明":
            feedback = AskUserQuestion("请输入回退提示词...",
                                       ["需求理解有偏差", "范围需要调整",
                                        "遗漏关键信息", Other])
            TodoUpdate(node.id, status="pending")
            prev_node = nodes[current_index - 1]
            TodoUpdate(prev_node.id, status="in_progress")
            execute(prev_node.prompt + "\n\n用户回退反馈：" + feedback)
            # 上一节点重做后重新进入它的 needs_review 判断
            current_index -= 1
            continue

        elif result == "修改并附加说明":
            feedback = AskUserQuestion("请输入修改建议...",
                                       ["补充遗漏内容", "调整方向",
                                        "修正错误", Other])
            # 当前 todo 保持 in_progress
            execute(node.prompt + "\n\n用户修改反馈：" + feedback)
            # 重做后再次走人审（不递增索引）
            continue

    else:
        TodoUpdate(node.id, status="completed")
```

### 6.3 上下文传递机制

节点间上下文通过 **artifact 文件** 传递，不靠会话历史隐式传递：

```
节点 clarify 执行
  └─ 写 docs/prd.md 的"需求澄清"章节

节点 prd 执行
  ├─ 读 docs/prd.md 的"需求澄清"章节（prompt 里指示）
  └─ 写 docs/prd.md 的其他章节

节点 design 执行
  ├─ 读 docs/prd.md
  └─ 写 docs/design.md

节点 plan 执行
  ├─ 读 docs/design.md
  └─ 写 docs/plan.md
...
```

**为什么用文件而非会话历史**：
- 文件是显式契约，节点 prompt 声明读什么、写什么，边界清晰
- 会话历史长了 LLM 会丢失早期上下文，文件可随时重读
- artifact 可 git 版本控制，人审时用户可离线查看
- 跨节点回退时，文件状态天然就是回退点（重做节点会覆盖文件）

### 6.4 回退时的 artifact 处理

回退到上一节点时，上一节点重做会覆盖它的 artifact。为防止破坏下游产出，编译器在生成的 SKILL.md 里加全局 artifact 写入规则（见 5.3 模板中的"artifact 写入规则"章节）：

- 节点只能写 artifacts 映射中声明的路径（不能写映射外的文件）
- 节点写哪个 artifact 由其 prompt 指示，schema 不做 per-node 所有权强制
- 多节点共享同一文件时，prompt 必须指示增量修改
- 回退重做时先读取当前状态再增量修改

把"防止回退破坏下游产出"的责任放在 prompt 层面，而非引入文件版本管理（YAGNI）。

### 6.5 结束阶段

```
所有节点 completed 后：
1. TodoUpdate 所有 todo 为 completed
2. 输出总结：
   - 工作流 <name> 执行完成
   - 产出物：
     - docs/prd.md
     - docs/design.md
     - docs/plan.md
   - 建议用户 review 产出物并 git commit
```

### 6.6 错误处理

- **节点执行失败**（如 prompt 指示读的文件不存在）：Claude 在节点内报告错误，不自动跳过。编译器在 SKILL.md 加规则："节点执行遇到错误时，用 AskUserQuestion 询问用户：重试 / 跳过 / 终止"。错误不会被静默吞掉。
- **AskUserQuestion 被用户拒绝**：按"终止工作流"处理，保留当前 artifact 状态。

---

## 7. 生成器（wf-build skill）

### 7.1 职责

`wf-build` 是用户创建/修改工作流的唯一入口。两个阶段：`create`（交互式生成 workflow.md）和 `compile`（编译为 skill + command）。

### 7.2 create 阶段流程

用户输入 `/wf-build` 或说"帮我创建一个工作流"：

```
1. 询问工作流基本信息
   ├─ 工作流名称（name，如 prd-to-impl）
   ├─ 描述（description，写入 SKILL.md 用于自动触发）
   └─ 触发关键词（triggers，列 3-5 个）

2. 询问产出物（artifacts）
   ├─ AskUserQuestion: "这个工作流会产出哪些文件？"
   │   选项模板：["PRD 文档", "设计文档", "实施计划", "测试报告", Other]
   │   多选 + 可重复（用户可多次选择或自定义）
   └─ 每个产出物询问路径（默认 docs/<name>.md）

3. 逐节点交互
   ├─ AskUserQuestion: "请描述工作流的节点（按顺序）"
   │   引导用户列出节点名，如：clarify, prd, design, plan, implement, test
   ├─ 对每个节点：
   │   ├─ 询问节点 id（如 clarify）
   │   ├─ 询问是否需要人审（needs_review，默认 true）
   │   └─ 询问节点 prompt（多行自然语言，用户口述，生成器整理为结构化 prompt）
   └─ 每个节点 prompt 里涉及 artifact 的地方，生成器自动用 {{artifacts.xxx}} 占位符

4. 确认与写出
   ├─ 把收集到的信息拼成 workflow.md（frontmatter + 正文）
   ├─ 在会话里展示完整 workflow.md 预览
   ├─ AskUserQuestion: "确认写入 .workflows/<name>.md？"
   │   选项：["确认写入", "修改某节点", "修改基本信息", "重新开始"]
   └─ 确认后写出文件
```

**关键设计**：节点 prompt 不要求用户写完美的 Markdown，生成器会整理。用户口述"这个节点要读 PRD 然后写设计文档，重点关注架构和接口"，生成器整理成结构化 prompt 段落。

### 7.3 compile 阶段流程

用户输入 `/wf-build compile <name>` 或 create 阶段结束后自动询问是否编译：

```
1. 读取 .workflows/<name>.md
2. 解析 frontmatter + 正文，校验（见第 5 节）
3. 若校验失败：
   ├─ 报告错误位置（缺字段 / id 不匹配 / 占位符未定义）
   └─ AskUserQuestion: "是否回到 create 阶段修改？" ["是", "我手动改"]
4. 若校验通过：
   ├─ 生成 .claude/skills/wf-<name>/SKILL.md
   ├─ 生成 .claude/commands/wf-<name>.md
   └─ 报告产物路径，提示用户：可用 /wf-<name> 启动
```

### 7.4 wf-build 的 SKILL.md 结构

```markdown
---
name: wf-build
description: >
  工作流构建器。交互式创建标准工作流并编译为 Claude Code skill + command。
  触发条件：用户说"创建工作流"、"生成工作流"、"工作流构建"、
  "wf-build"、"编译工作流"等。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion, TodoWrite
---

# 工作流构建器

## 职责

两个阶段：
1. create：交互式生成 .workflows/<name>.md
2. compile：把 workflow.md 编译为 .claude/skills/wf-<name>/ + .claude/commands/wf-<name>.md

## create 阶段指令

<7.2 create 阶段流程的详细指令>

## compile 阶段指令

<第 5 节编译步骤的详细指令，含校验规则、占位符替换、模板生成>

## schema 参考

<workflow.md 的 frontmatter schema 定义，供校验时参考>
```

---

## 8. 项目目录结构

```
workfolw_fly/                          # 项目根
├── README.md                          # 项目说明（可选，后续补）
├── .workflows/                        # 工作流源文件（用户可 git）
│   └── prd-to-impl.md                 # 示例工作流（首个示例）
├── .claude/
│   ├── skills/
│   │   ├── wf-build/                  # 生成器 skill（本项目交付核心）
│   │   │   └── SKILL.md
│   │   └── wf-prd-to-impl/            # 编译产物示例
│   │       └── SKILL.md
│   └── commands/
│       ├── wf-build.md                # 生成器入口 command
│       └── wf-prd-to-impl.md          # 编译产物示例
├── docs/                              # 工作流执行时的 artifact 产出
│   └── (prd.md, design.md 等，运行时生成)
└── specs/                             # 设计文档（本项目自身）
    └── 2026-06-17-workflow-builder-design.md
```

---

## 9. 首批交付物

1. `wf-build` skill（SKILL.md + command.md）—— 核心
2. `.workflows/prd-to-impl.md` 示例工作流 —— 验证生成器 + 作为用户参考模板
3. 编译生成的 `wf-prd-to-impl` skill + command —— 验证编译器正确性

---

## 10. YAGNI 清单

以下功能明确不在当前版本范围内，预留未来扩展：

- 不支持条件边 / 循环 / 子工作流
- 不支持节点级 allowed_tools（编译期统一）
- 不做跨会话状态持久化（会话内 AskUserQuestion 即可）
- 不做独立 CLI 编译器（生成器也是 skill）
- 不做 workflow.md 的可视化编辑器
- 不做多 CLI 导出（只 Claude Code）
- 不做 workflow.md 版本管理工具（git 即可）
- 不做节点级 artifact 所有权强制（靠 prompt 约定 + 全局规则）

---

## 11. 可行性结论

### 11.1 技术可行性：高

所有机制都复用 Claude Code 现有能力：
- skill / slash command：标准机制
- TodoWrite：任务跟踪
- AskUserQuestion：人审暂停
- artifact 文件：节点间上下文传递
- 无需自建运行时、状态机、持久化层

### 11.2 复杂度评估：中低

核心工作量集中在：
- wf-build skill 的 SKILL.md 编写（create + compile 指令）
- workflow.md schema 定义与校验逻辑（在 skill 指令里描述）
- 编译模板（SKILL.md 模板 + command.md 模板）

无外部代码依赖，无构建工具，纯 skill 交付。

### 11.3 风险点

1. **frontmatter 解析靠 LLM**：workflow.md 的 YAML frontmatter 由 LLM 读取解析，复杂嵌套可能解析错。缓解：schema 保持扁平（nodes 是简单列表，无深层嵌套），校验规则在 skill 指令里明确描述。

2. **人审回退的索引控制**：LLM 执行"回退到上一节点"时需要正确回退循环索引，这是运行时行为，靠 SKILL.md 指令描述。缓解：指令里用明确的语言描述回退语义，TodoWrite 的 todo 状态作为外部可见的执行进度锚点。

3. **artifact 覆盖风险**：回退重做节点可能覆盖下游 artifact。缓解：全局 artifact 写入规则 + prompt 约定增量修改，不引入文件版本管理（YAGNI）。

### 11.4 结论

项目可行，复杂度可控，与 Claude Code 生态高度契合。建议进入实施计划阶段。
