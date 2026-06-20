# GitHub Pages 部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 Vite + React + TypeScript 的 Welcome App 通过 GitHub Actions 自动构建并发布到 GitHub Pages，访问地址 `https://wangbo67.github.io/workfolw_fly/`。

**Architecture:** push 到 `main` 触发 workflow → `npm ci` → `npm run build`（prebuild 自动跑 gen-skills 生成 skills.json）→ upload-pages-artifact(dist) → deploy-pages 发布。子路径部署通过 Vite `base` + 路由 `basename` 适配，dev/prod 一套代码。

**Tech Stack:** Vite 5, React 18, react-router-dom 6, TypeScript 5, GitHub Actions（actions/deploy-pages@v4 + upload-pages-artifact@v3 + setup-node@v4 + checkout@v4）。

**Spec:** [docs/superpowers/specs/2026-06-20-github-pages-deploy-design.md](../specs/2026-06-20-github-pages-deploy-design.md)

---

## File Structure

| 文件 | 责任 | 操作 |
|------|------|------|
| `.github/workflows/deploy-pages.yml` | CI 构建 + 部署到 Pages | Create |
| `vite.config.ts` | 配置 `base` 子路径 | Modify |
| `src/main.tsx` | 路由 `basename` 适配 | Modify |
| `index.html` | 移除不存在的 `/vite.svg` 引用 | Modify |
| `src/config.ts` | 修正 repo URL 笔误 | Modify |

> **说明**：这是部署/配置任务，不引入新源码逻辑，因此没有传统单元测试。验证以「构建成功 + 本地预览 + CI 通过 + 站点可访问」为准。每个改动后立即本地构建验证，相当于该任务的「测试」。

---

### Task 1: 配置 Vite 子路径 base

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: 修改 vite.config.ts 增加 base**

将 `vite.config.ts` 全文替换为：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// base 设为 GitHub Pages 项目子路径，使构建产物资源引用带 /workfolw_fly/ 前缀。
// dev 时 import.meta.env.BASE_URL 解析为 '/'，build 时解析为 '/workfolw_fly/'。
export default defineConfig({
  plugins: [react()],
  base: '/workfolw_fly/',
  server: {
    port: 5173,
    open: true,
  },
})
```

- [ ] **Step 2: 验证 base 生效**

Run: `npm run build`
Expected: 构建成功，输出中 `dist/index.html` 内资源引用以 `/workfolw_fly/assets/` 开头。

确认方式：

```bash
grep -o '/workfolw_fly/assets/[^"]*' dist/index.html | head
```

Expected: 至少输出一行形如 `/workfolw_fly/assets/index-XXXX.js`。

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "build: 配置 vite base 为 GitHub Pages 子路径 /workfolw_fly/"
```

---

### Task 2: 路由 basename 适配

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: 为 createBrowserRouter 增加 basename**

将 `src/main.tsx` 第 8-16 行的 router 定义替换为：

```tsx
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Welcome /> },
      ],
    },
  ],
  {
    // 复用 vite base：dev 为 '/'，build 为 '/workfolw_fly/'
    basename: import.meta.env.BASE_URL,
  },
)
```

- [ ] **Step 2: 验证类型检查与构建**

Run: `npm run build`
Expected: `tsc -b` 无类型错误，`vite build` 成功，产出 `dist/`。

- [ ] **Step 3: 本地预览验证路由**

Run: `npm run preview`
Expected: Vite 在 `http://localhost:4173/workfolw_fly/` 启动（preview 按配置的 base 提供服务），浏览器打开后首页正常渲染，无 404。

验证后按 Ctrl+C 停止。

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat(router): 路由 basename 复用 vite base 适配子路径部署"
```

---

### Task 3: 移除不存在的 vite.svg 引用

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 移除 index.html 中的 favicon link**

仓库根目录与 public/ 均不存在 `vite.svg`（已确认 `git ls-files | grep svg` 无输出），子路径部署下该引用必然 404。删除 `index.html` 第 5 行：

删除这一行：
```html
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

修改后 `<head>` 内容为：

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skills 欢迎页</title>
  </head>
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 构建成功，`dist/index.html` 中不再出现 `vite.svg`。

```bash
! grep -q vite.svg dist/index.html && echo "OK: no vite.svg"
```
Expected: 输出 `OK: no vite.svg`。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: 移除不存在的 vite.svg favicon 引用"
```

---

### Task 4: 修正 config.ts repo URL 笔误

**Files:**
- Modify: `src/config.ts`

- [ ] **Step 1: 修正 repo URL**

将 `src/config.ts` 第 12 行：

```ts
  import.meta.env.VITE_GITHUB_REPO_URL ?? 'https://github.com/wang67/workfolw_fly'
