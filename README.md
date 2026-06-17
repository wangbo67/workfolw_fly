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
