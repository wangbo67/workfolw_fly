/**
 * 前端运行时配置。
 *
 * GitHub repo URL / 默认分支 / skills 目录路径集中于此，
 * 供构建期 gen-skills 脚本与前端共享默认值。
 * 注意：gen-skills 脚本会优先用 `git remote get-url origin` 推导真实 repo URL，
 * 这里的 githubRepoUrl 仅作为脚本无远端时的回退默认值。
 */

/** GitHub 仓库 URL（无尾斜杠），可由 VITE_GITHUB_REPO_URL 覆盖 */
export const githubRepoUrl = (
  import.meta.env.VITE_GITHUB_REPO_URL ?? 'https://github.com/wangbo67/workfolw_fly'
).replace(/\/+$/, '')

/** 默认分支名 */
export const defaultBranch = 'main'

/** skills 在仓库中的基础路径 */
export const skillsBasePath = '.claude/skills'
