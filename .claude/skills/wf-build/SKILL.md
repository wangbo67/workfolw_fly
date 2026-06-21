---
name: wf-build
description: >
  工作流构建器。交互式创建标准工作流并编译为 Claude Code skill + command。
  触发条件：用户说"创建工作流"、"生成工作流"、"工作流构建"、
  "wf-build"、"编译工作流"、"build workflow"等。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion, TodoWrite
---

# 工作流构建器

你是工作流构建器。职责是帮助用户创建和编译标准工作流。

工作流源文件格式定义在项目根的 `SCHEMA.md`，**执行任何阶段前必须先读取该文件**。

## 两个阶段

1. **create**：交互式生成 `.workflows/<name>.md` 源文件
2. **compile**：把源文件编译为 `.claude/skills/wf-<name>/SKILL.md` + `.claude/commands/wf-<name>.md`

用户输入 `/wf-build` 进入引导菜单；`/wf-build create` 直接进入创建；`/wf-build compile <name>` 直接编译指定工作流。

## 引导菜单（无参数调用时）

用 AskUserQuestion 询问用户：
- 问题："要做什么？"
- 选项：
  - "创建新工作流" → 进入 create 阶段
  - "编译已有工作流" → 询问工作流名称后进入 compile 阶段
  - "查看现有工作流列表" → 列出 `.workflows/` 下所有 `.md` 文件后回到菜单

---

## create 阶段指令

### 步骤 1：收集基本信息

用 AskUserQuestion 依次询问（每次一个问题）：

1. **工作流名称**（name）
   - 问题："工作流的名称是什么？（kebab-case，如 prd-to-impl）"
   - 选项：["prd-to-impl", "code-review-fix", Other]
   - 校验：必须匹配 `^[a-z0-9]+(-[a-z0-9]+)*$`，否则重新询问

2. **描述**（description）
   - 问题："用一两句话描述这个工作流做什么。描述会写入生成的 SKILL.md，用于 Claude 自动触发。"
   - 用 AskUserQuestion 的 Other 让用户自由输入

3. **触发关键词**（triggers）
   - 问题："列出 3-5 个触发关键词，用户说这些词时自动激活工作流。"
   - 用 AskUserQuestion 的 Other 让用户自由输入（逗号分隔）
   - 整理为列表

### 步骤 2：收集产出物（artifacts）

用 AskUserQuestion 询问：
- 问题："这个工作流会产出哪些文件？"
- 选项（multiSelect: true）：["PRD 文档", "设计文档", "实施计划", "测试报告", Other]

为选中的产出物分配 key（如 prd、design、plan），用于后续 `{{artifacts.xxx}}` 占位符。

询问 artifact 保存路径（先定基础目录，再逐个确认文件名）：
1. 用 AskUserQuestion 询问基础目录：
   - 问题："产出物统一存放在哪个基础目录？"
   - 选项：["docs/（默认）", "specs/", Other]
2. 对每个产出物，询问文件名（与基础目录组合成完整路径）：
   - 问题："<产出物名称>（key=<key>）的文件名是什么？"
   - 选项：["<key>.md（默认）", Other]
   - 组合为 `<基础目录><文件名>`，如 `docs/prd.md`、`specs/design.md`
   - 用户亦可通过 Other 对单个产出物指定完全自定义路径

### 步骤 3：逐节点收集

用 AskUserQuestion 询问节点列表：
- 问题："按执行顺序列出工作流的节点 id（逗号分隔，如 clarify, prd, design, plan, implement, test）"
- 用 Other 让用户自由输入
- 解析为节点 id 列表

对每个节点 id：
1. 用 AskUserQuestion 询问是否需要人审：
   - 问题："节点 `<id>` 需要人审吗？"
   - 选项：["需要（执行后暂停等人审）", "不需要（自动继续）"]
   - 默认 true

