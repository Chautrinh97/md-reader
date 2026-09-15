import test from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'

const loadPlantUml = () => import('../src/core/plantuml.ts')

test('recognizes plantuml fence info tokens', async () => {
  const { isPlantUmlCodeBlock } = await loadPlantUml()

  assert.equal(isPlantUmlCodeBlock('plantuml'), true)
  assert.equal(isPlantUmlCodeBlock('puml'), true)
  assert.equal(isPlantUmlCodeBlock('uml'), true)
  assert.equal(isPlantUmlCodeBlock('PlantUML'), true)
})

test('ignores unrelated fence info tokens', async () => {
  const { isPlantUmlCodeBlock } = await loadPlantUml()

  assert.equal(isPlantUmlCodeBlock('mermaid'), false)
  assert.equal(isPlantUmlCodeBlock('js'), false)
  assert.equal(isPlantUmlCodeBlock(''), false)
})

test('encodes plantuml placeholders safely', async () => {
  const { decodePlantUmlSource, renderPlantUmlPlaceholder } =
    await loadPlantUml()
  const code = '@startuml\nAlice -> Bob: "Hello < World"\n@enduml'

  const html = renderPlantUmlPlaceholder(code)
  const sourceMatch = html.match(/data-plantuml-source="([^"]+)"/)

  assert.ok(sourceMatch, 'expected plantuml source data attribute')
  assert.equal(decodePlantUmlSource(sourceMatch[1]), code)
  assert.match(html, /md-reader__plantuml/)
})

test('markdown-it integration routes plantuml fences through the placeholder', async () => {
  const { isPlantUmlCodeBlock, renderPlantUmlPlaceholder } =
    await loadPlantUml()
  const md = new MarkdownIt()
  const fallbackFence = md.renderer.rules.fence?.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()
    const code = token.content.trim()

    if (isPlantUmlCodeBlock(info)) {
      return renderPlantUmlPlaceholder(code)
    }

    return fallbackFence
      ? fallbackFence(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }

  const plantumlHtml = md.render('```plantuml\nAlice -> Bob\n```')
  const jsHtml = md.render('```js\nconsole.log(1)\n```')

  assert.match(plantumlHtml, /md-reader__plantuml/)
  assert.doesNotMatch(jsHtml, /md-reader__plantuml/)
})
