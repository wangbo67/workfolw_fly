# Workflow Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a workflow builder skill (`wf-build`) for Claude Code that lets users declaratively define standard workflows in `.workflows/<name>.md` and compile them to skill + slash command artifacts, validated end-to-end with a `prd-to-impl` example workflow.

**Architecture:** Pure skill/Markdown project — no executable code. The `wf-build` skill handles two phases: `create` (interactive generation of `.workflows/<name>.md`) and `compile` (transformation to `.claude/skills/wf-<name>/SKILL.md` + `.claude/commands/wf-<name>.md`). The `prd-to-impl` example workflow is hand-authored first, then hand-compiled to produce reference artifacts (test oracles), then the `wf-build` skill instructions are written to match. Final validation: invoke `/wf-build compile prd-to-impl` in a fresh Claude Code session and diff against the hand-compiled reference.

**Tech Stack:** Claude Code skills, slash commands, Markdown, YAML frontmatter, TodoWrite, AskUserQuestion.

**Spec:** `specs/2026-06-17-workflow-builder-design.md`

**Adapted TDD note:** This project has no executable code, so traditional TDD doesn't apply. Instead:
- "Expected output" files (hand-compiled artifacts) are written first as test oracles
- "Implementation" is the `wf-build` skill whose instructions should reproduce those artifacts
- "Test pass" = diff between skill-produced output and reference artifacts is empty

---

## File Structure

```
workfolw_fly/
├── .gitignore                              # Ignores docs/ runtime artifacts
├── README.md                               # Project overview
├── SCHEMA.md                               # workflow.md schema reference (user docs + skill reference)
├── .workflows/
│   └── prd-to-impl.md                      # Example workflow source
├── .claude/
│   ├── skills/
│   │   ├── wf-build/
│   │   │   └── SKILL.md                    # Generator skill (core deliverable)
│   │   └── wf-prd-to-impl/
│   │       └── SKILL.md                    # Hand-compiled reference (test oracle)
│   └── commands/
│       ├── wf-build.md                     # Generator entry command
│       └── wf-prd-to-impl.md               # Hand-compiled reference (test oracle)
└── specs/
    ├── 2026-06-17-workflow-builder-design.md   # Already exists
    └── 2026-06-17-workflow-builder-plan.md     # This plan
```

**Responsibility boundaries:**
- `SCHEMA.md` — single source of truth for the workflow.md format; referenced by both users and the wf-build skill
- `.workflows/<name>.md` — user-authored source files (one per workflow)
- `.claude/skills/wf-build/SKILL.md` — the generator; contains create + compile instructions; references SCHEMA.md
- `.claude/skills/wf-<name>/SKILL.md` — compiled output (one per workflow)
- `.claude/commands/wf-<name>.md` — compiled entry command (one per workflow)

---

## Task 1: Initialize project structure

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `.workflows/.gitkeep`
- Create: `.claude/skills/wf-build/.gitkeep`
- Create: `.claude/skills/wf-prd-to-impl/.gitkeep`
- Create: `.claude/commands/.gitkeep`

- [ ] **Step 1: Initialize git repo**

Run:
```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git init
git branch -M main
```

Expected: `Initialized empty Git repository in .../workfolw_fly/.git/`

- [ ] **Step 2: Create directory structure**

Run:
```bash
mkdir -p /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.workflows
mkdir -p /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.claude/skills/wf-build
mkdir -p /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.claude/skills/wf-prd-to-impl
mkdir -p /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.claude/commands
```

Expected: directories created, no output

- [ ] **Step 3: Write `.gitignore`**

File content:
```
# Runtime artifacts produced by workflow execution
docs/

# macOS
.DS_Store

# Editor
.vscode/
.idea/
```

- [ ] **Step 4: Write `README.md`**

File content:
```markdown
# workfolw_fly

Workflow builder for Claude Code. Define standard workflows declaratively in `.workflows/<name>.md`, compile them to skill + slash command artifacts, and invoke via `/wf-<name>`.

## Quick start

1. Use `/wf-build` to interactively create a new workflow definition
2. Use `/wf-build compile <name>` to compile it to skill + command
3. Use `/wf-<name>` to run the workflow

## Structure

- `.workflows/` — workflow source files (Markdown + YAML frontmatter)
- `.claude/skills/wf-build/` — the generator skill
- `.claude/skills/wf-<name>/` — compiled workflow skills
- `.claude/commands/` — compiled slash command entry points
- `SCHEMA.md` — workflow.md schema reference
- `specs/` — design and plan documents

See `specs/2026-06-17-workflow-builder-design.md` for full design.
```

