import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import smoothDnD from '../container'
import type { DropCompleteResult, DropResult } from '../exportTypes'
import { cleanupDom, layoutContainer, makeContainer, mountContainer, settleEngine, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

// four 50px items, so item N spans 50N..50N+50 and its middle half is 50N+12.5..50N+37.5
const RECT = { top: 0, bottom: 400, left: 0, right: 200 }
const LAYOUT = { containerRect: RECT, itemSize: 50 }

function mount (element: HTMLElement, options: Record<string, unknown> = {}, layout = LAYOUT) {
  const instance = mountContainer(element, options, layout as any)
  created.push(instance)
  return instance
}

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

describe('dropOnItems', () => {
  it('is off by default, so every target is an insertion point', async () => {
    const element = makeContainer(4, LAYOUT)
    const log = readyLog()
    mount(element, { getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120) // squarely in the middle of an item
    await drag.drop()

    expect(log.seen.every(r => r.dropTarget?.kind === 'at')).toBe(true)
  })

  it('resolves the middle of an item to a drop onto it', async () => {
    const element = makeContainer(4, LAYOUT)
    const log = readyLog()
    mount(element, { dropOnItems: true, dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady })

    // the pointer sits 25px above the dragged item's centre, so y=100 puts the resolved position
    // at 125 — the middle of item 2, which spans 100..150
    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 100)
    await drag.drop()

    const into = log.seen.map(r => r.dropTarget).filter(t => t?.kind === 'into')
    expect(into.length).toBeGreaterThan(0)
    expect(into.every(t => t!.index === 2)).toBe(true)
  })

  it('still resolves the edges of an item to an insertion point', async () => {
    const element = makeContainer(4, LAYOUT)
    const log = readyLog()
    mount(element, { dropOnItems: true, dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady })

    const drag = await startDrag(element, 0)
    // resolved position 145 — the far edge of item 2, inside its outer quarter
    await drag.moveTo(0, 120)
    await drag.drop()

    expect(log.seen.some(r => r.dropTarget?.kind === 'at')).toBe(true)
  })

  it('holds the layout still when crossing between "between" and "onto"', async () => {
    // Closing the gap for an into target would shift everything below it by an item's height each
    // time the pointer crossed the boundary — losing your place exactly when you are aiming.
    const element = makeContainer(6, { containerRect: { top: 0, bottom: 500, left: 0, right: 200 }, itemSize: 50 })
    const log = readyLog()
    mount(element, { dropOnItems: true, getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady },
      { containerRect: { top: 0, bottom: 500, left: 0, right: 200 }, itemSize: 50 })

    const layoutOf = () => Array.from(element.children)
      .map(child => (child as HTMLElement).style.transform)
      .join('|')

    const drag = await startDrag(element, 2)
    const byTarget = new Map<string, Set<string>>()
    for (let y = -60; y <= 120; y += 10) {
      await drag.moveTo(0, y)
      const target = log.seen[log.seen.length - 1]?.dropTarget
      if (target) {
        const key = `${target.kind}${target.index}`
        if (!byTarget.has(key)) {
          byTarget.set(key, new Set())
        }
        byTarget.get(key)!.add(layoutOf())
      }
    }
    await drag.drop()

    // an `at` and an `into` on the same index must leave the siblings in the same place
    const pairs = [...byTarget.keys()]
      .filter(k => k.startsWith('into'))
      .map(k => [k, `at${k.slice(4)}`] as const)
      .filter(([, at]) => byTarget.has(at))

    expect(pairs.length).toBeGreaterThan(0)
    for (const [into, at] of pairs) {
      expect([...byTarget.get(into)!]).toEqual([...byTarget.get(at)!])
    }
  })

  it('outlines the target item rather than a gap', async () => {
    const element = makeContainer(4, LAYOUT)
    const log = readyLog()
    mount(element, { dropOnItems: true, dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 100)
    await drag.drop()

    const entry = log.seen.filter(r => r.dropTarget?.kind === 'into').pop()!
    const indicator = entry.dropIndicator!
    expect(indicator).toBeTruthy()
    // an item's worth of height, not a hairline between two
    expect(indicator.viewport.height).toBe(50)
  })

  it('reports the drop as landing into the item, with its index', async () => {
    const element = makeContainer(4, LAYOUT)
    mount(element, { containerId: 'tree', dropOnItems: true, dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }) })

    const seen: DropCompleteResult[] = []
    const off = smoothDnD.onDropComplete(result => seen.push(result))

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 100)
    await drag.drop()
    off()

    expect(seen).toHaveLength(1)
    expect(seen[0].to!.kind).toBe('into')
    expect(seen[0].to!.index).toBe(2)
    expect(seen[0].to!.containerId).toBe('tree')
    // landing inside another item is a move, not a reorder among siblings
    expect(seen[0].action).toBe('move')
  })

  it('marks ordinary insertions as "at" on both ends', async () => {
    const element = makeContainer(4, LAYOUT)
    mount(element, { containerId: 'list', getChildPayload: (i: number) => ({ id: i }) })

    const seen: DropCompleteResult[] = []
    const off = smoothDnD.onDropComplete(result => seen.push(result))

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()
    off()

    expect(seen[0].from!.kind).toBe('at')
    expect(seen[0].to!.kind).toBe('at')
    expect(seen[0].action).toBe('reorder')
  })

  it('never offers the dragged item itself as a target', async () => {
    // It is still in the list and still occupies its slot, since nothing translates in this mode.
    const element = makeContainer(4, LAYOUT)
    const log = readyLog()
    mount(element, { dropOnItems: true, dropFeedback: 'indicator', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 0)  // resolved position 25 — the middle of the dragged item
    await drag.drop()

    const into = log.seen.map(r => r.dropTarget).filter(t => t?.kind === 'into')
    expect(into.every(t => t!.index !== 0)).toBe(true)
  })

  it('combines with gap feedback: a gap for between, a highlight for into', async () => {
    // The pairing that matters. Nothing has to make room for an item going *inside* another, so an
    // into target closes the gap and reports the item's bounds instead — while ordinary insertions
    // keep sliding the siblings apart.
    const element = makeContainer(6, { containerRect: { top: 0, bottom: 500, left: 0, right: 200 }, itemSize: 50 })
    const log = readyLog()
    mount(element, { dropOnItems: true, dropFeedback: 'gap', getChildPayload: (i: number) => ({ id: i }), onDropReady: log.onDropReady },
      { containerRect: { top: 0, bottom: 500, left: 0, right: 200 }, itemSize: 50 })

    const drag = await startDrag(element, 2)
    const kinds = new Set<string>()
    for (let y = -60; y <= 120; y += 10) {
      await drag.moveTo(0, y)
      const last = log.seen[log.seen.length - 1]
      if (last?.dropTarget) {
        kinds.add(last.dropTarget.kind)
      }
    }
    await drag.drop()

    // both kinds occur in the same drag, under the default feedback
    expect([...kinds].sort()).toEqual(['at', 'into'])
    // and an into target always reports bounds, since a gap cannot express it
    const intoEntries = log.seen.filter(r => r.dropTarget?.kind === 'into')
    expect(intoEntries.length).toBeGreaterThan(0)
    expect(intoEntries.every(r => r.dropIndicator != null)).toBe(true)
  })

  it('reaches the same targets dragging up as dragging down, under gap feedback', async () => {
    async function sweep (from: number, to: number, step: number) {
      const element = makeContainer(6, { containerRect: { top: 0, bottom: 500, left: 0, right: 200 }, itemSize: 50 })
      const seen: string[] = []
      const instance = mount(element, {
        dropOnItems: true,
        getChildPayload: (i: number) => ({ id: i }),
        onDropReady: (r: DropResult) => seen.push(`${r.dropTarget!.kind}${r.dropTarget!.index}`),
      }, { containerRect: { top: 0, bottom: 500, left: 0, right: 200 }, itemSize: 50 })

      const drag = await startDrag(element, 2)
      for (let y = from; step > 0 ? y <= to : y >= to; y += step) {
        await drag.moveTo(0, y)
      }
      await drag.drop()
      instance.dispose()
      return new Set(seen)
    }

    const down = await sweep(-50, 110, 10)
    const up = await sweep(110, -50, -10)
    expect([...down].sort()).toEqual([...up].sort())
  })
})

