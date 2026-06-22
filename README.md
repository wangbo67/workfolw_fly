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
- `SCHEMA.md` — workflow.md schema reference（含节点 `skills` 字段：节点可委托给已有 skill 执行）
- `specs/` — design and plan documents

See `specs/2026-06-17-workflow-builder-design.md` for full design.

## Skills 一览

| Skill | 说明 |
|-------|------|
| `wf-build` | 工作流构建器，交互式创建标准工作流并编译为 skill + command；节点可选推荐 prompt / 自定义 prompt / 调用现有 skill，artifact 路径可配置 |
| `wf-prd-to-impl` | 从需求澄清到实施落地的标准开发工作流 |
| `wf-code-review-fix` | 代码审查与修复工作流，review 节点委托 `code-review` skill 并补充人工检查 |
| `git-commit-cluster` | 将杂乱 git 变更依功能逻辑拆分为多个 conventional commit |
| `git-pr-draft` | 根据分支差异自动生成 PR 标题与描述 |
| `git-worktree-planner` | 分析需求并拆分为多个 feature branch 并行开发 |
| `ui-ux-pro-max` | UI/UX 设计智能（样式、配色、字体、图表、技术栈） |
| `web-design-engineer` | 构建精美可视化的 Web 前端产物（页面、仪表盘、原型、动画等） |
| `unit-test-gen` | 系统化方法论生成高质量单元测试（Java/JUnit5，可扩展） |

新增 skill 只需在 `.claude/skills/<name>/SKILL.md` 写好 frontmatter，欢迎页目录会自动收录（见下文 Welcome App）。

## Welcome App（Skills 欢迎页）

仓库根目录内建一个 Vite + React + TypeScript 前端应用，作为 skills 的欢迎页与目录展示。

```bash
npm install          # 安装依赖
npm run gen-skills   # 扫描 .claude/skills/*/SKILL.md，生成 src/data/skills.json
npm run dev          # 启动开发服务器（会先自动执行 gen-skills）
npm run build        # 构建生产包（会先自动执行 gen-skills）
npm run preview      # 预览构建产物
```

### 功能

- **欢迎介绍区**：应用简介与「浏览 skills」CTA，点击平滑滚动到目录
- **Skill 目录卡片网格**：响应式布局（手机单列 / 平板两列 / 桌面三列），列出所有 skill 的名称与描述，支持长描述展开收起
- **跳转 GitHub 目录**：点击任一 skill 卡片，在新分页打开该 skill 在 GitHub 仓库的对应目录页

### 数据链路

`src/data/skills.json` 由 `scripts/gen-skills.mjs` 在 dev / build 前自动生成（已在 `.gitignore` 中忽略）：

- 扫描 `.claude/skills/*/SKILL.md`，解析 YAML frontmatter 的 `name` / `description`
- 通过 `git remote get-url origin` 推导 GitHub 仓库地址（兼容 https 与 ssh 格式），为每个 skill 生成 `githubUrl`
- 新增 skill 后重新跑 `npm run gen-skills` 即可自动出现在欢迎页目录，换仓库无需改代码

仓库地址、默认分支、skills 目录路径集中配置在 `src/config.ts`，可通过环境变量 `VITE_GITHUB_REPO_URL` 覆盖默认 repo URL。