- [ ] **Step 5: Create `.gitkeep` files for empty directories**

Run:
```bash
touch /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.workflows/.gitkeep
touch /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.claude/skills/wf-build/.gitkeep
touch /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.claude/skills/wf-prd-to-impl/.gitkeep
touch /Users/wangbo/Develop/projects_ai/skills/workfolw_fly/.claude/commands/.gitkeep
```

- [ ] **Step 6: Verify structure**

Run:
```bash
ls -la /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
```

Expected output includes: `.git/`, `.gitignore`, `.claude/`, `.workflows/`, `README.md`, `specs/`

- [ ] **Step 7: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add .gitignore README.md .workflows/.gitkeep .claude/skills/wf-build/.gitkeep .claude/skills/wf-prd-to-impl/.gitkeep .claude/commands/.gitkeep specs/
git commit -m "chore: initialize project structure"
```

Expected: commit succeeds

---

## Task 2: Write the workflow.md schema reference

**Files:**
- Create: `SCHEMA.md`

This is the single source of truth for the workflow.md format. It is referenced by users (who write workflows) and by the `wf-build` skill (which validates and compiles workflows). Spec section 4 is the authoritative source.

- [ ] **Step 1: Write `SCHEMA.md`**

File content:
````markdown
# workflow.md Schema Reference

This document defines the format of `.workflows/<name>.md` files — the source files that `wf-build` compiles into Claude Code skill + slash command artifacts.

## File location

`.workflows/<name>.md` — one file per workflow. `<name>` is the workflow identifier (kebab-case, e.g. `prd-to-impl`). It determines the generated skill name `wf-<name>` and command `/wf-<name>`.

## File structure

A workflow.md has two parts:

1. **YAML frontmatter** (between `---` fences) — metadata + node list
2. **Markdown body** — section per node, each section's prompt

## Frontmatter fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Workflow identifier, kebab-case. Determines `wf-<name>` output paths. |
| `description` | string (multi-line `>`) | yes | Description written into the generated `SKILL.md`. Used by Claude Code for auto-activation. Should include trigger keywords. |
| `triggers` | list[string] | yes | Auto-activation keywords. Written into `SKILL.md` description. 3-5 keywords recommended. |
| `artifacts` | map[string, string] | yes | Maps artifact keys to file paths. Referenced in node prompts via `{{artifacts.<key>}}`. Paths are relative to project root. |
| `nodes` | list[Node] | yes | Ordered list of nodes. Execution order = list order. |
| `allowed_tools` | list[string] | no | Optional. Overrides default tool whitelist for the generated skill. If omitted, a sensible default is used. |

### Node fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | string | yes | — | Unique node identifier. Must match a `## <id>` section in the body. |
| `needs_review` | boolean | no | `false` | If `true`, inserts a human-review step (AskUserQuestion) after the node's prompt executes. |

## Body structure

The body contains one `## <id>` section per node, in any order (execution order is determined by the `nodes` list, not body order). The section content is the node's prompt — natural language instructions for Claude.

```
# Workflow: <human-readable name>

## <node-id-1>

<prompt for node 1>

## <node-id-2>

<prompt for node 2>

...
```

## Placeholder syntax

Inside node prompts, use `{{artifacts.<key>}}` to reference artifact paths. The compiler replaces these with the actual paths from the `artifacts` map.

Example:
```yaml
artifacts:
  prd: docs/prd.md
```

In a node prompt:
```
Write the requirements to {{artifacts.prd}}.
```

After compilation:
```
Write the requirements to docs/prd.md.
```

## Validation rules

The compiler enforces these rules. Violations abort compilation with an error report:

1. **Required fields present**: `name`, `description`, `triggers`, `artifacts`, `nodes`
2. **Node ids unique**: no duplicate `id` values in `nodes`
3. **Body sections match node ids**: every `nodes[].id` has exactly one `## <id>` section in the body, and vice versa
4. **Artifact references resolved**: every `{{artifacts.xxx}}` placeholder in the body has a matching key in `artifacts`
5. **Name is kebab-case**: matches `^[a-z0-9]+(-[a-z0-9]+)*$`

## Example

See `.workflows/prd-to-impl.md` for a complete example.
````