describe('nested self-drop guard', () => {
  it('stops a container inside the dragged item accepting it', async () => {
    // outer list; its second item hosts an inner container of the same group
    const outer = document.createElement('div')
    for (let i = 0; i < 3; i++) {
      outer.appendChild(document.createElement('div'))
    }
    document.body.appendChild(outer)

    const host = outer.children[1] as HTMLElement
    const inner = document.createElement('div')
    for (let i = 0; i < 2; i++) {
      inner.appendChild(document.createElement('div'))
    }
    host.appendChild(inner)

    layoutContainer(outer, { itemSize: 120, containerRect: { top: 0, bottom: 400, left: 0, right: 200 } })
    layoutContainer(inner, { itemSize: 40, containerRect: { top: 120, bottom: 200, left: 0, right: 200 } })

    mount(outer, { groupName: 'g', containerId: 'outer', getChildPayload: (i: number) => ({ id: i }) },
      { itemSize: 120, containerRect: { top: 0, bottom: 400, left: 0, right: 200 } })
    mount(inner, { groupName: 'g', containerId: 'inner' },
      { itemSize: 40, containerRect: { top: 120, bottom: 200, left: 0, right: 200 } })

    const seen: DropCompleteResult[] = []
    const off = smoothDnD.onDropComplete(result => seen.push(result))

    // drag the outer item that *contains* the inner container, and release over the inner one
    const drag = await startDrag(outer, 1, () => inner)
    await drag.moveTo(0, 150)
    await drag.drop()
    off()

    // the inner container is a descendant of the dragged item, so it must not have taken it
    expect(seen[0].to?.containerId).not.toBe('inner')
  })
})
