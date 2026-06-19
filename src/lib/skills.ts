import skillsData from '../data/skills.json'

/** 单个 skill 的元数据，由 scripts/gen-skills.mjs 从 SKILL.md frontmatter 解析生成。 */
export interface SkillMeta {
  /** skill 名称（kebab-case），来自 frontmatter 的 name 字段 */
  name: string
  /** skill 描述，来自 frontmatter 的 description 字段 */
  description: string
}

/**
 * 取得所有 skills 的元数据。
 * 数据来源为构建期生成的 src/data/skills.json（由 npm run gen-skills 产出），
 * 因此新增 skill 后只需重新 gen-skills 即可自动出现在目录中。
 */
export function loadSkills(): SkillMeta[] {
  return skillsData as SkillMeta[]
}
