import type MarkdownIt from 'markdown-it'
import { isPlantUmlCodeBlock, renderPlantUmlPlaceholder } from '@/core/plantuml'

export default function PlantUmlBlockPlugin(md: MarkdownIt) {
  const fallbackFence = md.renderer.rules.fence?.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()
    const code = token.content.trim()

    if (isPlantUmlCodeBlock(info)) {
      return renderPlantUmlPlaceholder(code)
    }

    if (fallbackFence) {
      return fallbackFence(tokens, idx, options, env, self)
    }

    return self.renderToken(tokens, idx, options)
  }
}
