import { encode } from 'plantuml-encoder'
import { DEFAULT_PLANTUML_SERVER, type Data } from '@/core/data'
import {
  decodePlantUmlSource,
  PLANTUML_CLASS,
  PLANTUML_CONTENT_CLASS,
  PLANTUML_ERROR_CLASS,
  PLANTUML_SOURCE_ATTR,
  PLANTUML_STATUS_ATTR,
} from '@/core/plantuml'

function fetchExternal(url: string): Promise<string> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { action: 'fetchExternal', data: { url } },
      resolve,
    )
  })
}

function createErrorElement(message: string) {
  const error = document.createElement('div')
  error.className = PLANTUML_ERROR_CLASS
  error.textContent = message
  return error
}

async function renderPlantUmlElement(element: HTMLElement, server: string) {
  const status = element.getAttribute(PLANTUML_STATUS_ATTR)
  if (status === 'rendering' || status === 'ready') {
    return
  }

  const source = element.getAttribute(PLANTUML_SOURCE_ATTR)
  if (!source) {
    return
  }

  const code = decodePlantUmlSource(source)
  const codeElement = element.querySelector(`.${PLANTUML_CONTENT_CLASS}`)
  const previousError = element.querySelector(`.${PLANTUML_ERROR_CLASS}`)
  previousError?.remove()

  element.setAttribute(PLANTUML_STATUS_ATTR, 'rendering')

  try {
    const url = `${server.replace(/\/+$/, '')}/svg/${encode(code)}`
    const svgText = await fetchExternal(url)
    const svg = new DOMParser().parseFromString(
      svgText,
      'image/svg+xml',
    ).documentElement
    if (svg.nodeName !== 'svg') {
      throw new Error(svg.textContent || 'Failed to render PlantUML diagram')
    }
    svg.classList.add(`${PLANTUML_CLASS}-svg`)
    codeElement?.replaceWith(document.importNode(svg, true))
    element.setAttribute(PLANTUML_STATUS_ATTR, 'ready')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!codeElement) {
      const fallbackCode = document.createElement('code')
      fallbackCode.className = PLANTUML_CONTENT_CLASS
      fallbackCode.textContent = code
      element.appendChild(fallbackCode)
    }
    element.appendChild(createErrorElement(message))
    element.setAttribute(PLANTUML_STATUS_ATTR, 'error')
  }
}

export async function renderPlantUml(
  container: ParentNode = document,
  server: string = DEFAULT_PLANTUML_SERVER,
) {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(`.${PLANTUML_CLASS}`),
  )
  await Promise.all(
    elements.map(element => renderPlantUmlElement(element, server)),
  )
}

export default function PlantUmlRendererPlugin({
  event,
  configData,
}: {
  event: { on(name: string, cb: (...args: any) => void): void }
  configData: Data
}) {
  event.on('contentRendered', (container: HTMLElement) => {
    void renderPlantUml(
      container,
      configData?.plantumlServer || DEFAULT_PLANTUML_SERVER,
    )
  })
}
