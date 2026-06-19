// scripts/gen-skills.mjs
// 扫描 .claude/skills/*/SKILL.md，解析 YAML frontmatter 的 name / description，
// 输出 src/data/skills.json，供前端 loadSkills() 消费。
// 在 dev / build 前通过 predev / prebuild 钩子自动执行。

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const skillsDir = join(repoRoot, '.claude', 'skills')
const outPath = join(repoRoot, 'src', 'data', 'skills.json')

const entries = []
for (const dir of readdirSync(skillsDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  const skillFile = join(skillsDir, dir.name, 'SKILL.md')
  let raw
  try {
    raw = readFileSync(skillFile, 'utf8')
  } catch {
    continue // 无 SKILL.md 的目录跳过
  }
  const { data } = matter(raw)
  const name = typeof data.name === 'string' ? data.name.trim() : dir.name
  const description =
    typeof data.description === 'string' ? data.description.trim() : ''
  if (!name) continue
  entries.push({ name, description })
}

// 按名称排序，保证输出稳定
entries.sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(entries, null, 2) + '\n', 'utf8')

console.log(`[gen-skills] 已生成 ${entries.length} 个 skill 到 ${outPath}`)
