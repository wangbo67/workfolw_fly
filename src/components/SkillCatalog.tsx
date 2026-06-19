import { useState } from 'react'
import { loadSkills, type SkillMeta } from '../lib/skills'

/** 描述截断阈值（超过则显示「展开」） */
const DESC_LIMIT = 120

function SkillCard({ skill }: { skill: SkillMeta }) {
  const [expanded, setExpanded] = useState(false)
  const long = skill.description.length > DESC_LIMIT
  const shown = expanded || !long
    ? skill.description
    : `${skill.description.slice(0, DESC_LIMIT).trimEnd()}…`

  return (
    <article className="flex flex-col rounded-card border border-surface-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-card-hover">
      <h3 className="font-mono text-sm font-semibold text-brand">{skill.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {shown}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 self-start text-xs font-medium text-brand hover:text-brand-700"
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </article>
  )
}

/**
 * Skill 目录卡片网格：调用 loadSkills() 渲染所有 skill。
 * 响应式：手机单列、平板两列、桌面三列。
 */
export function SkillCatalog() {
  const skills = loadSkills()

  return (
    <section id="skill-catalog" className="mt-12 scroll-mt-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-ink">Skill 目录</h2>
        <span className="text-sm text-ink-muted">共 {skills.length} 个</span>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-card border border-dashed border-surface-border bg-surface p-10 text-center text-ink-muted">
          暂无可用 skill。请确认 <code className="font-mono">.claude/skills/</code>{' '}
          下存在 SKILL.md，并执行 <code className="font-mono">npm run gen-skills</code>。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
      )}
    </section>
  )
}