2. 用 AskUserQuestion 询问节点执行方式：
   - 问题："节点 `<id>` 如何执行？"
   - 选项：["推荐 prompt（wf-build 自动推导）", "自定义 prompt（自己口述）", "调用现有 skill（指定 skill 名）"]

   **选「推荐 prompt」**：
   - 根据 node id 语义 + 工作流整体目标 + artifacts，自动推导一个结构化 prompt：
     - 开头用"你是<角色>。任务：<概述>。"
     - 用编号列表写出具体步骤
     - 涉及产出物的地方，用 `{{artifacts.<key>}}` 占位符
     - 涉及读取上游产出物的地方，明确指示"读取 {{artifacts.<key>}} 的哪个章节"
   - 展示推导出的 prompt，用 AskUserQuestion 确认：
     - 问题："节点 `<id>` 的推荐 prompt 如上，是否采纳？"
     - 选项：["采纳", Other（改写）]
   - 该节点 `skills` 留空

   **选「自定义 prompt」**：
   - 用 AskUserQuestion 询问："节点 `<id>` 的提示词是什么？描述这个节点要做什么、读什么、写什么。可以口语化，我会整理成结构化 prompt。"
   - 用 Other 让用户自由输入
   - 整理为结构化 prompt 段落（开头"你是<角色>。任务：<概述>。" + 编号步骤 + `{{artifacts.<key>}}` 占位符）
   - 该节点 `skills` 留空

   **选「调用现有 skill」**：
   - 用 AskUserQuestion 询问要调用的 skill 名："节点 `<id>` 要调用哪个已有 skill？（kebab-case，多个用逗号分隔，不限于内置 skill）"
   - 用 Other 让用户自由输入，解析为 skill 名列表
   - 生成**包裹式 prompt**（skill 负责核心执行，prompt 负责准备调用参数与归并输出）：
     - 开头用"你是<角色>。任务：<概述>。本节点委托给已有 skill 执行。"
     - 步骤包含：从上游 artifact / 用户输入准备调用 args → 调用该 skill → 把产出按既有结构归并到本节点 artifact（如四元组等）→ 补充 skill 未覆盖维度
     - 涉及产出物用 `{{artifacts.<key>}}` 占位符
   - 该节点 `skills` 记为用户输入的 skill 名列表

### 步骤 4：组装并预览

把收集到的信息组装成 workflow.md 格式：
- frontmatter（name/description/triggers/artifacts/nodes）
  - 每个 node 含 `id`、`needs_review`；若该节点选了「调用现有 skill」，额外加 `skills: [...]`
- 正文（`# 工作流：<name>` + 每节点 `## <id>` 章节，章节内容为该节点最终 prompt）

在会话中完整展示组装后的 workflow.md 内容。

用 AskUserQuestion 询问：
- 问题："确认写入 `.workflows/<name>.md`？"
- 选项：
  - "确认写入" → 写文件
  - "修改某节点" → 询问哪个节点，回到步骤 3 对应节点
  - "修改基本信息" → 回到步骤 1
  - "重新开始" → 清空已收集信息，回到步骤 1

### 步骤 5：写出文件

用 Write 工具写出 `.workflows/<name>.md`。

写完后用 AskUserQuestion 询问：
- 问题："工作流源文件已写入。是否立即编译？"
- 选项：["立即编译", "稍后手动编译"]

选"立即编译" → 进入 compile 阶段。
选"稍后" → 结束，提示用户可用 `/wf-build compile <name>` 编译。

---

## compile 阶段指令

### 步骤 1：读取并解析源文件

1. 用 Read 读取 `.workflows/<name>.md`
2. 提取 YAML frontmatter（两个 `---` 之间的内容）
3. 提取 Markdown 正文
4. 解析 frontmatter 为字段：name, description, triggers, artifacts, nodes
5. 按正文中的 `## <id>` 分割成节点 prompt 映射

### 步骤 2：校验

执行以下校验，任一失败则**不写任何文件**，报告错误后用 AskUserQuestion 询问"是否回到 create 阶段修改？"：

