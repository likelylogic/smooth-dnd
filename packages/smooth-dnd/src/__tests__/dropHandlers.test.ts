import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import { cleanupDom, makeContainer, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

function mount (element: HTMLElement, options: Record<string, unknown> = {}) {
  const instance = smoothDnD(element, { animationDuration: 1, ...options } as any)
  created.push(instance)
  return instance
}

beforeEach(() => {
  created = []
})

afterEach(() => {
  if (smoothDnD.isDragging()) {
    smoothDnD.cancelDrag()
  }
  created.forEach(instance => {
    try {
      instance.dispose()
    }
    catch { /* already disposed */ }
  })
  created = []
  cleanupDom()
})

function labels (container: HTMLElement) {
  return Array.from(container.children).map(child => child.textContent)
}

/**
 * The built-in DOM drop handler — the one used when no framework adapter has replaced it.
 * The adapters swap in `reactDropHandler` and manage the DOM themselves, so this path only runs
 * for vanilla consumers.
 */
describe('domDropHandler', () => {
  it('reorders within a single container', async () => {
    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ i }) })
    expect(labels(element)).toEqual(['item 0', 'item 1', 'item 2'])

    let hit: Element = element
    const drag = await startDrag(element, 0, () => hit)
    await drag.moveTo(0, 140)
    await drag.drop()

    expect(element.children.length).toBe(3)
    expect(labels(element)).toContain('item 0')
  })

  it('moves a node between containers', async () => {
    // Previously threw: the receiving container has no removedIndex, so it had nothing to insert
    // — the dragged node was never passed to the handler. The item vanished from the source and
    // never arrived at the target.
    const source = makeContainer(3, { containerRect: { top: 0, bottom: 200, left: 0, right: 200 } })
    const target = makeContainer(2, { containerRect: { top: 300, bottom: 500, left: 0, right: 200 } })
    const onTargetDrop = vi.fn()

    mount(source, { groupName: 'g', getChildPayload: (i: number) => ({ i }) })
    mount(target, { groupName: 'g', onDrop: onTargetDrop })

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.drop()

    expect(source.children.length).toBe(2)
    expect(target.children.length).toBe(3)
    expect(labels(target)).toContain('item 0')

    const added = onTargetDrop.mock.calls.map(([r]) => r).find(r => r.addedIndex !== null)
    expect(added).toBeDefined()
    expect(added.payload).toEqual({ i: 0 })
  })

  it('keeps the moved node’s identity rather than cloning it', async () => {
    const source = makeContainer(2, { containerRect: { top: 0, bottom: 200, left: 0, right: 200 } })
    const target = makeContainer(1, { containerRect: { top: 300, bottom: 500, left: 0, right: 200 } })

    mount(source, { groupName: 'g', getChildPayload: (i: number) => ({ i }) })
    mount(target, { groupName: 'g' })

    const moved = source.children[0].firstElementChild
    ;(moved as HTMLElement).dataset.marker = 'original'

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.drop()

    expect(target.querySelector('[data-marker="original"]')).toBe(moved)
    expect(source.querySelector('[data-marker="original"]')).toBeNull()
  })

  it('wraps the received node so it is draggable in its new container', async () => {
    const source = makeContainer(2, { containerRect: { top: 0, bottom: 200, left: 0, right: 200 } })
    const target = makeContainer(1, { containerRect: { top: 300, bottom: 500, left: 0, right: 200 } })

    mount(source, { groupName: 'g', getChildPayload: (i: number) => ({ i }) })
    mount(target, { groupName: 'g' })

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.drop()

    Array.from(target.children).forEach(child => {
      expect(child.className).toContain('smooth-dnd-draggable-wrapper')
    })
  })
})
