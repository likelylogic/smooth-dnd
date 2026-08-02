/**
 * Test helpers for the smooth-dnd engine.
 *
 * jsdom implements no layout engine: `getBoundingClientRect()` returns all zeros and every
 * `offset*` / `client*` / `scroll*` property is 0. The engine is almost entirely geometry, so
 * tests have to supply that geometry themselves.
 *
 * The model here is deliberately simple and matches what the engine actually reads:
 *
 *   - a container occupies a rect, and lays its children out end-to-end along one axis
 *   - each child is `itemSize` along that axis and fills the container on the cross axis
 *   - `offsetTop` / `offsetLeft` are relative to the container (the engine assumes the container
 *     is the offset parent — `styles.ts` gives it `position: relative`)
 *
 * Anything reading geometry that isn't stubbed here reads 0, which is usually an obvious failure
 * rather than a silent wrong answer.
 */

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface LayoutOptions {
  /** Where the container sits in the viewport. */
  containerRect?: Partial<Rect>
  /** Extent of each child along the layout axis. */
  itemSize?: number
  /** Extent of each child across the layout axis. Defaults to the container's cross extent. */
  itemCrossSize?: number
  orientation?: 'vertical' | 'horizontal'
  /** Scroll offset of the container along the layout axis. */
  scroll?: number
  /**
   * Total scrollable extent along the layout axis. Defaults to the content extent, i.e. no
   * overflow. Set larger to simulate a scrolling container.
   */
  scrollSize?: number
}

const DEFAULT_RECT: Rect = { left: 0, top: 0, right: 200, bottom: 500 }

function defineRect (element: HTMLElement, rect: Rect) {
  const value = {
    ...rect,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON: () => rect,
  }
  element.getBoundingClientRect = () => value as DOMRect
}

function defineNumbers (element: HTMLElement, props: Record<string, number>) {
  for (const [key, val] of Object.entries(props)) {
    Object.defineProperty(element, key, { value: val, configurable: true, writable: true })
  }
}

/**
 * Apply a synthetic layout to a container and its element children.
 *
 * Call this *after* the children exist. If smooth-dnd has wrapped them, pass the wrappers —
 * `layoutContainer(el)` reads `el.children` at call time, so re-run it after wrapping.
 */
export function layoutContainer (container: HTMLElement, options: LayoutOptions = {}) {
  const {
    itemSize = 50,
    orientation = 'vertical',
    scroll = 0,
  } = options

  const rect: Rect = { ...DEFAULT_RECT, ...options.containerRect }
  const vertical = orientation === 'vertical'

  const containerWidth = rect.right - rect.left
  const containerHeight = rect.bottom - rect.top
  const crossSize = options.itemCrossSize ?? (vertical ? containerWidth : containerHeight)

  const children = Array.from(container.children) as HTMLElement[]
  const contentSize = children.length * itemSize
  const scrollSize = options.scrollSize ?? contentSize

  defineRect(container, rect)
  defineNumbers(container, {
    // scale is derived as rect extent / offset extent, so keeping them equal pins scale at 1
    offsetWidth: containerWidth,
    offsetHeight: containerHeight,
    clientWidth: containerWidth,
    clientHeight: containerHeight,
    scrollWidth: vertical ? containerWidth : scrollSize,
    scrollHeight: vertical ? scrollSize : containerHeight,
    scrollLeft: vertical ? 0 : scroll,
    scrollTop: vertical ? scroll : 0,
  })

  children.forEach((child, index) => {
    const offset = index * itemSize
    const childRect: Rect = vertical
      ? {
          left: rect.left,
          right: rect.left + crossSize,
          top: rect.top + offset - scroll,
          bottom: rect.top + offset - scroll + itemSize,
        }
      : {
          left: rect.left + offset - scroll,
          right: rect.left + offset - scroll + itemSize,
          top: rect.top,
          bottom: rect.top + crossSize,
        }

    defineRect(child, childRect)
    defineNumbers(child, {
      offsetTop: vertical ? offset : 0,
      offsetLeft: vertical ? 0 : offset,
      offsetWidth: vertical ? crossSize : itemSize,
      offsetHeight: vertical ? itemSize : crossSize,
      clientWidth: vertical ? crossSize : itemSize,
      clientHeight: vertical ? itemSize : crossSize,
      scrollWidth: vertical ? crossSize : itemSize,
      scrollHeight: vertical ? itemSize : crossSize,
    })
  })

  return container
}

/** Build a detached-then-attached container with `count` plain children. */
export function makeContainer (count = 3, options: LayoutOptions = {}) {
  const element = document.createElement('div')
  for (let i = 0; i < count; i++) {
    const child = document.createElement('div')
    child.textContent = `item ${i}`
    child.setAttribute('data-index', String(i))
    element.appendChild(child)
  }
  document.body.appendChild(element)
  layoutContainer(element, options)
  return element
}

/** Remove everything the previous test attached, so module-level engine state can't leak visually. */
export function cleanupDom () {
  document.body.innerHTML = ''
  document.body.className = ''
}

/**
 * jsdom returns `overflow: ''` for everything, which the engine reads as "not scrolling".
 * Use this to make an element look scrollable to `utils.isScrolling` / `getScrollingAxis`.
 */
export function setOverflow (element: HTMLElement, value: string) {
  element.style.overflow = value
}
