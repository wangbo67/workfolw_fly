# Feature Spec: App Scaffold（前端应用脚手架）

> 此文件由 Git Worktree Design Skill 自动产生，供 AI Agent 作为开发指引。

## 分支资讯

| 项目 | 值 |
|------|-----|
| 分支名称 | `feature/app-scaffold` |
| 基于分支 | `main`（b54e1fd） |
| Worktree 路径 | `/Users/wangbo/Develop/projects_ai/skills/workfolw_fly-app-scaffold` |
| 建立时间 | 2026-06-19 17:25:10 +0800 |

## 目标

从零搭建一个可运行的前端应用，建立路由、布局与设计 token，并提供读取 skills 元数据的共享工具 `loadSkills()`，作为 `feature/skill-welcome` 分支开发欢迎页内容的基础。本分支是整个前端应用的基石，欢迎页面的实际内容（hero 区、skill 目录区）由 `feature/skill-welcome` 实现，本分支仅提供占位区块确保应用可构建可运行。

## 实作范围

- [ ] 初始化 Vite + React + TypeScript 项目（在 worktree 根目录生成 `package.json`、`vite.config.ts`、`tsconfig.json`、`index.html`、`src/main.tsx`、`src/App.tsx`）
- [ ] 配置 Tailwind CSS（`tailwind.config.ts`、`postcss.config.js`、`src/index.css` 引入 tailwind 指令）
- [ ] 安装依赖：`npm install`，并安装 `react-router-dom`、`tailwindcss`、`postcss`、`autoprefixer`
- [ ] 建立设计 token：在 `tailwind.config.ts` 定义配色（主色 / 中性色 / 背景色）、间距、字体族、圆角等 token
- [ ] 实现 App shell 布局组件 `src/components/Layout.tsx`：header（应用名 + 导航）+ 主内容区 + footer
- [ ] 配置 React Router：`/` → 欢迎页路由（占位内容）
- [ ] 创建欢迎页路由组件 `src/pages/Welcome.tsx`，内含 hero 占位区与 skill 目录占位区（带注释标明由 skill-welcome 分支替换）
- [ ] 实现共享工具 `src/lib/skills.ts`：
      - 导出 `SkillMeta` 类型（`{ name: string; description: string }`）
      - 导出 `loadSkills()`：读取 skills 元数据
      - 由于前端无法直接扫描文件系统，需提供构建期数据生成方案：写一个 `scripts/gen-skills.mjs` 脚本，扫描 `.claude/skills/*/SKILL.md`，解析 YAML frontmatter 的 `name` / `description`，输出 `src/data/skills.json`；在 `npm run build` / `dev` 前通过 `predev` / `prebuild` 钩子自动执行
      - `loadSkills()` 改为 `import skills from '../data/skills.json'` 并返回类型化结果
- [ ] 更新 `.gitignore`：补充 `node_modules/`、`dist/`
- [ ] 更新 `README.md`：补充前端开发指令（`npm install`、`npm run dev`、`npm run build`、`npm run gen-skills`）

## 验收标准

- 在 worktree 目录执行 `npm install` 成功，无依赖错误
- 执行 `npm run dev`，浏览器访问根路由 `/` 可看到 App shell（header / footer）与占位的欢迎页（hero 占位区 + 目录占位区），控制台无报错
- 执行 `npm run build` 构建通过，产出 `dist/`
- 执行 `npm run gen-skills` 后 `src/data/skills.json` 正确包含 `.claude/skills/` 下所有 skill 的 `name` 与 `description`（数量与实际 skill 目录一致）
- `loadSkills()` 返回的数组长度等于 skill 目录数量，类型为 `SkillMeta[]`

## 技术约束

- 不引入 UI 组件库（仅用 Tailwind 原子类），保持轻量
- skill 元数据读取须兼容 frontmatter 的多种缩进与引号风格（用稳健的 YAML 解析，可引入 `yaml` 或 `gray-matter`）
- `loadSkills()` 的数据来源必须与 `.claude/skills/` 目录结构解耦——通过生成脚本桥接，前端只消费 JSON
- 设计 token 须可在 `feature/skill-welcome` 分支直接复用，不重复定义
- 保持与既有仓库（skills / workflows / docs）目录结构互不干扰；前端文件集中在 worktree 根目录的 `src/`、`scripts/`、配置文件

## 跨分支备注

- 本分支是 `feature/skill-welcome` 的**硬依赖**：后者需要本分支的 `loadSkills()`、`SkillMeta` 类型、设计 token、路由与 `Welcome.tsx` 页面骨架
- `Welcome.tsx` 中预留 hero 占位区与目录占位区（带明确注释），`feature/skill-welcome` 将替换这两个占位为真实组件，是两分支的唯一文件接触面
- **建议合并顺序**：本分支（app-scaffold）必须先合并进 main，`feature/skill-welcome` 再 rebase 到最新 main 后开发，以避免冲突
- 合并本分支后，建议在 main 上验证 `npm run dev` 可正常运行，再开始 skill-welcome 的开发
