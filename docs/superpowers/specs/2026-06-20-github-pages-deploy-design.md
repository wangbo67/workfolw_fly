# GitHub Pages 部署设计

- **日期**: 2026-06-20
- **目标**: 将现有 Vite + React + TypeScript 的 Welcome App 通过 GitHub Actions 自动构建并发布到 GitHub Pages，供网络用户访问。
- **访问地址**: `https://wangbo67.github.io/workfolw_fly/`
- **触发**: push 到 `main` 自动部署；支持手动触发。

## 1. 背景与现状

仓库 `wangbo67/workfolw_fly` 已内建一个 Vite + React + TS 的 Skills 欢迎页应用：

- 构建命令 `npm run build`（`tsc -b && vite build`），产物在 `dist/`。
- `prebuild` 钩子自动执行 `npm run gen-skills`，扫描 `.claude/skills/*/SKILL.md` 生成 `src/data/skills.json`，因此部署产物中的 skills 目录始终是最新的，且 `skills.json` 本就被 gitignore，无需手动提交。
- 路由使用 `react-router-dom` 的 `createBrowserRouter`（`src/main.tsx`），当前仅有首页一个路由。
- 仓库地址 `https://github.com/wangbo67/workfolw_fly`，默认作为**项目页**部署在子路径 `/workfolw_fly/` 下。
- `dist/` 与 `docs/` 均被 `.gitignore` 忽略，因此无法用「从分支部署 /docs」或「提交 dist」方式，必须用 GitHub Actions 构建并发布。

参考项目 `datawhalechina/all-in-rag`（`https://datawhalechina.github.io/all-in-rag`）使用 docsify 零构建方案，但本项目已有构建型 React 应用，故不复用其方案。

## 2. 整体架构与部署链路

```
push main
  → Actions: checkout
  → setup-node@v4 (node 20, cache npm)
  → npm ci
  → npm run build        # prebuild 自动跑 gen-skills → 生成 skills.json → tsc -b && vite build → dist/
  → upload-pages-artifact(dist)
  → deploy-pages         # 发布到 GitHub Pages
  → https://wangbo67.github.io/workfolw_fly/
```

**权限**：workflow 使用 `permissions: contents: read, pages: write, id-token: write`，部署用官方 `actions/deploy-pages@v4`（基于 OIDC，无需 PAT）。

**一次性人工前置动作**（必须由仓库所有者在浏览器完成）：仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。不切换则 workflow 无法发布。

## 3. 子路径适配（核心风险点）

项目页部署在 `/workfolw_fly/` 子路径下。若不适配会出现：静态资源 404（`/assets/...` 找不到，真实路径 `/workfolw_fly/assets/...`）与刷新/直接访问路由 404。

### 3.1 vite base

`vite.config.ts` 增加 `base: '/workfolw_fly/'`（Vite 规范要求首尾斜杠）。`import.meta.env.BASE_URL` 在 build 时解析为 `'/workfolw_fly/'`，dev 时为 `'/'`。

### 3.2 路由 basename

`src/main.tsx` 的 `createBrowserRouter` 增加 `basename: import.meta.env.BASE_URL`，dev/prod 一套代码自动适配。

### 3.3 静态资源

[index.html](../../../index.html) 中 `href="/vite.svg"` 为根绝对路径，子路径部署会 404。改为相对引用 `vite.svg`（去掉前导斜杠）。注意：仓库根目录实际不存在 `vite.svg` 文件，实施时一并确认是否需要补充该文件或直接移除 `<link>` 引用（`src/` 内无其它硬编码 `/` 资源引用，已确认）。[config.ts](../../../src/config.ts) 的 `skillsBasePath` 是仓库内路径而非 URL，不受影响。

### 3.4 为何不用 HashRouter

HashRouter（`/#/`）可省去 `basename` 配置且无刷新 404 风险，但会污染 URL。当前仅首页单路由，BrowserRouter + `basename` 已足够，URL 更干净。若后续新增多路由且担心 SPA 刷新 404，再评估加 `404.html` fallback。

## 4. GitHub Actions Workflow

新增 `.github/workflows/deploy-pages.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**设计要点**：

- `npm ci` 依赖已提交的 `package-lock.json`，确定性安装。
- `npm run build` 触发 `prebuild` → `gen-skills`，保证部署目录为最新 skills。
- `cache: npm` 加速后续构建。
- build/deploy 拆两 job：deploy 跑在 `github-pages` environment，`deploy-pages@v4` 需要 environment 上下文，`url` 输出会在 Actions 总结页显示站点链接。
- `concurrency` 防止连续 push 导致部署交错。
- `workflow_dispatch` 便于首次部署或重试，无需等下次 push。

## 5. 顺带修正

修正 [src/config.ts](../../../src/config.ts) 第 15 行 repo URL 笔误：`'https://github.com/wang67/workfolw_fly'` → `'https://github.com/wangbo67/workfolw_fly'`。该值是 gen-skills 脚本无远端时的回退默认值（脚本优先用 `git remote get-url origin` 推导真实 URL），但运行时回退值与远端真实 URL 不一致仍是 bug，应修正。

## 6. 测试与验证

- **本地验证**：`npm run build` 成功；`npm run preview` 确认 `base` 生效、资源无 404。
- **CI 验证**：推送 workflow 后在 Actions 页确认 build/deploy 两 job 通过；浏览器访问 `https://wangbo67.github.io/workfolw_fly/`。
- **回归确认**：首页 Skills 目录正常渲染（验证 gen-skills 在 CI 跑通）；静态资源（svg）无 404。
- 不引入额外测试框架——部署任务，YAGNI。

## 7. 范围之外（YAGNI）

明确不做：自定义域名、CNAME、CDN、多语言、SEO 优化、SPA `404.html` fallback、Vite/依赖升级。

## 8. 改动清单

| 文件 | 改动 |
|------|------|
| `.github/workflows/deploy-pages.yml` | 新增构建+部署 workflow |
| `vite.config.ts` | 增加 `base: '/workfolw_fly/'` |
| `src/main.tsx` | `createBrowserRouter` 增加 `basename: import.meta.env.BASE_URL` |
| `index.html` | `/vite.svg` 改为相对引用 `vite.svg`；若根目录无该文件则移除 `<link>` |
| `src/config.ts` | 修正 repo URL 笔误 `wang67` → `wangbo67` |
| 仓库 Settings | Pages Source 切换为 GitHub Actions（人工一次性） |
