import { WelcomeHero } from '../components/WelcomeHero'
import { SkillCatalog } from '../components/SkillCatalog'

/**
 * 欢迎页路由组件（/）。
 * 由欢迎介绍区（WelcomeHero）与 skill 目录卡片网格（SkillCatalog）组成。
 */
export function Welcome() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <WelcomeHero />
      <SkillCatalog />
    </div>
  )
}
