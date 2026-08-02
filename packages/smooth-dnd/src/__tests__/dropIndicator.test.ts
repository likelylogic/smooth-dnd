import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import type { DropResult } from '../exportTypes'
import { cleanupDom, makeContainer, mountContainer, settleEngine, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

const RECT = { top: 0, bottom: 400, left: 20, right: 220 }

function mount (element: HTMLElement, options: Record<string, unknown> = {}, layout: Record<string, unknown> = {}) {
  const instance = mountContainer(element, options, layout as any)
  created.push(instance)
  return instance
}

/** Collect every onDropReady payload, so the indicator can be inspected as it moves. */
function readyLog () {
  const seen: DropResult[] = []
  return { seen, onDropReady: (result: DropResult) => seen.push(result) }
}

beforeEach(() => {
  created = []
})

afterEach(async () => {
  await settleEngine()
  created.forEach(instance => {
    try {
      instance.dispose()
    }
    catch { /* already disposed */ }
  })
  created = []
  cleanupDom()
})

describe('dropFeedback: indicator', () => {
  it('leaves the siblings where they are', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    mount(element, { dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }) },
      { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 170)

    // index 0 is the dragged item and is hidden; nothing else should have been translated
    const transforms = Array.from(element.children)
      .slice(1)
      .map(child => (child as HTMLElement).style.transform)
    expect(transforms.every(t => t === '')).toBe(true)

    await drag.drop()
  })

  it('still opens a gap in the default mode', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    mount(element, { getChildPayload: (i: number) => ({ id: i }) }, { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 170)

    const transforms = Array.from(element.children)
      .slice(1)
      .map(child => (child as HTMLElement).style.transform)
    expect(transforms.some(t => t !== '')).toBe(true)

    await drag.drop()
  })

  it('reports bounds for where the item would land', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    const log = readyLog()
    mount(element, { dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady },
      { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()

    const indicator = log.seen.map(r => r.dropIndicator).filter(Boolean).pop()!
    expect(indicator).toBeTruthy()
    expect(indicator.container).toBe(element)
    // spans the container across the cross axis
    expect(indicator.viewport.left).toBe(20)
    expect(indicator.viewport.width).toBe(200)
    // and sits at the boundary between items on the layout axis
    expect(indicator.viewport.top).toBeGreaterThan(0)
    expect(indicator.viewport.top).toBeLessThanOrEqual(400)
  })

  it('reports the same rect in viewport and container-relative space', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    const log = readyLog()
    mount(element, { dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady },
      { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()

    const indicator = log.seen.map(r => r.dropIndicator).filter(Boolean).pop()!
    // the container sits at top 0, left 20 — so relative differs from viewport only by that origin
    expect(indicator.relative.left).toBe(indicator.viewport.left - 20)
    expect(indicator.relative.top).toBe(indicator.viewport.top - 0)
    expect(indicator.relative.width).toBe(indicator.viewport.width)
    expect(indicator.relative.height).toBe(indicator.viewport.height)
  })

  it('moves the indicator as the insertion point changes', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    const log = readyLog()
    mount(element, { dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady },
      { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 70)
    await drag.moveTo(0, 170)
    await drag.drop()

    const tops = log.seen.map(r => r.dropIndicator).filter(Boolean).map(i => i!.viewport.top)
    expect(new Set(tops).size).toBeGreaterThan(1)
    expect(tops[tops.length - 1]).toBeGreaterThan(tops[0])
  })

  it('runs the indicator to the container end when appending', async () => {
    const element = makeContainer(3, { containerRect: RECT, itemSize: 50 })
    const log = readyLog()
    mount(element, { dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady },
      { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 390)
    await drag.drop()

    // this is the case that used to produce NaN — the indicator must still be renderable
    const indicator = log.seen.map(r => r.dropIndicator).filter(Boolean).pop()!
    expect(Number.isFinite(indicator.viewport.top)).toBe(true)
    expect(Number.isFinite(indicator.viewport.height)).toBe(true)
    expect(indicator.viewport.height).toBeGreaterThanOrEqual(0)
  })

  it('spans the other axis when horizontal', async () => {
    const rect = { top: 10, bottom: 110, left: 0, right: 600 }
    const element = makeContainer(4, { containerRect: rect, itemSize: 80, orientation: 'horizontal' })
    const log = readyLog()
    mount(element, {
      orientation: 'horizontal',
      dropFeedback: 'indicator',
      getChildPayload: (i: number) => ({ id: i }),
      onDropReady: log.onDropReady,
    }, { containerRect: rect, itemSize: 80, orientation: 'horizontal' })

    const drag = await startDrag(element, 0)
    await drag.moveTo(200, 0)
    await drag.drop()

    const indicator = log.seen.map(r => r.dropIndicator).filter(Boolean).pop()!
    expect(indicator.viewport.top).toBe(10)
    expect(indicator.viewport.height).toBe(100)
  })

  it('omits the indicator in "none" mode, but still resolves the drop', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    const log = readyLog()
    const onDrop = vi.fn()
    mount(element, { dropFeedback: 'none', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady, onDrop },
      { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 170)

    const transforms = Array.from(element.children)
      .slice(1)
      .map(child => (child as HTMLElement).style.transform)
    expect(transforms.every(t => t === '')).toBe(true)
    expect(log.seen.every(r => r.dropIndicator == null)).toBe(true)

    await drag.drop()
    expect(onDrop).toHaveBeenCalled()
  })

  it('leaves the drop itself unchanged', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    mount(element, { containerId: 'list', dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }) },
      { containerRect: RECT, itemSize: 50 })

    const seen: any[] = []
    const off = smoothDnD.onDropComplete(result => seen.push(result))

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()
    off()

    expect(seen[0].action).toBe('reorder')
    expect(seen[0].from.index).toBe(0)
    expect(seen[0].to.index).toBe(2)
  })

  it('does not flicker between slots as the pointer sweeps across the list', async () => {
    // The insertion index has to be stable under small movements. With `gap` feedback the siblings
    // slide apart and the hysteresis band straddles a real gap; nothing moves in this mode, so the
    // neighbours touch and that band collapses to zero width — leaving the index to re-resolve on
    // every frame. It reported 1,2,1,2,1,2,3,2,3,… before the band was widened to the midpoints.
    const element = makeContainer(6, { containerRect: RECT, itemSize: 50 })
    const indices: number[] = []
    mount(element, {
      dropFeedback: 'indicator',
      getChildPayload: (i: number) => ({ id: i }),
      onDropReady: (result: DropResult) => indices.push(result.dropTarget!.index),
    }, { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    for (let y = 40; y <= 200; y += 8) {
      await drag.moveTo(0, y)
    }
    await drag.drop()

    expect(indices.length).toBeGreaterThan(1)
    // sweeping one way must only ever move the insertion point one way
    const sorted = [...indices].sort((a, b) => a - b)
    expect(indices).toEqual(sorted)
    // and each reported change should be a distinct slot, not a repeat
    expect(new Set(indices).size).toBe(indices.length)
  })

  it('keeps the gap-mode hysteresis unchanged', async () => {
    // The widened band applies only where nothing translates; gap mode keeps the original
    // threshold logic, which is tuned around the gap the siblings open.
    const element = makeContainer(6, { containerRect: RECT, itemSize: 50 })
    const indices: number[] = []
    mount(element, {
      getChildPayload: (i: number) => ({ id: i }),
      onDropReady: (result: DropResult) => indices.push(result.addedIndex!),
    }, { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    for (let y = 40; y <= 200; y += 8) {
      await drag.moveTo(0, y)
    }
    await drag.drop()

    const sorted = [...indices].sort((a, b) => a - b)
    expect(indices).toEqual(sorted)
  })

  it('does not add a placeholder element to the container', async () => {
    const element = makeContainer(4, { containerRect: RECT, itemSize: 50 })
    mount(element, {
      dropFeedback: 'indicator',
      dropPlaceholder: { className: 'should-not-appear' },
      getChildPayload: (i: number) => ({ id: i }),
    }, { containerRect: RECT, itemSize: 50 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 170)

    expect(element.querySelector('.should-not-appear')).toBeNull()
    expect(element.querySelector('.smooth-dnd-drop-preview-constant-class')).toBeNull()

    await drag.drop()
  })
})
