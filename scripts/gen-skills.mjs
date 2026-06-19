// scripts/gen-skills.mjs
// 扫描 .claude/skills/*/SKILL.md，解析 YAML frontmatter 的 name / description，
// 并结合 git remote 推导每个 skill 的 GitHub 目录 URL，
// 输出 src/data/skills.json，供前端 loadSkills() 消费。
// 在 dev / build 前通过 predev / prebuild 钩子自动执行。

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const skillsDir = join(repoRoot, '.claude', 'skills')
const outPath = join(repoRoot, 'src', 'data', 'skills.json')

// 配置（与 src/config.ts 保持一致；脚本侧无法 import .ts，故内联默认值）
const DEFAULT_BRANCH = 'main'
const SKILLS_BASE_PATH = '.claude/skills'

/**
 * 从 git remote 推导 GitHub 仓库 URL（无尾斜杠）。
 * 兼容 https 与 ssh 两种格式：
 *   https://github.com/owner/repo(.git)
 *   git@github.com:owner/repo(.git)
 * 无远端时回退为空字符串。
 */
function resolveGithubRepoUrl() {
  let remoteUrl
  try {
    remoteUrl = execSync('git remote get-url origin', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return '' // 无远端
  }
  if (!remoteUrl) return ''

  let match
  // ssh: git@github.com:owner/repo.git
  match = remoteUrl.match(/^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/)
  if (match) return `https://${match[1]}/${match[2]}/${match[3]}`
  // https: https://github.com/owner/repo.git
  match = remoteUrl.match(/^https:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/)
  if (match) return `https://${match[1]}/${match[2]}/${match[3]}`
  // 已是 https 且无 .git
  if (/^https:\/\//.test(remoteUrl)) return remoteUrl.replace(/\/+$/, '')
  return ''
}

const repoUrl = resolveGithubRepoUrl()

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
  const githubUrl = repoUrl
    ? `${repoUrl}/tree/${DEFAULT_BRANCH}/${SKILLS_BASE_PATH}/${name}`
    : ''
  entries.push({ name, description, githubUrl })
}

// 按名称排序，保证输出稳定
entries.sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(entries, null, 2) + '\n', 'utf8')

console.log(
  `[gen-skills] 已生成 ${entries.length} 个 skill 到 ${outPath}` +
    (repoUrl ? `（repo: ${repoUrl}）` : '（未检测到 git 远端，githubUrl 为空）'),
)
