import { afterEach, describe, expect, it } from 'vitest'
import layoutManager from '../layoutManager'
import { translationValue } from '../constants'
import type { ElementX } from '../interfaces'
import { cleanupDom, layoutContainer, makeContainer } from './helpers'

afterEach(cleanupDom)

/**
 * `layoutManager` only computes scale inside `invalidate()`, never `invalidateRects()`.
 * Until that runs, `values.scaleY` is `undefined` and anything multiplying by it yields NaN —
 * so every test here invalidates first, mirroring what `onMouseDown` does at `mediator.ts:352`.
 */
function makeLayout (element: HTMLElement, orientation: 'vertical' | 'horizontal' = 'vertical') {
  const layout = layoutManager(element as ElementX, orientation, 250)
  layout.invalidate()
  return layout
}

describe('vertical orientation', () => {
  it('maps container begin/end onto top/bottom', () => {
    const el = makeContainer(3, { containerRect: { top: 100, bottom: 400, left: 10, right: 210 } })
    const layout = makeLayout(el)

    expect(layout.getBeginEndOfContainer()).toEqual({ begin: 100, end: 400 })
  })

  it('places children end-to-end down the axis', () => {
    const el = makeContainer(3, { itemSize: 50, containerRect: { top: 0, bottom: 500 } })
    const layout = makeLayout(el)
    const children = Array.from(el.children) as HTMLElement[]

    expect(layout.getBeginEnd(children[0])).toEqual({ begin: 0, end: 50 })
    expect(layout.getBeginEnd(children[1])).toEqual({ begin: 50, end: 100 })
    expect(layout.getBeginEnd(children[2])).toEqual({ begin: 100, end: 150 })
  })

  it('measures size along the layout axis', () => {
    const el = makeContainer(2, { itemSize: 40, itemCrossSize: 300 })
    const layout = makeLayout(el)

    expect(layout.getSize(el.children[0] as HTMLElement)).toBe(40)
  })

  it('offsets children by the container scroll position', () => {
    const el = makeContainer(4, { itemSize: 50, scroll: 60, scrollSize: 400 })
    const layout = makeLayout(el)
    const children = Array.from(el.children) as HTMLElement[]

    expect(layout.getBeginEnd(children[0])).toEqual({ begin: -60, end: -10 })
    expect(layout.getBeginEnd(children[2])).toEqual({ begin: 40, end: 90 })
  })

  it('resolves an element begin to a top/left pair', () => {
    const el = makeContainer(2, { containerRect: { top: 0, left: 25, right: 225, bottom: 500 } })
    const layout = makeLayout(el)

    expect(layout.getTopLeftOfElementBegin(80)).toEqual({ top: 80, left: 25 })
  })
})

describe('horizontal orientation', () => {
  it('maps container begin/end onto left/right', () => {
    const el = makeContainer(3, {
      orientation: 'horizontal',
      containerRect: { left: 20, right: 320, top: 0, bottom: 100 },
    })
    const layout = makeLayout(el, 'horizontal')

    expect(layout.getBeginEndOfContainer()).toEqual({ begin: 20, end: 320 })
  })

  it('places children end-to-end across the axis', () => {
    const el = makeContainer(3, {
      orientation: 'horizontal',
      itemSize: 80,
      containerRect: { left: 0, right: 600, top: 0, bottom: 100 },
    })
    const layout = makeLayout(el, 'horizontal')
    const children = Array.from(el.children) as HTMLElement[]

    expect(layout.getBeginEnd(children[0])).toEqual({ begin: 0, end: 80 })
    expect(layout.getBeginEnd(children[2])).toEqual({ begin: 160, end: 240 })
  })

  it('resolves an element begin to a top/left pair', () => {
    const el = makeContainer(2, {
      orientation: 'horizontal',
      containerRect: { left: 0, right: 600, top: 40, bottom: 140 },
    })
    const layout = makeLayout(el, 'horizontal')

    expect(layout.getTopLeftOfElementBegin(120)).toEqual({ top: 40, left: 120 })
  })
})

describe('translation', () => {
  it('writes a transform and records the value', () => {
    const el = makeContainer(1)
    const layout = makeLayout(el)
    const child = el.children[0] as ElementX

    layout.setTranslation(child, 30)
    expect(child.style.transform).toBe('translate3d(0,30px, 0)')
    expect(layout.getTranslation(child)).toBe(30)
  })

  it('removes the transform for a zero translation', () => {
    const el = makeContainer(1)
    const layout = makeLayout(el)
    const child = el.children[0] as ElementX

    layout.setTranslation(child, 30)
    layout.setTranslation(child, 0)
    expect(child.style.transform).toBe('')
    expect(layout.getTranslation(child)).toBe(0)
  })

  it('writes an x-axis transform when horizontal', () => {
    const el = makeContainer(1, { orientation: 'horizontal' })
    const layout = makeLayout(el, 'horizontal')
    const child = el.children[0] as ElementX

    layout.setTranslation(child, 30)
    expect(child.style.transform).toBe('translate3d(30px, 0, 0)')
  })

  it('shifts a translated element begin/end by the translation', () => {
    const el = makeContainer(3, { itemSize: 50 })
    const layout = makeLayout(el)
    const child = el.children[1] as ElementX

    expect(layout.getBeginEnd(child)).toEqual({ begin: 50, end: 100 })

    // getBeginEnd derives from offsetTop + the recorded translation, not the live rect
    child[translationValue] = 50
    expect(layout.getBeginEnd(child)).toEqual({ begin: 100, end: 150 })
  })
})