- [ ] **Step 2: Verify against spec section 4**

Check that SCHEMA.md covers:
- File location (spec 4.1) ✓
- Structure: frontmatter + body (spec 4.2) ✓
- All frontmatter fields from spec 4.3 ✓
- Body structure (spec 4.4) ✓
- All key design points from spec 4.5 ✓

If any field is missing, add it. If any field contradicts the spec, fix it.

- [ ] **Step 3: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add SCHEMA.md
git commit -m "docs: add workflow.md schema reference"
```

---

## Task 3: Write example workflow source `.workflows/prd-to-impl.md`

**Files:**
- Create: `.workflows/prd-to-impl.md`

This is both a validation fixture for the compiler and a user-facing reference template. It must conform to SCHEMA.md exactly.

- [ ] **Step 1: Write `.workflows/prd-to-impl.md`**

File content:
````markdown
---
name: prd-to-impl
description: >
  从需求澄清到实施落地的标准开发工作流。
  触发条件：用户说"PRD流程"、"从需求开始"、"标准开发流程"、"走 PRD"等。
triggers:
  - PRD流程
  - 从需求开始
  - 标准开发流程
  - 走 PRD
artifacts:
  prd: docs/prd.md
  design: docs/design.md
  plan: docs/plan.md
nodes:
  - id: clarify
    needs_review: true
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

# 工作流：PRD 到实施

## clarify

你是需求分析师。任务：与用户交互澄清需求。

具体步骤：
1. 读取用户提供的原始需求描述（来自 $ARGUMENTS 或会话上下文）
2. 用 AskUserQuestion 逐个澄清以下维度：
   - 目标用户是谁
   - 核心使用场景
   - 成功标准（可量化的）
   - 约束条件（技术、时间、资源）
3. 若 {{artifacts.prd}} 不存在，创建之并写入 `# PRD` 标题与 `## 需求澄清` 章节标题
4. 若 {{artifacts.prd}} 已存在，读取后在 `## 需求澄清` 章节追加/修改内容，保留其他章节
5. 将澄清结果结构化写入 {{artifacts.prd}} 的 `## 需求澄清` 章节

注意：不要跳过澄清直接写 PRD。每个维度都要得到用户明确回答后再继续。

## prd

你是产品经理。任务：基于澄清结果撰写完整 PRD。

1. 读取 {{artifacts.prd}} 的 `## 需求澄清` 章节
2. 保留 `## 需求澄清` 章节内容，在其后追加以下章节：
   - `## 背景与目标`
   - `## 用户故事`
   - `## 功能范围`（明确 In Scope / Out of Scope）
   - `## 验收标准`（每条可测试）
3. 写回 {{artifacts.prd}}，确保 `## 需求澄清` 章节未被破坏

## design

你是架构师。任务：基于 PRD 产出技术设计方案。

1. 读取 {{artifacts.prd}} 全文
2. 创建 {{artifacts.design}}，写入以下章节：
   - `# 设计方案`
   - `## 架构概述`
   - `## 核心组件与职责`
   - `## 关键接口定义`
   - `## 数据模型`
   - `## 错误处理策略`
   - `## 与 PRD 验收标准的对应关系`
3. 写入 {{artifacts.design}}

## plan

你是技术负责人。任务：基于设计方案生成可执行的实施计划。

1. 读取 {{artifacts.design}} 全文
2. 创建 {{artifacts.plan}}，写入以下章节：
   - `# 实施计划`
   - `## 任务分解`（每个任务有明确交付物与验收标准）
   - `## 依赖关系`（任务间的执行顺序）
   - `## 风险点与应对`
   - `## 测试策略`
3. 写入 {{artifacts.plan}}

## implement

你是开发工程师。任务：按实施计划编码。

1. 读取 {{artifacts.plan}} 全文
2. 按任务分解逐个实现，每完成一个任务：
   - 用 TodoWrite 跟踪进度
   - 实现代码
   - 运行相关测试验证
3. 实现过程中若发现计划有问题，用 AskUserQuestion 询问用户是否回退到 plan 节点
4. 实现完成后，在会话中总结：修改的文件清单、每个任务的完成状态

## test

你是测试工程师。任务：验证实现满足验收标准。

