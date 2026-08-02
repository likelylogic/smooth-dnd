import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import type { DropCompleteResult } from '../exportTypes'
import { cleanupDom, makeContainer, mountContainer, settleEngine, startDrag } from './helpers'

let created: { dispose: () => void }[] = []
let unsubscribers: (() => void)[] = []

const SOURCE = { top: 0, bottom: 200, left: 0, right: 200 }
const TARGET = { top: 300, bottom: 500, left: 0, right: 200 }

function mount (element: HTMLElement, options: Record<string, unknown> = {}, layout: Record<string, unknown> = {}) {
  // mountContainer re-applies the layout after wrapping — without that the draggables measure zero
  // and the insertion index stops tracking the pointer
  const instance = mountContainer(element, options, layout as any)
  created.push(instance)
  return instance
}

/** Subscribe for the duration of a test, collecting every completion. */
function collect () {
  const results: DropCompleteResult[] = []
  unsubscribers.push(smoothDnD.onDropComplete(result => results.push(result)))
  return results
}

beforeEach(() => {
  created = []
  unsubscribers = []
})

afterEach(async () => {
  await settleEngine()
  unsubscribers.forEach(off => off())
  created.forEach(instance => {
    try {
      instance.dispose()
    }
    catch { /* already disposed */ }
  })
  created = []
  unsubscribers = []
  cleanupDom()
})

