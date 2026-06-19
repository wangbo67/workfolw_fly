# Feature Spec: Skill GitHub Link（卡片跳转 GitHub 目录）

> 此文件由 Git Worktree Design Skill 自动产生，供 AI Agent 作为开发指引。

## 分支资讯

| 项目 | 值 |
|------|-----|
| 分支名称 | `feature/skill-github-link` |
| 基于分支 | `main`（9688f6f） |
| Worktree 路径 | `/Users/wangbo/Develop/projects_ai/skills/workfolw_fly-skill-github-link` |
| 建立时间 | 2026-06-19 20:47:02 +0800 |

## 目标

点击欢迎页 skill 目录中任一卡片，在新分页打开该 skill 在 GitHub 仓库的对应目录页。让使用者从本地欢迎页快速跳转到 GitHub 上查看 skill 源码与历史。

## 实作范围

- [ ] 新增配置文件 `src/config.ts`：
      - 导出 `githubRepoUrl`：优先取环境变量 `VITE_GITHUB_REPO_URL`，否则取默认值 `https://github.com/wang67/workfolw_fly`
      - 导出 `defaultBranch`：默认 `'main'`
      - 导出 `skillsBasePath`：默认 `'.claude/skills'`
- [ ] 修改 `scripts/gen-skills.mjs`：
      - 执行 `git remote get-url origin` 推导 owner/repo（兼容 https 与 ssh URL 格式）
      - 为每个 skill 生成 `githubUrl`：`${repoUrl}/tree/${branch}/${skillsBasePath}/${skillName}`
      - 无远端时 `githubUrl` 回退为空字符串
      - 写入 `skills.json`，每个条目含 `name` / `description` / `githubUrl`
- [ ] 修改 `src/lib/skills.ts`：
      - `SkillMeta` 新增 `githubUrl: string` 字段
- [ ] 修改 `src/components/SkillCatalog.tsx`：
      - `SkillCard` 整体改为 `<a>` 元素（`href={githubUrl}`、`target="_blank"`、`rel="noreferrer"`）
      - 保留描述截断 / 展开逻辑（点击展开按钮时 `stopPropagation` + `preventDefault`，避免同时触发跳转）
      - `githubUrl` 为空时降级为不可点击的 `<div>`（无 href）
      - hover 态强化（已有 -translate-y / shadow，新增 cursor-pointer 与外链指示）
- [ ] 卡片标题旁加外链图标（内联 SVG），提示可跳转

## 验收标准

- 访问 `/`，skill 目录每张卡片可点击
- 点击任一卡片在新分页打开，URL 形如 `https://github.com/wang67/workfolw_fly/tree/main/.claude/skills/git-pr-description`，且该目录在 GitHub 上确实存在
- 卡片 hover 有明显可交互反馈（cursor pointer、抬升、外链图标）
- 描述超长的卡片，点击「展开/收起」按钮只切换展开状态，不触发跳转
- `npm run gen-skills` 产出的 `skills.json` 每条目含正确的 `githubUrl`
- `npm run build` 通过，无 TypeScript 错误

## 技术约束

- GitHub URL 在**构建期由 gen-skills 脚本生成**，前端只消费 `githubUrl` 字段，不在运行时拼接
- repo URL / 分支 / skills 路径通过 `src/config.ts` 集中配置，不硬编码在多处
- 不引入新的 npm 依赖（外链图标用内联 SVG）
- 保持现有响应式网格、空状态处理与展开逻辑不变
- git remote URL 解析须兼容 https（`https://github.com/owner/repo.git`）与 ssh（`git@github.com:owner/repo.git`）两种格式

## 跨分支备注

- 无并行分支，独立开发后直接合并 main
- 本分支改动集中在 `gen-skills.mjs`、`skills.ts`、`SkillCatalog.tsx`，新增 `config.ts`，与既有代码接触面小，合并冲突风险低
- 合并后建议在 main 上 `npm run build` 验证 URL 正确性