1. 读取 {{artifacts.prd}} 的 `## 验收标准` 章节
2. 读取 {{artifacts.plan}} 的 `## 测试策略` 章节
3. 执行测试（运行已有测试、补充缺失测试、手动验证验收标准）
4. 在会话中输出测试报告：
   - 验收标准逐条核对结果
   - 测试覆盖率
   - 发现的问题与建议
````

- [ ] **Step 2: Verify against SCHEMA.md**

Manual checks:
- [ ] `name` is kebab-case: `prd-to-impl` ✓
- [ ] `description` is multi-line and includes trigger keywords ✓
- [ ] `triggers` has 4 entries ✓
- [ ] `artifacts` has 3 keys (prd, design, plan) with valid paths ✓
- [ ] `nodes` has 6 entries with unique ids ✓
- [ ] Every `nodes[].id` has a matching `## <id>` body section: clarify, prd, design, plan, implement, test ✓
- [ ] Every `{{artifacts.xxx}}` placeholder (prd, design, plan) has a matching key in `artifacts` ✓

- [ ] **Step 3: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add .workflows/prd-to-impl.md
git rm --cached .workflows/.gitkeep 2>/dev/null || true
git commit -m "feat: add prd-to-impl example workflow"
```

---

## Task 4: Write hand-compiled reference `.claude/skills/wf-prd-to-impl/SKILL.md`

**Files:**
- Create: `.claude/skills/wf-prd-to-impl/SKILL.md`

This is the **test oracle** — the expected output of compiling `.workflows/prd-to-impl.md`. It is hand-authored by applying the templates in spec section 5.3 to the example workflow. Later, when `/wf-build compile prd-to-impl` is invoked, its output must match this file.

- [ ] **Step 1: Write `.claude/skills/wf-prd-to-impl/SKILL.md`**

File content (this is the compiled output of the Task 3 source, following spec 5.3 template):
````markdown
---
name: wf-prd-to-impl
description: >
  从需求澄清到实施落地的标准开发工作流。
  触发条件：用户说"PRD流程"、"从需求开始"、"标准开发流程"、"走 PRD"等。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, TodoWrite, Skill
---

# 工作流：PRD 到实施

你是工作流执行者。严格按以下节点顺序执行。

## 执行规则

1. 启动时，用 TodoWrite 为每个节点创建一个 todo：
   - 节点 clarify: 需求澄清
   - 节点 prd: 撰写 PRD
   - 节点 design: 设计方案
   - 节点 plan: 实施计划
   - 节点 implement: 编码实现
   - 节点 test: 测试验证

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

### clarify

你是需求分析师。任务：与用户交互澄清需求。

具体步骤：
1. 读取用户提供的原始需求描述（来自 $ARGUMENTS 或会话上下文）
2. 用 AskUserQuestion 逐个澄清以下维度：
   - 目标用户是谁
   - 核心使用场景
   - 成功标准（可量化的）
   - 约束条件（技术、时间、资源）
3. 若 docs/prd.md 不存在，创建之并写入 `# PRD` 标题与 `## 需求澄清` 章节标题
4. 若 docs/prd.md 已存在，读取后在 `## 需求澄清` 章节追加/修改内容，保留其他章节
5. 将澄清结果结构化写入 docs/prd.md 的 `## 需求澄清` 章节

注意：不要跳过澄清直接写 PRD。每个维度都要得到用户明确回答后再继续。

### prd

你是产品经理。任务：基于澄清结果撰写完整 PRD。

1. 读取 docs/prd.md 的 `## 需求澄清` 章节
2. 保留 `## 需求澄清` 章节内容，在其后追加以下章节：
   - `## 背景与目标`
   - `## 用户故事`
   - `## 功能范围`（明确 In Scope / Out of Scope）
   - `## 验收标准`（每条可测试）
3. 写回 docs/prd.md，确保 `## 需求澄清` 章节未被破坏

### design

你是架构师。任务：基于 PRD 产出技术设计方案。

1. 读取 docs/prd.md 全文
2. 创建 docs/design.md，写入以下章节：
   - `# 设计方案`
   - `## 架构概述`
   - `## 核心组件与职责`
   - `## 关键接口定义`
   - `## 数据模型`
   - `## 错误处理策略`
   - `## 与 PRD 验收标准的对应关系`
3. 写入 docs/design.md

### plan

你是技术负责人。任务：基于设计方案生成可执行的实施计划。

