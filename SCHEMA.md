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
| `skills` | list[string] | no | `[]` | Existing skills (kebab-case names) the node delegates core execution to. When non-empty, the compiler injects a Skill-tool call preamble before the node's prompt; the prompt body wraps the call (prepare args → invoke → merge output into artifacts). Skill existence is environment-dependent and not enforced at compile time. |

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
6. **Skills field format (if present)**: a node's `skills`, if present, must be a list of strings each matching `^[a-z0-9]+(-[a-z0-9]+)*$` (kebab-case), with no duplicates. Skill existence is environment-dependent and is **not** verified at compile time.

## Example

See `.workflows/prd-to-impl.md` for a complete example.
