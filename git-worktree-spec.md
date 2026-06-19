# Feature Spec: Skill Welcome（欢迎页内容）

> 此文件由 Git Worktree Design Skill 自动产生，供 AI Agent 作为开发指引。

## 分支资讯

| 项目 | 值 |
|------|-----|
| 分支名称 | `feature/skill-welcome` |
| 基于分支 | `main`（b54e1fd） |
| Worktree 路径 | `/Users/wangbo/Develop/projects_ai/skills/workfolw_fly-skill-welcome` |
| 建立时间 | 2026-06-19 17:25:10 +0800 |

## 目标

实现欢迎页的实际内容——欢迎介绍区（WelcomeHero）与 skill 目录卡片网格（SkillCatalog），组合进 `/` 路由页面。让使用者在打开应用时看到「欢迎使用 skills」的介绍，并能浏览所有可用 skill 的目录卡片。

## 实作范围

- [ ] **前置**：将本分支 rebase 到合并了 `feature/app-scaffold` 的最新 main，确保 `loadSkills()`、`SkillMeta`、设计 token、`Welcome.tsx` 骨架均已存在
- [ ] 实现 `src/components/WelcomeHero.tsx`：
      - 大标题（应用名 / 欢迎语）
      - 一段简述：说明本仓库提供哪些 skills、如何使用
      - CTA 按钮（如「浏览 skills」滚动到目录区 / 跳转文档）
      - 使用 scaffold 的设计 token，响应式
- [ ] 实现 `src/components/SkillCatalog.tsx`：
      - 调用 `loadSkills()` 取得 `SkillMeta[]`
      - 以响应式卡片网格渲染（手机单列、平板两列、桌面三列）
      - 每张卡显示 skill 的 `name`（标题）与 `description`（正文，可截断 + 展开）
      - 卡片 hover 反馈（阴影 / 边框 / 微抬升）
      - 空状态处理（无 skill 时显示提示）
- [ ] 修改 `src/pages/Welcome.tsx`：将占位的 hero 区与目录区替换为 `<WelcomeHero />` 与 `<SkillCatalog />`
- [ ] 检查 `npm run gen-skills` 产出的 `src/data/skills.json` 数据，确认卡片渲染内容与实际 skills 一致

## 验收标准

- 访问 `/` 路由，首屏看到 WelcomeHero：标题、简介、CTA 按钮，CTA 可点击（滚动到目录区或跳转）
- 下方 SkillCatalog 以卡片网格列出 `.claude/skills/` 下全部 skill，每张卡显示 name 与 description
- 响应式：手机宽度单列、桌面宽度三列，无横向溢出
- 卡片 hover 有明显视觉反馈
- 当 `loadSkills()` 返回空数组时，目录区显示友好的空状态提示而非空白
- `npm run build` 通过，无 TypeScript 类型错误

## 技术约束

- 复用 `feature/app-scaffold` 的设计 token（配色 / 间距 / 字体），**不重复定义**配色变量
- skill 目录数据**全部来自 `loadSkills()`**，不得硬编码 skill 列表——保证新增 skill 后重新 `gen-skills` 即可自动出现在目录
- 不引入新的 npm 依赖（图标等用 Tailwind / 内联 SVG 实现）
- 组件保持纯展示，数据获取通过 `loadSkills()` 同步导入 JSON，无需异步状态管理

## 跨分支备注

- **硬依赖** `feature/app-scaffold`：需要其 `loadSkills()`、`SkillMeta` 类型、设计 token、`Welcome.tsx` 页面骨架
- 与 app-scaffold 的唯一文件接触面是 `src/pages/Welcome.tsx`（替换占位区）——若 app-scaffold 已合并且占位注释清晰，冲突可控
- **开发顺序建议**：等 `feature/app-scaffold` 合并进 main 后，本分支 `git rebase main` 再开始实现，避免在过时基础上开发导致返工
- 本分支合并后，欢迎页即功能完整；后续可在此基础上扩展单 skill 详情页（不在本次范围）
