import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import { cleanupDom, ghostElement, makeContainer, mountContainer, settleEngine, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

function mount (element: HTMLElement, options: Record<string, unknown> = {}) {
  const instance = mountContainer(element, options)
  created.push(instance)
  return instance
}

function pressEscape (key = 'Escape') {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  document.dispatchEvent(event)
  return event
}

beforeEach(() => {
  created = []
  smoothDnD.cancelOnEscape = true
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
  smoothDnD.cancelOnEscape = true
  cleanupDom()
})

describe('cancel on escape', () => {
  it('cancels an in-progress drag', async () => {
    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ id: i }) })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    expect(smoothDnD.isDragging()).toBe(true)

    pressEscape()
    await drag.settle()

    expect(smoothDnD.isDragging()).toBe(false)
    expect(ghostElement()).toBeNull()
  })

  it('reports the drag as cancelled rather than dropped', async () => {
    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ id: i }) })

    const seen: any[] = []
    const off = smoothDnD.onDropComplete(result => seen.push(result))

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    pressEscape()
    await drag.settle()
    off()

    expect(seen).toHaveLength(1)
    expect(seen[0].cancelled).toBe(true)
    expect(seen[0].action).toBe('none')
  })

  it('accepts the legacy Esc spelling', async () => {
    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ id: i }) })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    pressEscape('Esc')
    await drag.settle()

    expect(smoothDnD.isDragging()).toBe(false)
  })

  it('stops the key reaching application handlers while dragging', async () => {
    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ id: i }) })
    const appHandler = vi.fn()
    document.addEventListener('keydown', appHandler)

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    const event = pressEscape()
    await drag.settle()
    document.removeEventListener('keydown', appHandler)

    expect(appHandler).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves the key alone when no drag is running', () => {
    const appHandler = vi.fn()
    document.addEventListener('keydown', appHandler)

    pressEscape()
    document.removeEventListener('keydown', appHandler)

    expect(appHandler).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', async () => {
    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ id: i }) })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    pressEscape('Enter')

    expect(smoothDnD.isDragging()).toBe(true)
    await drag.drop()
  })

  it('can be turned off, leaving the key to the application', async () => {
    smoothDnD.cancelOnEscape = false

    const element = makeContainer(3)
    mount(element, { getChildPayload: (i: number) => ({ id: i }) })
    const appHandler = vi.fn()
    document.addEventListener('keydown', appHandler)

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    pressEscape()
    document.removeEventListener('keydown', appHandler)

    expect(smoothDnD.isDragging()).toBe(true)
    expect(appHandler).toHaveBeenCalledTimes(1)

    await drag.drop()
  })

  it('is on by default', () => {
    expect(smoothDnD.cancelOnEscape).toBe(true)
  })
})
