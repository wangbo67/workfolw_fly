import { Link, Outlet } from 'react-router-dom'
import { githubRepoUrl } from '../config'

/**
 * App shell：header + 主内容区 + footer。
 * 主内容由路由的 <Outlet /> 渲染。
 */
export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-surface-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-ink">
            workfolw_fly · Skills
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink-muted">
            <Link to="/" className="hover:text-brand">首页</Link>
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-surface-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-4 text-sm text-ink-muted">
          © {new Date().getFullYear()} workfolw_fly — Workflow builder for Claude Code
        </div>
      </footer>
    </div>
  )
}
