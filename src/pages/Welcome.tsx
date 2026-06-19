import { loadSkills } from '../lib/skills'

/**
 * 欢迎页路由组件（/）。
 *
 * 当前为占位骨架，含 hero 占位区与 skill 目录占位区。
 * → feature/skill-welcome 分支会将下方两个占位区块替换为：
 *   - <WelcomeHero />  欢迎介绍区
 *   - <SkillCatalog /> skill 目录卡片网格
 */
export function Welcome() {
  const skills = loadSkills()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* ─── hero 占位区（feature/skill-welcome 替换为 <WelcomeHero />）─── */}
      <section className="rounded-card border border-dashed border-surface-border bg-surface p-10 text-center">
        <h1 className="text-3xl font-bold text-ink">欢迎使用 Skills</h1>
        <p className="mt-3 text-ink-muted">
          （hero 占位区 — 由 feature/skill-welcome 分支实现欢迎介绍与 CTA）
        </p>
      </section>

      {/* ─── skill 目录占位区（feature/skill-welcome 替换为 <SkillCatalog />）─── */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold text-ink">Skill 目录</h2>
        <p className="text-sm text-ink-muted">
          （目录占位区 — 由 feature/skill-welcome 分支实现卡片网格。）
        </p>

        {/* 临时占位：列出已解析的 skill 数量，验证 loadSkills() 数据链路 */}
        <p className="mt-2 text-sm text-ink-muted">
          当前已解析 {skills.length} 个 skill（来自 src/data/skills.json）。
        </p>
      </section>
    </div>
  )
}
