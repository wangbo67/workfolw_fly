import { useState, type MouseEvent } from 'react'
import { loadSkills, type SkillMeta } from '../lib/skills'

/** 描述截断阈值（超过则显示「展开」） */
const DESC_LIMIT = 120

/** 外链图标（内联 SVG，避免引入图标库） */
function ExternalLinkIcon() {
  return (
    <svg
      className="inline-block h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function SkillCard({ skill }: { skill: SkillMeta }) {
  const [expanded, setExpanded] = useState(false)
  const long = skill.description.length > DESC_LIMIT
  const shown = expanded || !long
    ? skill.description
    : `${skill.description.slice(0, DESC_LIMIT).trimEnd()}…`

  // 点击「展开/收起」时阻止冒泡与默认行为，避免同时触发卡片外链跳转
  const handleToggle = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded((v) => !v)
  }

  // 卡片主体样式（链接 / 非链接共用）
  const cardClass =
    'flex flex-col rounded-card border border-surface-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-card-hover'

  const title = (
    <h3 className="flex items-center gap-1.5 font-mono text-sm font-semibold text-brand">
      {skill.name}
      {skill.githubUrl && <ExternalLinkIcon />}
    </h3>
  )

  const body = (
    <>
      {title}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={handleToggle}
          className="mt-2 self-start text-xs font-medium text-brand hover:text-brand-700"
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </>
  )

  // 有 GitHub URL → 可点击外链；无 URL → 降级为不可点击的 div
  if (skill.githubUrl) {
    return (
      <a
        href={skill.githubUrl}
        target="_blank"
        rel="noreferrer"
        className={`${cardClass} cursor-pointer`}
      >
        {body}
      </a>
    )
  }
  return <div className={cardClass}>{body}</div>
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