1. 读取 docs/design.md 全文
2. 创建 docs/plan.md，写入以下章节：
   - `# 实施计划`
   - `## 任务分解`（每个任务有明确交付物与验收标准）
   - `## 依赖关系`（任务间的执行顺序）
   - `## 风险点与应对`
   - `## 测试策略`
3. 写入 docs/plan.md

### implement

你是开发工程师。任务：按实施计划编码。

1. 读取 docs/plan.md 全文
2. 按任务分解逐个实现，每完成一个任务：
   - 用 TodoWrite 跟踪进度
   - 实现代码
   - 运行相关测试验证
3. 实现过程中若发现计划有问题，用 AskUserQuestion 询问用户是否回退到 plan 节点
4. 实现完成后，在会话中总结：修改的文件清单、每个任务的完成状态

### test

你是测试工程师。任务：验证实现满足验收标准。

1. 读取 docs/prd.md 的 `## 验收标准` 章节
2. 读取 docs/plan.md 的 `## 测试策略` 章节
3. 执行测试（运行已有测试、补充缺失测试、手动验证验收标准）
4. 在会话中输出测试报告：
   - 验收标准逐条核对结果
   - 测试覆盖率
   - 发现的问题与建议
````

- [ ] **Step 2: Verify against spec 5.3 template**

Manual checks:
- [ ] Frontmatter has `name: wf-prd-to-impl`, `description` (from source), `allowed-tools` (default list) ✓
- [ ] Body starts with `# 工作流：PRD 到实施` and executor instruction ✓
- [ ] `## 执行规则` section has TodoWrite setup with all 6 nodes ✓
- [ ] `## 执行规则` covers continue/回退/修改 flows per spec 5.3 ✓
- [ ] `## artifact 写入规则` matches spec 5.3 ✓
- [ ] `## 错误处理` section present (spec 6.6) ✓
- [ ] `## 节点定义` has `### <id>` sections in nodes-list order ✓
- [ ] All `{{artifacts.xxx}}` placeholders replaced with actual paths (e.g. `docs/prd.md`) ✓
- [ ] No `needs_review` logic in node prompt bodies (only in 执行规则) ✓

- [ ] **Step 3: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add .claude/skills/wf-prd-to-impl/SKILL.md
git rm --cached .claude/skills/wf-prd-to-impl/.gitkeep 2>/dev/null || true
git commit -m "feat: add hand-compiled wf-prd-to-impl skill reference"
```

---

## Task 5: Write hand-compiled reference `.claude/commands/wf-prd-to-impl.md`

**Files:**
- Create: `.claude/commands/wf-prd-to-impl.md`

Test oracle for the command artifact, following spec section 5.4 template.

- [ ] **Step 1: Write `.claude/commands/wf-prd-to-impl.md`**

File content:
```markdown
---
description: 启动 prd-to-impl 工作流
allowed-tools: Skill
---

启动工作流 `wf-prd-to-impl`。

使用 Skill 工具调用 `wf-prd-to-impl` skill 执行。参数：$ARGUMENTS（作为工作流输入上下文）。
```

- [ ] **Step 2: Verify against spec 5.4 template**

Manual checks:
- [ ] Frontmatter has `description: 启动 <name> 工作流` ✓
- [ ] Frontmatter has `allowed-tools: Skill` ✓
- [ ] Body instructs to invoke the `wf-prd-to-impl` skill with `$ARGUMENTS` ✓

- [ ] **Step 3: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add .claude/commands/wf-prd-to-impl.md
git commit -m "feat: add hand-compiled wf-prd-to-impl command reference"
```

---

## Task 6: Write the `wf-build` skill `.claude/skills/wf-build/SKILL.md`

**Files:**
- Create: `.claude/skills/wf-build/SKILL.md`

This is the core deliverable. It contains the create + compile instructions that, when followed by Claude, reproduce the hand-compiled artifacts from Tasks 4-5. It references `SCHEMA.md` for schema details rather than duplicating them.

- [ ] **Step 1: Write `.claude/skills/wf-build/SKILL.md`**

File content:
````markdown
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

对每个选中的产出物，询问路径（默认 `docs/<name>.md`）：
- 问题："<产出物名称> 的文件路径是什么？"
- 选项：["docs/prd.md"（或对应默认）, Other]

为每个产出物分配一个 key（如 prd、design、plan），用于后续 `{{artifacts.xxx}}` 占位符。

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