```

改为：

```ts
  import.meta.env.VITE_GITHUB_REPO_URL ?? 'https://github.com/wangbo67/workfolw_fly'
```

（`wang67` → `wangbo67`，与 git remote `https://github.com/wangbo67/workfolw_fly.git` 一致。）

- [ ] **Step 2: 验证构建与类型检查**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 3: Commit**

```bash
git add src/config.ts
git commit -m "fix(config): 修正回退 repo URL 笔误 wang67 -> wangbo67"
```

---

### Task 5: 新增 GitHub Pages 部署 Workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: 创建 workflow 文件**

创建 `.github/workflows/deploy-pages.yml`，内容：

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

- [ ] **Step 2: 本地 YAML 语法校验**

Run: `node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/deploy-pages.yml','utf8')); console.log('YAML OK')"`
Expected: 输出 `YAML OK`。

（若本机无 js-yaml，回退：）Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy-pages.yml')); print('YAML OK')"`
Expected: 输出 `YAML OK`。

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "ci: 新增 GitHub Pages 构建部署 workflow"
```

---

### Task 6: 人工设置 Pages Source + 推送触发首次部署

> 这一步包含必须由仓库所有者在浏览器完成的动作。agent 完成不了 GitHub 仓库 Settings 的切换，需明确告知用户。

**Files:** 无（仓库 Web 设置）

- [ ] **Step 1: 推送所有改动到 main**

Run: `git push origin main`
Expected: 推送成功，GitHub 仓库收到 push。

- [ ] **Step 2: [人工] 切换 Pages Source 为 GitHub Actions**

在浏览器打开 `https://github.com/wangbo67/workfolw_fly/settings/pages`：
1. **Build and deployment → Source** 下拉选择 **GitHub Actions**。
2. 保存。

> 说明：必须先切换 Source 为 GitHub Actions，否则 Task 5 的 workflow 即使触发也无法部署（Pages 不接受 deploy-pages 写入）。这是 spec §2 标注的一次性人工前置动作。

- [ ] **Step 3: [人工] 触发并确认 workflow 运行**

推送后 workflow 会自动触发；若需手动触发，到 `https://github.com/wangbo67/workfolw_fly/actions/workflows/deploy-pages.yml` 点 **Run workflow**。

确认：
- Actions 页面 `Deploy to GitHub Pages` 运行的 build 与 deploy 两 job 均为绿色 ✓。
- deploy job 摘要处显示 `page_url`：`https://wangbo67.github.io/workfolw_fly/`。

- [ ] **Step 4: [人工] 访问站点验证**

浏览器打开 `https://wangbo67.github.io/workfolw_fly/`，确认：
- 首页正常渲染（Skills 欢迎页）。
- Skills 目录卡片正常显示（验证 gen-skills 在 CI 跑通，skills.json 已生成）。
- 浏览器 DevTools Network 面板无 404（assets、svg 等）。

- [ ] **Step 5: 记录结果**

无需 commit。若一切正常，部署完成；若 deploy job 报错，根据 Actions 日志排查（常见：Pages Source 未切换为 GitHub Actions、permission 不足）。

---

## Self-Review

**1. Spec coverage:**
- §2 部署链路 → Task 5（workflow）+ Task 6（Pages Source + 推送）。✓
- §3.1 vite base → Task 1。✓
- §3.2 路由 basename → Task 2。✓
- §3.3 静态资源 vite.svg → Task 3（确认文件不存在，故移除而非相对引用）。✓
- §3.4 HashRouter 不采用 → 无需任务，已说明。✓
- §4 workflow 完整内容 → Task 5。✓
- §5 config.ts 笔误修正 → Task 4（注：spec 写的「第 15 行」实际为第 12 行，已按真实行号执行）。✓
- §6 测试验证 → 各 Task 的 build/preview 步骤 + Task 6 的 CI/站点验证。✓
- §8 改动清单 → 5 个文件改动均有对应 Task。✓

**2. Placeholder scan:** 无 TBD/TODO；每个 code step 都给出完整代码；命令均含 expected output。✓

**3. Type/命名一致性:** `createBrowserRouter` 第二参数 `{ basename: import.meta.env.BASE_URL }` 为 react-router-dom v6 既有 API，签名正确；workflow 中 `steps.deployment.outputs.page_url` 与 `id: deployment` 对应一致。✓

无遗留问题。
