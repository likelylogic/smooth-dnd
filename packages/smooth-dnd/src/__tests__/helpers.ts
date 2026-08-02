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

import smoothDnD from '../container'

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

/**
 * Mount a container, then re-apply the synthetic layout to whatever ended up as its draggables.
 *
 * Order matters here and is very easy to get wrong. In vanilla mode `smoothDnD()` wraps each child,
 * and the **wrappers** become the draggables — so a layout applied before mounting lands on the
 * original children and leaves every draggable measuring zero. That does not fail loudly: the
 * insertion index simply stops tracking the pointer, and any test asserting on it passes for the
 * wrong reason.
 *
 * Use this rather than calling `smoothDnD()` directly whenever a test cares where an item lands.
 */
export function mountContainer (
  element: HTMLElement,
  options: Record<string, unknown> = {},
  layout: LayoutOptions = {},
) {
  const instance = smoothDnD(element, { animationDuration: 1, ...options } as any)
  layoutContainer(element, layout)
  return instance
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

// ---------------------------------------------------------------------------------------------
// Drag simulation
// ---------------------------------------------------------------------------------------------

/**
 * Return the engine to a clean slate between tests.
 *
 * The mediator's drag state is module-level, so a drag abandoned by a failed assertion — or by a
 * test that ends without awaiting its drop animation — leaks into the next test. `cancelDrag()`
 * alone isn't enough: it *starts* a drop animation, and while one is pending `dropAnimationStarted`
 * makes any further `cancelDrag()` a no-op. So cancel, then wait for the animation's fallback timer.
 */
export async function settleEngine () {
  if (smoothDnD.isDragging()) {
    smoothDnD.cancelDrag()
  }
  await new Promise(resolve => setTimeout(resolve, 120))
}

/** The node a real pointer would hit — the innermost child of a wrapped draggable. */
export function itemAt (container: HTMLElement, index: number) {
  const wrapper = container.children[index] as HTMLElement
  return (wrapper.firstElementChild ?? wrapper) as HTMLElement
}

export function ghostElement () {
  return document.querySelector('.smooth-dnd-ghost') as HTMLElement | null
}

/** Let queued rAF callbacks and microtasks run. */
export async function flushFrames (count = 2) {
  for (let i = 0; i < count; i++) {
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
  }
}

function pointerEvent (type: string, x: number, y: number) {
  return new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y })
}

export interface DragHandle {
  /** Move the pointer, letting the engine process the frame. */
  moveTo: (x: number, y: number) => Promise<void>
  /** Release, then settle the drop animation by firing `transitionend` on the ghost. */
  drop: () => Promise<void>
  /** Release without settling — leaves the drop animation pending. */
  release: () => void
  /** Settle a pending drop animation. */
  settle: () => Promise<void>
}

/**
 * Drive a full drag through the real event path: mousedown, the move that crosses the drag
 * threshold, then further moves.
 *
 * `document.elementFromPoint` is stubbed for the duration, since jsdom always returns null and the
 * engine uses it to decide which container the pointer is over.
 */
export async function startDrag (
  container: HTMLElement,
  index: number,
  hitTarget: () => Element | null = () => container,
): Promise<DragHandle> {
  // jsdom doesn't implement elementFromPoint at all, so `original` is usually undefined. Restoring
  // that verbatim would leave the engine calling a non-function in any later test that reaches the
  // hit test without going through startDrag — so fall back to a stub that simply hits nothing.
  const original = document.elementFromPoint ?? (() => null)
  document.elementFromPoint = () => hitTarget() as Element

  const source = itemAt(container, index)
  source.dispatchEvent(pointerEvent('mousedown', 0, 0))
  // the first move past the 1px threshold promotes the press into a drag
  document.dispatchEvent(pointerEvent('mousemove', 0, 10))
  await flushFrames()

  async function moveTo (x: number, y: number) {
    document.dispatchEvent(pointerEvent('mousemove', x, y))
    await flushFrames()
  }

  function release () {
    document.dispatchEvent(pointerEvent('mouseup', 0, 0))
  }

  async function settle () {
    const ghost = ghostElement()
    if (ghost) {
      ghost.dispatchEvent(new Event('transitionend', { bubbles: false }))
    }
    await flushFrames()
    document.elementFromPoint = original
  }

  async function drop () {
    release()
    await settle()
  }

  return { moveTo, drop, release, settle }
}