2. 用 AskUserQuestion 询问节点 prompt：
   - 问题："节点 `<id>` 的提示词是什么？描述这个节点要做什么、读什么、写什么。可以口语化，我会整理成结构化 prompt。"
   - 用 Other 让用户自由输入

3. 整理用户口述为结构化 prompt 段落：
   - 开头用"你是<角色>。任务：<概述>。"
   - 用编号列表写出具体步骤
   - 涉及产出物的地方，用 `{{artifacts.<key>}}` 占位符
   - 涉及读取上游产出物的地方，明确指示"读取 {{artifacts.<key>}} 的哪个章节"

### 步骤 4：组装并预览

把收集到的信息组装成 workflow.md 格式：
- frontmatter（name/description/triggers/artifacts/nodes）
- 正文（`# 工作流：<name>` + 每节点 `## <id>` 章节）

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
- 节点字段：id（必填）、needs_review（默认 false）
- 占位符：`{{artifacts.<key>}}`
- 校验规则：字段完整、name kebab-case、节点 id 唯一、正文章节与节点 id 一一对应、占位符可解析
````

- [ ] **Step 2: Verify create phase against spec 7.2**

Manual checks:
- [ ] Steps 1-4 match spec 7.2 flow (basic info → artifacts → nodes → confirm) ✓
- [ ] AskUserQuestion used for each interaction ✓
- [ ] Node prompt is structured by generator (not raw user input) ✓
- [ ] `{{artifacts.xxx}}` placeholders auto-inserted by generator ✓
- [ ] Confirm step offers modify/restart options ✓
- [ ] Post-create offers immediate compile ✓

- [ ] **Step 3: Verify compile phase against spec 5.2-5.4**

Manual checks:
- [ ] Step 1 (parse) matches spec 5.2 step 1 ✓
- [ ] Step 2 (validate) covers all 6 rules from SCHEMA.md validation section ✓
- [ ] Step 3 (replace placeholders) matches spec 5.2 step 3 ✓
- [ ] Step 4 (generate SKILL.md) template matches spec 5.3 exactly ✓
- [ ] Step 5 (generate command.md) template matches spec 5.4 exactly ✓
- [ ] Step 6 (write + report) matches spec 5.5 point 5 ✓
- [ ] Error handling: no files written on validation failure ✓

- [ ] **Step 4: Cross-check templates against Task 4-5 references**

Compare the SKILL.md template in wf-build/SKILL.md (step 4 of compile) against the actual `.claude/skills/wf-prd-to-impl/SKILL.md` from Task 4. They must produce identical structure when applied to `prd-to-impl`. If discrepancies found, fix the template in wf-build/SKILL.md (the hand-compiled reference in Task 4 is the ground truth).

- [ ] **Step 5: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add .claude/skills/wf-build/SKILL.md
git rm --cached .claude/skills/wf-build/.gitkeep 2>/dev/null || true
git commit -m "feat: add wf-build generator skill"
```

---

## Task 7: Write the `wf-build` command `.claude/commands/wf-build.md`

**Files:**
- Create: `.claude/commands/wf-build.md`

Thin entry command that activates the wf-build skill. Spec section 7 (薄入口).

- [ ] **Step 1: Write `.claude/commands/wf-build.md`**

File content:
```markdown
---
description: 工作流构建器 - 创建或编译工作流
allowed-tools: Skill
---

启动工作流构建器 `wf-build`。

使用 Skill 工具调用 `wf-build` skill。参数：$ARGUMENTS

- 无参数：进入引导菜单
- `create`：直接进入创建阶段
- `compile <name>`：编译指定工作流
```

- [ ] **Step 2: Verify**

Manual checks:
- [ ] Frontmatter has `description` and `allowed-tools: Skill` ✓
- [ ] Body activates the `wf-build` skill ✓
- [ ] Documents the three invocation forms (no-arg / create / compile) ✓

- [ ] **Step 3: Commit**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add .claude/commands/wf-build.md
git commit -m "feat: add wf-build entry command"
```

---

## Task 8: End-to-end validation

This task validates that the `wf-build` skill, when invoked to compile `prd-to-impl`, produces output matching the hand-compiled references from Tasks 4-5. This is the project's "integration test".

**No new files created** — this task only validates existing files.

- [ ] **Step 1: Back up hand-compiled references**

Run:
```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
cp .claude/skills/wf-prd-to-impl/SKILL.md /tmp/wf-prd-to-impl-SKILL.expected.md
cp .claude/commands/wf-prd-to-impl.md /tmp/wf-prd-to-impl-cmd.expected.md
```

