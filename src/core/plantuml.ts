const PLANTUML_INFO_TOKENS = new Set(['plantuml', 'puml', 'uml'])

export const PLANTUML_CLASS = 'md-reader__plantuml'
export const PLANTUML_CONTENT_CLASS = `${PLANTUML_CLASS}-content`
export const PLANTUML_ERROR_CLASS = `${PLANTUML_CLASS}-error`
export const PLANTUML_SOURCE_ATTR = 'data-plantuml-source'
export const PLANTUML_STATUS_ATTR = 'data-plantuml-status'

export function isPlantUmlCodeBlock(info: string = ''): boolean {
  return PLANTUML_INFO_TOKENS.has(info.trim().toLowerCase())
}

export function encodePlantUmlSource(code: string): string {
  const utf8 = encodeURIComponent(code).replace(
    /%([0-9A-F]{2})/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  )
  return btoa(utf8)
}

export function decodePlantUmlSource(value: string): string {
  const utf8 = atob(value)
  const encoded = Array.from(
    utf8,
    char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`,
  ).join('')
  return decodeURIComponent(encoded)
}

export function renderPlantUmlPlaceholder(code: string): string {
  const source = encodePlantUmlSource(code)
  return `<pre class="${PLANTUML_CLASS}" ${PLANTUML_SOURCE_ATTR}="${source}" ${PLANTUML_STATUS_ATTR}="pending"><code class="${PLANTUML_CONTENT_CLASS}">${escapeHtml(
    code,
  )}</code></pre>`
}

function escapeHtml(content: string): string {
  return String(content)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