describe('visibility', () => {
  it('round-trips visibility and treats untouched elements as visible', () => {
    const el = makeContainer(1)
    const layout = makeLayout(el)
    const child = el.children[0] as ElementX

    expect(layout.isVisible(child)).toBe(true)

    layout.setVisibility(child, false)
    expect(child.style.visibility).toBe('hidden')
    expect(layout.isVisible(child)).toBe(false)

    layout.setVisibility(child, true)
    expect(child.style.visibility).toBe('')
    expect(layout.isVisible(child)).toBe(true)
  })
})

describe('container rectangles', () => {
  it('exposes rect and visibleRect', () => {
    const el = makeContainer(2, { containerRect: { top: 0, bottom: 300, left: 0, right: 200 } })
    const layout = makeLayout(el)

    const { rect, visibleRect } = layout.getContainerRectangles()
    expect(rect).toEqual({ left: 0, top: 0, right: 200, bottom: 300 })
    expect(visibleRect).toEqual({ left: 0, top: 0, right: 200, bottom: 300 })
  })

  it('carries the previous visibleRect forward while the container stays visible', () => {
    const el = makeContainer(2, { containerRect: { top: 0, bottom: 300, left: 0, right: 200 } })
    const layout = makeLayout(el)

    layoutContainer(el, { containerRect: { top: 0, bottom: 400, left: 0, right: 200 } })
    layout.invalidateRects()

    expect(layout.getContainerRectangles().lastVisibleRect).toEqual({
      left: 0, top: 0, right: 200, bottom: 300,
    })
    expect(layout.getContainerRectangles().visibleRect).toEqual({
      left: 0, top: 0, right: 200, bottom: 400,
    })
  })

  it.fails('captures the last visible rect when the container becomes hidden (known bug)', () => {
    // layoutManager.ts:82 guards on the *new* rect being visible before stashing the old one:
    //   if (isVisible(visibleRect)) { values.lastVisibleRect = values.visibleRect }
    // So the moment the container collapses, lastVisibleRect is NOT updated and keeps whatever it
    // held before — leaving it one measurement stale exactly when it is needed. mediator.ts:218
    // relies on this to animate a dropped ghost back to where a now-hidden container used to be.
    const el = makeContainer(2, { containerRect: { top: 0, bottom: 300, left: 0, right: 200 } })
    const layout = makeLayout(el)

    layoutContainer(el, { containerRect: { top: 0, bottom: 0, left: 0, right: 0 } })
    layout.invalidateRects()

    expect(layout.getContainerRectangles().lastVisibleRect).toEqual({
      left: 0, top: 0, right: 200, bottom: 300,
    })
  })

  it('returns a raw DOM-style rect with no begin/end keys', () => {
    // Documented because container.ts:516-517 reads `.rect.end` / `.rect.begin` off this object,
    // which is why dropArea.end is NaN. See 01-engine-assessment.md bug 13.
    const el = makeContainer(2)
    const layout = makeLayout(el)
    const { rect } = layout.getContainerRectangles()

    expect(Object.keys(rect).sort()).toEqual(['bottom', 'left', 'right', 'top'])
    expect((rect as any).begin).toBeUndefined()
    expect((rect as any).end).toBeUndefined()
  })
})

describe('scale', () => {
  it('is 1 when the bounding rect matches the offset box', () => {
    const el = makeContainer(2, { itemSize: 50 })
    const layout = makeLayout(el)

    expect(layout.getBeginEnd(el.children[1] as HTMLElement)).toEqual({ begin: 50, end: 100 })
  })

  it.fails('does not double-apply an ancestor scale (known bug)', () => {
    // Engine bug 12: getSize() returns getBoundingClientRect() deltas, which already include the
    // CSS scale, and getBeginEnd() then multiplies by scale a second time.
    // Container is rendered at 2x: offset box 200x500, painted rect 400x1000.
    const el = makeContainer(2, { itemSize: 50 })
    Object.defineProperty(el, 'offsetHeight', { value: 250, configurable: true })
    el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 500 }) as DOMRect
    const layout = makeLayout(el)

    // painted size of a child is 50, so end should be begin + 50
    const { begin, end } = layout.getBeginEnd(el.children[0] as HTMLElement)
    expect(end - begin).toBe(50) // actually 100 — scale applied twice
  })

  it('does not refresh scale on invalidateRects, only on invalidate', () => {
    // Documented: mid-drag scale changes are never picked up, because the drag loop only ever
    // calls invalidateRects(). See 01-engine-assessment.md bug 12.
    const el = makeContainer(2, { itemSize: 50 })
    const layout = layoutManager(el as ElementX, 'vertical', 250)

    // before any invalidation at all, there are no rects to read and geometry throws outright
    expect(() => layout.getBeginEnd(el.children[0] as HTMLElement)).toThrow()

    // invalidateRects() populates rects but leaves scale unset, so sizes come out NaN
    layout.invalidateRects()
    expect(layout.getBeginEnd(el.children[0] as HTMLElement).end).toBeNaN()

    // only invalidate() computes scale
    layout.invalidate()
    expect(layout.getBeginEnd(el.children[0] as HTMLElement).end).toBe(50)
  })
})
