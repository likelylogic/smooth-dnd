import { afterEach, describe, expect, it, vi } from 'vitest'
import * as Utils from '../utils'
import { cleanupDom, setOverflow } from './helpers'

afterEach(cleanupDom)

describe('rect maths', () => {
  const a = { left: 0, top: 0, right: 100, bottom: 100 }
  const b = { left: 50, top: 25, right: 200, bottom: 75 }

  it('intersects on both axes', () => {
    expect(Utils.getIntersection(a, b)).toEqual({ left: 50, top: 25, right: 100, bottom: 75 })
  })

  it('intersects on x only, keeping the first rect vertically', () => {
    expect(Utils.getIntersectionOnAxis(a, b, 'x')).toEqual({ left: 50, top: 0, right: 100, bottom: 100 })
  })

  it('intersects on y only, keeping the first rect horizontally', () => {
    expect(Utils.getIntersectionOnAxis(a, b, 'y')).toEqual({ left: 0, top: 25, right: 100, bottom: 75 })
  })

  it('treats zero-area and inverted rects as not visible', () => {
    expect(Utils.isVisible({ left: 0, top: 0, right: 10, bottom: 10 })).toBe(true)
    expect(Utils.isVisible({ left: 0, top: 0, right: 0, bottom: 10 })).toBe(false)
    expect(Utils.isVisible({ left: 0, top: 10, right: 10, bottom: 10 })).toBe(false)
    expect(Utils.isVisible({ left: 20, top: 0, right: 10, bottom: 10 })).toBe(false)
  })
})

describe('getContainerRect', () => {
  it('returns the bounding rect when content fits', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 220 }) as DOMRect
    Object.defineProperty(el, 'scrollWidth', { value: 100 })
    Object.defineProperty(el, 'clientWidth', { value: 100 })
    Object.defineProperty(el, 'scrollHeight', { value: 200 })
    Object.defineProperty(el, 'clientHeight', { value: 200 })

    expect(Utils.getContainerRect(el)).toEqual({ left: 10, top: 20, right: 110, bottom: 220 })
  })

  it('inflates the rect when content visibly overflows (overflow is not scroll/hidden)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100 }) as DOMRect
    Object.defineProperty(el, 'scrollWidth', { value: 100 })
    Object.defineProperty(el, 'clientWidth', { value: 100 })
    Object.defineProperty(el, 'scrollHeight', { value: 350 })
    Object.defineProperty(el, 'clientHeight', { value: 100 })

    // bottom grows to cover the visibly-overflowing content
    expect(Utils.getContainerRect(el).bottom).toBe(350)
  })

  it('does not inflate when the element scrolls or hides its overflow', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    setOverflow(el, 'auto')
    el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100 }) as DOMRect
    Object.defineProperty(el, 'scrollWidth', { value: 100 })
    Object.defineProperty(el, 'clientWidth', { value: 100 })
    Object.defineProperty(el, 'scrollHeight', { value: 350 })
    Object.defineProperty(el, 'clientHeight', { value: 100 })

    expect(Utils.getContainerRect(el).bottom).toBe(100)
  })
})

describe('scroll detection', () => {
  it('reports the scrolling axis from computed overflow', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    expect(Utils.getScrollingAxis(el)).toBeNull()

    el.style.overflowY = 'auto'
    expect(Utils.getScrollingAxis(el)).toBe('y')

    el.style.overflowX = 'scroll'
    expect(Utils.getScrollingAxis(el)).toBe('xy')

    el.style.removeProperty('overflow-x')
    el.style.removeProperty('overflow-y')
    el.style.overflow = 'scroll'
    expect(Utils.getScrollingAxis(el)).toBe('xy')
  })

  it('distinguishes isScrolling from isScrollingOrHidden', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    setOverflow(el, 'hidden')

    expect(Utils.isScrolling(el, 'y')).toBe(false)
    expect(Utils.isScrollingOrHidden(el, 'y')).toBe(true)
  })

  it('detects a bigger child per axis', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollWidth', { value: 100 })
    Object.defineProperty(el, 'clientWidth', { value: 100 })
    Object.defineProperty(el, 'scrollHeight', { value: 200 })
    Object.defineProperty(el, 'clientHeight', { value: 100 })

    expect(Utils.hasBiggerChild(el, 'x')).toBe(false)
    expect(Utils.hasBiggerChild(el, 'y')).toBe(true)
  })
})