1. **必填字段完整**：name, description, triggers, artifacts, nodes 都存在
2. **name 格式**：匹配 `^[a-z0-9]+(-[a-z0-9]+)*$`
3. **nodes 是非空列表**：每个节点有 id 字段
4. **节点 id 唯一**：nodes 中无重复 id
5. **正文章节匹配**：每个 nodes[].id 在正文中有且仅有一个 `## <id>` 章节，反之亦然
6. **占位符可解析**：正文中所有 `{{artifacts.xxx}}` 的 xxx 都在 artifacts 映射中存在
7. **skills 字段格式（若存在）**：每个节点若有 `skills`，须为字符串列表，每项匹配 `^[a-z0-9]+(-[a-z0-9]+)*$`（kebab-case），且无重复。**不强校验 skill 是否真实存在**（依赖运行环境），编译时附提示"skill `<name>` 的存在性依赖运行环境，请确认环境中可用"

错误报告格式：
```
校验失败：
- <规则名>：<具体错误>
```

### 步骤 3：替换占位符

对每个节点 prompt，把 `{{artifacts.xxx}}` 替换为 artifacts 映射中的实际路径。

### 步骤 4：生成 SKILL.md

按以下模板生成 `.claude/skills/wf-<name>/SKILL.md`：

```
---
name: wf-<name>
description: >
  <原 description>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, TodoWrite, Skill
---

# <工作流标题（从源文件正文第一行 # 标题提取）>

你是工作流执行者。严格按以下节点顺序执行。

## 执行规则

1. 启动时，用 TodoWrite 为每个节点创建一个 todo：
   <对每个 node 按顺序生成 "- 节点 <id>: <简短描述（从 prompt 第一行提取）>">

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

## 错误处理

节点执行遇到错误时（如指示读取的文件不存在），用 AskUserQuestion 询问用户：
- 问题："节点 <id> 执行出错：<错误描述>，如何处理？"
- 选项：["重试", "跳过", "终止工作流"]

不静默吞掉错误。

## 节点定义

<对每个 node 按顺序生成：>

### <id>

<若该 node 有 skills 字段（非空），在节点 prompt 正文前插入 Skill 调用前言：>

本节点委托给已有 skill 执行。调用方式：
<对每个 skill 生成：>
- 使用 Skill 工具，skill="<skill-name>"，args="<根据下方步骤准备的参数>"
取得 skill 产出后，按下方步骤归并到产出物。

<替换占位符后的节点 prompt 正文>
```

### 步骤 5：生成 command.md

按以下模板生成 `.claude/commands/wf-<name>.md`：

```
---
description: 启动 <name> 工作流
allowed-tools: Skill
---

启动工作流 `wf-<name>`。

使用 Skill 工具调用 `wf-<name>` skill 执行。参数：$ARGUMENTS（作为工作流输入上下文）。
```

### 步骤 6：写出文件并报告

1. 用 Write 写 `.claude/skills/wf-<name>/SKILL.md`
2. 用 Write 写 `.claude/commands/wf-<name>.md`
3. 在会话中报告：
   - 编译完成
   - 产物路径：
     - `.claude/skills/wf-<name>/SKILL.md`
     - `.claude/commands/wf-<name>.md`
   - 使用方式：输入 `/wf-<name>` 启动工作流，或在工作流触发关键词出现时自动激活

---

## schema 参考

完整 schema 定义见项目根 `SCHEMA.md`。关键点速查：

- frontmatter 必填字段：name, description, triggers, artifacts, nodes
- 节点字段：id（必填）、needs_review（默认 false）、skills（可选，默认 []，委托给已有 skill 时填写）
- 占位符：`{{artifacts.<key>}}`
- 校验规则：字段完整、name kebab-case、节点 id 唯一、正文章节与节点 id 一一对应、占位符可解析、skills（若有）为 kebab-case 列表且无重复