describe('onDropComplete', () => {
  it('fires exactly once for a drag that spans two containers', async () => {
    const source = makeContainer(3, { containerRect: SOURCE })
    const target = makeContainer(2, { containerRect: TARGET })
    const perContainer = vi.fn()

    mount(source, { groupName: 'g', containerId: 'source', getChildPayload: (i: number) => ({ i }), onDrop: perContainer }, { containerRect: SOURCE })
    mount(target, { groupName: 'g', containerId: 'target', onDrop: perContainer }, { containerRect: TARGET })
    const results = collect()

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.drop()

    // the per-container callback still fires for each end — that contract is unchanged
    expect(perContainer.mock.calls.length).toBeGreaterThan(1)
    // but the completion is reported once
    expect(results).toHaveLength(1)
  })

  it('reports both ends of a cross-container move', async () => {
    const source = makeContainer(3, { containerRect: SOURCE })
    const target = makeContainer(2, { containerRect: TARGET })

    mount(source, { groupName: 'g', containerId: 'source', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    mount(target, { groupName: 'g', containerId: 'target' }, { containerRect: TARGET })
    const results = collect()

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.drop()

    const [result] = results
    expect(result.action).toBe('move')
    expect(result.from!.containerId).toBe('source')
    expect(result.from!.element).toBe(source)
    expect(result.from!.index).toBe(0)
    expect(result.to!.containerId).toBe('target')
    expect(result.to!.element).toBe(target)
    expect(result.payload).toEqual({ id: 0 })
    expect(result.droppedOutside).toBe(false)
    expect(result.cancelled).toBe(false)
  })

  it('reports a reorder within one container', async () => {
    const element = makeContainer(4, { containerRect: SOURCE, itemSize: 50 })
    mount(element, { containerId: 'list', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE, itemSize: 50 })
    const results = collect()

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 170)
    await drag.drop()

    const [result] = results
    expect(result.action).toBe('reorder')
    expect(result.from!.containerId).toBe('list')
    expect(result.to!.containerId).toBe('list')
    expect(result.from!.index).toBe(0)
    expect(result.to!.index).toBe(3)
  })

  it('reports the index the item actually ended up at, not the raw insertion point', async () => {
    // The per-container result adjusts addedIndex down when the item moved forward within its own
    // container; the completion has to match, or consumers get an index that is one out.
    const element = makeContainer(4, { containerRect: SOURCE, itemSize: 50 })
    mount(element, { containerId: 'list', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE, itemSize: 50 })
    const results = collect()

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()

    // four 50px items; dropping the first at y=120 lands it in slot 2. The raw insertion index is
    // 3 — one higher, because the item has not been removed yet at that point — so a consumer
    // receiving the unadjusted value would insert one slot too far down.
    const [result] = results
    expect(result.to!.index).toBe(2)
  })

  it('reports "none" when the item is dropped back where it started', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { containerId: 'list', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const results = collect()

    const drag = await startDrag(element, 0)
    await drag.drop()

    expect(results).toHaveLength(1)
    expect(results[0].action).toBe('none')
  })

  it('reports "copy" when the source copies rather than moves', async () => {
    const source = makeContainer(3, { containerRect: SOURCE })
    const target = makeContainer(2, { containerRect: TARGET })

    mount(source, { groupName: 'g', containerId: 'source', behaviour: 'copy', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    mount(target, { groupName: 'g', containerId: 'target' }, { containerRect: TARGET })
    const results = collect()

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.drop()

    expect(results[0].action).toBe('copy')
    expect(results[0].from!.index).toBe(0)
  })

  it('reports "remove" only when the source removes on drop out', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { containerId: 'list', removeOnDropOut: true, getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const results = collect()

    // hit nothing, so the pointer is over no relevant container
    const drag = await startDrag(element, 0, () => document.body)
    await drag.moveTo(900, 900)
    await drag.drop()

    expect(results[0].action).toBe('remove')
    expect(results[0].droppedOutside).toBe(true)
    expect(results[0].to).toBeNull()
  })

  it('reports "none" for a drop out when the source does not remove', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { containerId: 'list', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const results = collect()

    const drag = await startDrag(element, 0, () => document.body)
    await drag.moveTo(900, 900)
    await drag.drop()

    expect(results[0].action).toBe('none')
    expect(results[0].droppedOutside).toBe(true)
  })

  it('marks a cancelled drag as cancelled, and does nothing', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { containerId: 'list', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const results = collect()

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    smoothDnD.cancelDrag()
    await drag.settle()

    expect(results).toHaveLength(1)
    expect(results[0].cancelled).toBe(true)
    expect(results[0].action).toBe('none')
  })

  it('carries the container options through, so handlers can inspect them', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { containerId: 'list', groupName: 'g', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const results = collect()

    const drag = await startDrag(element, 0)
    await drag.drop()

    expect(results[0].from!.options.groupName).toBe('g')
  })

  it('leaves containerId undefined when none was set', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const results = collect()

    const drag = await startDrag(element, 0)
    await drag.drop()

    expect(results[0].from!.containerId).toBeUndefined()
  })
})

describe('onDropComplete subscription', () => {
  it('unsubscribes cleanly', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })

    const seen: DropCompleteResult[] = []
    const off = smoothDnD.onDropComplete(result => seen.push(result))
    off()

    const drag = await startDrag(element, 0)
    await drag.drop()

    expect(seen).toHaveLength(0)
  })

  it('notifies every subscriber', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })
    const first = collect()
    const second = collect()

    const drag = await startDrag(element, 0)
    await drag.drop()

    expect(first).toHaveLength(1)
    expect(second).toHaveLength(1)
  })

  it('lets the other subscribers run when one throws', async () => {
    const element = makeContainer(3, { containerRect: SOURCE })
    mount(element, { getChildPayload: (i: number) => ({ id: i }) }, { containerRect: SOURCE })

    const errors: Error[] = []
    const onError = (event: ErrorEvent) => {
      errors.push(event.error ?? new Error(event.message))
      event.preventDefault()
    }
    window.addEventListener('error', onError)

    unsubscribers.push(smoothDnD.onDropComplete(() => {
      throw new Error('subscriber exploded')
    }))
    const survivors = collect()

    const drag = await startDrag(element, 0)
    await drag.drop()
    window.removeEventListener('error', onError)

    expect(survivors).toHaveLength(1)
    expect(errors.map(e => e.message)).toContain('subscriber exploded')
    expect(smoothDnD.isDragging()).toBe(false)
  })
})
