/**
 * 欢迎介绍区：标题、skills 简介、CTA 按钮。
 * CTA 点击后平滑滚动到 skill 目录区（#skill-catalog）。
 */
export function WelcomeHero() {
  const scrollToCatalog = () => {
    document
      .getElementById('skill-catalog')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="rounded-card border border-surface-border bg-gradient-to-br from-brand-50 to-surface p-10 text-center sm:p-14">
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">
        欢迎使用 Skills
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-ink-muted">
        本仓库为 Claude Code 提供一组 skills 与工作流：从智慧提交、PR 描述生成、
        worktree 并行开发，到 UI/UX 设计智能与工作流构建器。下方目录列出所有可用 skill，
        选择合适的 skill 即可加速你的开发流程。
      </p>
      <button
        type="button"
        onClick={scrollToCatalog}
        className="mt-6 inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-card transition hover:bg-brand-700 hover:shadow-card-hover"
      >
        浏览 skills
      </button>
    </section>
  )
}
