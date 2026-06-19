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

## Welcome App（Skills 欢迎页）

仓库根目录内建一个 Vite + React + TypeScript 前端应用，作为 skills 的欢迎页与目录展示。

```bash
npm install          # 安装依赖
npm run gen-skills   # 扫描 .claude/skills/*/SKILL.md，生成 src/data/skills.json
npm run dev          # 启动开发服务器（会先自动执行 gen-skills）
npm run build        # 构建生产包（会先自动执行 gen-skills）
npm run preview      # 预览构建产物
```

`src/data/skills.json` 由 `scripts/gen-skills.mjs` 生成，已在 `.gitignore` 中忽略，新增 skill 后重新跑 `npm run gen-skills` 即可自动出现在欢迎页目录。