describe('dom traversal', () => {
  it('getParent matches the element itself and walks up', () => {
    const outer = document.createElement('div')
    outer.className = 'outer'
    const inner = document.createElement('span')
    inner.className = 'inner'
    outer.appendChild(inner)
    document.body.appendChild(outer)

    expect(Utils.getParent(inner, '.inner')).toBe(inner)
    expect(Utils.getParent(inner, '.outer')).toBe(outer)
    expect(Utils.getParent(inner, '.nope')).toBeNull()
  })

  it('hasParent walks up to the given ancestor', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('span')
    const stray = document.createElement('span')
    outer.appendChild(inner)
    document.body.append(outer, stray)

    expect(Utils.hasParent(inner, outer)).toBe(true)
    expect(Utils.hasParent(inner, inner)).toBe(true)
    expect(Utils.hasParent(stray, outer)).toBe(false)
  })
})

describe('class helpers', () => {
  it('adds without duplicating and removes cleanly', () => {
    const el = document.createElement('div')
    el.className = 'a b'

    Utils.addClass(el, 'c')
    expect(Utils.hasClass(el, 'c')).toBe(true)

    Utils.addClass(el, 'c')
    expect(el.className.split(' ').filter(p => p === 'c')).toHaveLength(1)

    Utils.removeClass(el, 'c')
    expect(Utils.hasClass(el, 'c')).toBe(false)
    expect(Utils.hasClass(el, 'a')).toBe(true)
    expect(Utils.hasClass(el, 'b')).toBe(true)
  })

  it('tolerates a null element on add', () => {
    expect(() => Utils.addClass(null, 'x')).not.toThrow()
  })
})

describe('child insertion', () => {
  it('addChildAt inserts at an index and appends past the end', () => {
    const parent = document.createElement('div')
    const a = document.createElement('i')
    const b = document.createElement('i')
    const c = document.createElement('i')
    parent.append(a, b)

    Utils.addChildAt(parent, c, 1)
    expect(Array.from(parent.children)).toEqual([a, c, b])

    const d = document.createElement('i')
    Utils.addChildAt(parent, d, 99)
    expect(parent.children[3]).toBe(d)
  })

  it('removeChildAt removes and returns the child', () => {
    const parent = document.createElement('div')
    const a = document.createElement('i')
    const b = document.createElement('i')
    parent.append(a, b)

    expect(Utils.removeChildAt(parent, 0)).toBe(a)
    expect(Array.from(parent.children)).toEqual([b])
  })
})

describe('debounce', () => {
  it('coalesces trailing calls', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = Utils.debounce(fn, 20, false)

    debounced(1)
    debounced(2)
    debounced(3)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(25)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
    vi.useRealTimers()
  })
})

describe('listenScrollParent', () => {
  it('only attaches once started, and detaches on stop', () => {
    const scroller = document.createElement('div')
    setOverflow(scroller, 'auto')
    const child = document.createElement('div')
    scroller.appendChild(child)
    document.body.appendChild(scroller)

    const add = vi.spyOn(scroller, 'addEventListener')
    const remove = vi.spyOn(scroller, 'removeEventListener')
    const clb = vi.fn()

    const listener = Utils.listenScrollParent(child, clb)
    expect(add).not.toHaveBeenCalled()

    listener.start()
    expect(add).toHaveBeenCalledWith('scroll', clb)

    listener.stop()
    expect(remove).toHaveBeenCalledWith('scroll', clb)

    listener.dispose()
    expect(() => listener.start()).not.toThrow()
  })
})
