import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import { cleanupDom, layoutContainer, settleEngine, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

function mount (element: HTMLElement, options: Record<string, unknown> = {}) {
  const instance = smoothDnD(element, { animationDuration: 1, ...options } as any)
  created.push(instance)
  return instance
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

/**
 * The shape the `drop-out` demo uses: a `drop-zone` container that surrounds a sortable, so an
 * item dragged off the list and released into the surrounding space still registers a drop.
 */
function makeSurrounded () {
  const surround = document.createElement('div')
  document.body.appendChild(surround)

  // a plain, non-draggable child holding the sortable
  const host = document.createElement('div')
  surround.appendChild(host)

  const list = document.createElement('div')
  for (let i = 0; i < 4; i++) {
    list.appendChild(document.createElement('div'))
  }
  host.appendChild(list)

  layoutContainer(surround, { itemSize: 400, containerRect: { top: 0, bottom: 800, left: 0, right: 600 } })
  layoutContainer(list, { itemSize: 40, containerRect: { top: 0, bottom: 160, left: 0, right: 200 } })
  return { surround, list }
}

describe('surrounding drop zone', () => {
  it('routes the drop to the innermost relevant container under the pointer', async () => {
    const { surround, list } = makeSurrounded()
    const onSurroundDrop = vi.fn()
    const onListDrop = vi.fn()

    mount(surround, { groupName: 'g', behaviour: 'drop-zone', onDrop: onSurroundDrop })
    mount(list, { groupName: 'g', getChildPayload: (i: number) => ({ id: i }), onDrop: onListDrop })

    let hit: Element = list
    const drag = await startDrag(list, 0, () => hit)

    // still over the list — the list owns the drop
    await drag.moveTo(0, 80)
    await drag.drop()

    expect(onListDrop).toHaveBeenCalled()
    expect(onSurroundDrop.mock.calls.every(([r]) => r.addedIndex === null)).toBe(true)
  })

  it('registers a drop released into the surrounding empty space', async () => {
    const { surround, list } = makeSurrounded()
    const onSurroundDrop = vi.fn()
    const onListDrop = vi.fn()

    mount(surround, { groupName: 'g', behaviour: 'drop-zone', onDrop: onSurroundDrop })
    mount(list, { groupName: 'g', getChildPayload: (i: number) => ({ id: i }), onDrop: onListDrop })

    let hit: Element = list
    const drag = await startDrag(list, 0, () => hit)

    // drag out of the list into the surround
    hit = surround
    await drag.moveTo(500, 600)
    await drag.drop()

    // the surround claims the drop...
    const surroundResult = onSurroundDrop.mock.calls.map(([r]) => r).find(r => r.addedIndex !== null)
    expect(surroundResult).toBeDefined()
    expect(surroundResult.addedIndex).toBe(0) // drop-zone never sorts
    expect(surroundResult.payload).toEqual({ id: 0 })

    // ...and the source list reports the removal, so the app can move the item
    const listResult = onListDrop.mock.calls.map(([r]) => r).find(r => r.removedIndex !== null)
    expect(listResult).toBeDefined()
    expect(listResult.removedIndex).toBe(0)
  })

  it('fires enter/leave on the surround as the pointer crosses the list boundary', async () => {
    const { surround, list } = makeSurrounded()
    const events: string[] = []

    mount(surround, {
      groupName: 'g',
      behaviour: 'drop-zone',
      onDragEnter: () => events.push('enter'),
      onDragLeave: () => events.push('leave'),
    })
    mount(list, { groupName: 'g', getChildPayload: (i: number) => ({ id: i }) })

    let hit: Element = list
    const drag = await startDrag(list, 0, () => hit)
    await drag.moveTo(0, 80)

    hit = surround
    await drag.moveTo(500, 600)
    expect(events).toContain('enter')

    hit = list
    await drag.moveTo(0, 80)
    expect(events[events.length - 1]).toBe('leave')

    await drag.drop()
  })

  it('wraps the surround’s plain children in vanilla mode, making them draggable', async () => {
    // Worth pinning, because it decides whether this pattern is usable as-is. In vanilla mode
    // `wrapChild` defaults to true, so every child of the surrounding container — the layout divs
    // holding the sortables — is wrapped and becomes grabbable.
    const { surround, list } = makeSurrounded()
    mount(surround, { groupName: 'g', behaviour: 'drop-zone' })
    mount(list, { groupName: 'g' })

    const host = surround.children[0] as HTMLElement
    expect(host.className).toContain('smooth-dnd-draggable-wrapper')

    host.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 0, clientY: 20 }))
    expect(smoothDnD.isDragging()).toBe(true)

    smoothDnD.cancelDrag()
  })

  it('leaves them alone under a framework adapter, where wrapChild is off', async () => {
    // Both adapters set `smoothDnD.wrapChild = false` at import time, so the host divs keep their
    // own markup and — lacking the wrapper class — cannot start a drag. This is the configuration
    // the drop-out demo runs in.
    const previous = smoothDnD.wrapChild
    smoothDnD.wrapChild = false
    try {
      const { surround, list } = makeSurrounded()
      mount(surround, { groupName: 'g', behaviour: 'drop-zone' })
      mount(list, { groupName: 'g' })

      const host = surround.children[0] as HTMLElement
      expect(host.className).not.toContain('smooth-dnd-draggable-wrapper')

      host.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 0, clientY: 20 }))
      expect(smoothDnD.isDragging()).toBe(false)
    }
    finally {
      smoothDnD.wrapChild = previous
    }
  })
})