Expected: files copied, no output

- [ ] **Step 2: Invoke wf-build compile in fresh Claude Code session**

Open a new Claude Code session in `/Users/wangbo/Develop/projects_ai/skills/workfolw_fly` and run:

```
/wf-build compile prd-to-impl
```

The wf-build skill should:
1. Read `.workflows/prd-to-impl.md`
2. Parse and validate
3. Replace placeholders
4. Generate `.claude/skills/wf-prd-to-impl/SKILL.md`
5. Generate `.claude/commands/wf-prd-to-impl.md`
6. Report success

If validation fails or errors occur, record the error message.

- [ ] **Step 3: Diff output against references**

Run:
```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
diff /tmp/wf-prd-to-impl-SKILL.expected.md .claude/skills/wf-prd-to-impl/SKILL.md
diff /tmp/wf-prd-to-impl-cmd.expected.md .claude/commands/wf-prd-to-impl.md
```

Expected: both diffs produce no output (files identical)

If diffs show discrepancies:
- If the generated output is wrong (e.g., missing section, wrong placeholder substitution), the `wf-build/SKILL.md` template instructions are unclear — fix them and re-run Step 2
- If the hand-compiled reference is wrong (rare, but possible if Task 4-5 had errors), fix the reference and re-run

- [ ] **Step 4: If fixes were made, commit them**

```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git add -A
git commit -m "fix: align wf-build templates with reference output" 2>/dev/null || echo "No changes needed"
```

- [ ] **Step 5: Clean up temp files**

Run:
```bash
rm /tmp/wf-prd-to-impl-SKILL.expected.md /tmp/wf-prd-to-impl-cmd.expected.md
```

- [ ] **Step 6: Final verification**

Run:
```bash
cd /Users/wangbo/Develop/projects_ai/skills/workfolw_fly
git log --oneline
ls -R .claude .workflows
```

Expected:
- 8 commits (one per task, possibly +1 if Step 4 fix commit)
- `.claude/commands/wf-build.md`, `.claude/commands/wf-prd-to-impl.md`
- `.claude/skills/wf-build/SKILL.md`, `.claude/skills/wf-prd-to-impl/SKILL.md`
- `.workflows/prd-to-impl.md`
- `SCHEMA.md`, `README.md`, `.gitignore`

---

## Self-Review

### Spec coverage check

| Spec section | Covered by |
|---|---|
| 1. Background & goals | README.md (Task 1) |
| 2. Boundary decisions | Embodied in all tasks |
| 3. Overall architecture | Project structure (Task 1) + wf-build skill (Task 6) |
| 4. workflow.md schema | SCHEMA.md (Task 2) + example (Task 3) |
| 5. Compiler | wf-build compile phase (Task 6) + references (Tasks 4-5) |
| 6. Runtime execution model | Compiled SKILL.md template (Task 4) + wf-build template (Task 6) |
| 7. Generator (wf-build) | wf-build SKILL.md (Task 6) + command (Task 7) |
| 8. Project directory structure | Task 1 |
| 9. First deliverables | Tasks 2-7 produce all three deliverables |
| 10. YAGNI list | Explicitly not implemented (no tasks) |
| 11. Feasibility | Analysis only, no tasks needed |

No gaps.

### Placeholder scan

No "TBD", "TODO", "implement later" in the plan. All file contents are complete. Templates in Task 6 use `<...>` placeholders as template variables (legitimate template syntax), not as plan placeholders.

### Type/name consistency

- `wf-build` used consistently as generator skill name
- `wf-<name>` / `wf-prd-to-impl` used consistently as compiled skill name
- `{{artifacts.xxx}}` placeholder syntax consistent across SCHEMA.md, example, and wf-build templates
- Node ids (clarify, prd, design, plan, implement, test) consistent across source, compiled reference, and TodoWrite list in compiled SKILL.md
- Default `allowed-tools` list consistent: `Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, TodoWrite, Skill`

### Risk mitigations

- **LLM frontmatter parsing**: SCHEMA.md keeps schema flat (no deep nesting), validation rules explicit
- **Compile output drift**: Task 8 end-to-end validation catches any drift between template and reference
- **Reference accuracy**: Hand-compiled artifacts in Tasks 4-5 serve as ground truth; Task 6 template must match them

No issues found. Plan is ready.
