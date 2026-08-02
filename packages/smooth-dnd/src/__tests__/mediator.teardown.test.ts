import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import { cleanupDom, flushFrames, ghostElement, makeContainer, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

function mount (element: HTMLElement, options: Record<string, unknown> = {}) {
  const instance = smoothDnD(element, { animationDuration: 1, ...options } as any)
  created.push(instance)
  return instance
}

/** Swallow errors surfaced through jsdom's listener reporting, and hand them back. */
function collectWindowErrors () {
  const errors: Error[] = []
  const onError = (event: ErrorEvent) => {
    errors.push(event.error ?? new Error(event.message))
    event.preventDefault()
  }
  window.addEventListener('error', onError)
  return {
    errors,
    stop: () => window.removeEventListener('error', onError),
  }
}

beforeEach(() => {
  created = []
})

afterEach(() => {
  created.forEach(instance => {
    try {
      instance.dispose()
    }
    catch { /* already disposed */ }
  })
  created = []
  cleanupDom()
})

describe('drag lifecycle', () => {
  it('creates a ghost on drag start and removes it on drop', async () => {
    const element = makeContainer(3)
    mount(element)

    const drag = await startDrag(element, 0)
    expect(ghostElement()).not.toBeNull()

    await drag.moveTo(0, 120)
    await drag.drop()

    expect(ghostElement()).toBeNull()
    expect(smoothDnD.isDragging()).toBe(false)
  })

  it('allows a second drag once the first has completed', async () => {
    const element = makeContainer(3)
    mount(element)

    const first = await startDrag(element, 0)
    await first.moveTo(0, 120)
    await first.drop()

    const second = await startDrag(element, 1)
    expect(smoothDnD.isDragging()).toBe(true)
    await second.drop()
    expect(smoothDnD.isDragging()).toBe(false)
  })
})

describe('teardown robustness', () => {
  it('settles on transitionend without waiting out the timer', async () => {
    const element = makeContainer(3)
    // a long animation: if teardown waited for the timer this test would time out
    mount(element, { animationDuration: 10_000 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()

    expect(ghostElement()).toBeNull()
    expect(smoothDnD.isDragging()).toBe(false)
  })

  it('still tears down when no transitionend ever arrives', async () => {
    const element = makeContainer(3)
    mount(element, { animationDuration: 1 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    drag.release()

    // no transitionend is dispatched; the fallback timer has to finish the job
    await new Promise(resolve => setTimeout(resolve, 250))

    expect(ghostElement()).toBeNull()
    expect(smoothDnD.isDragging()).toBe(false)
  })

  it('does not remove the ghost twice when both signals fire', async () => {
    const element = makeContainer(3)
    mount(element, { animationDuration: 1 })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    const ghost = ghostElement()!
    const removeSpy = vi.spyOn(ghost, 'remove')

    await drag.drop()
    await new Promise(resolve => setTimeout(resolve, 120))

    expect(removeSpy).toHaveBeenCalledTimes(1)
  })

  it('survives the source item being unmounted mid-drag', async () => {
    const element = makeContainer(3)
    mount(element)

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)

    // the framework re-renders and drops the source row; the ghost's parent is now stale
    element.removeChild(element.children[0])

    const captured = collectWindowErrors()
    await drag.drop()
    captured.stop()

    expect(captured.errors).toEqual([])
    expect(ghostElement()).toBeNull()
    expect(smoothDnD.isDragging()).toBe(false)
  })

  it('resets drag state even when a consumer onDrop throws', async () => {
    const element = makeContainer(3)
    mount(element, {
      onDrop () {
        throw new Error('consumer exploded')
      },
    })

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)

    const captured = collectWindowErrors()
    await drag.drop()
    captured.stop()

    // the error is surfaced, not swallowed...
    expect(captured.errors.map(e => e.message)).toContain('consumer exploded')
    // ...but the library is left usable
    expect(smoothDnD.isDragging()).toBe(false)
    expect(ghostElement()).toBeNull()
  })

  it('leaves cancelDrag working after a consumer onDrop threw', async () => {
    // The sharpest consequence of skipping the teardown: `dropAnimationStarted` stays true, and
    // cancelDrag() guards on `!dropAnimationStarted` — so escape-to-cancel silently stops working
    // for the rest of the session, with no error to point at.
    const element = makeContainer(3)
    let shouldThrow = true
    mount(element, {
      onDrop () {
        if (shouldThrow) {
          throw new Error('consumer exploded')
        }
      },
    })

    const captured = collectWindowErrors()
    const first = await startDrag(element, 0)
    await first.moveTo(0, 120)
    await first.drop()
    shouldThrow = false

    const second = await startDrag(element, 0)
    await second.moveTo(0, 120)
    expect(smoothDnD.isDragging()).toBe(true)

    smoothDnD.cancelDrag()
    await second.settle()
    await flushFrames()
    captured.stop()

    expect(smoothDnD.isDragging()).toBe(false)
    expect(ghostElement()).toBeNull()
  })

  it('can start a new drag after a consumer onDrop threw', async () => {
    const element = makeContainer(3)
    let shouldThrow = true
    mount(element, {
      onDrop () {
        if (shouldThrow) {
          throw new Error('consumer exploded')
        }
      },
    })

    const captured = collectWindowErrors()
    const first = await startDrag(element, 0)
    await first.moveTo(0, 120)
    await first.drop()

    shouldThrow = false
    const second = await startDrag(element, 0)
    expect(smoothDnD.isDragging()).toBe(true)
    await second.drop()
    captured.stop()

    expect(smoothDnD.isDragging()).toBe(false)
  })

  it('lets every container reset when one of them throws', async () => {
    const first = makeContainer(3)
    const second = makeContainer(3)
    const dropped: string[] = []

    mount(first, {
      groupName: 'shared',
      onDrop () {
        dropped.push('first')
        throw new Error('first exploded')
      },
    })
    mount(second, {
      groupName: 'shared',
      onDrop () {
        dropped.push('second')
      },
    })

    const captured = collectWindowErrors()
    const drag = await startDrag(first, 0)
    await drag.moveTo(0, 120)
    await drag.drop()
    captured.stop()

    // the throwing container must not stop the others from completing — their handleDrop is what
    // restores translations and visibility
    expect(dropped).toEqual(['first', 'second'])
    expect(smoothDnD.isDragging()).toBe(false)
  })
})

describe('cancelDrag', () => {
  it('ends the drag and clears the ghost', async () => {
    const element = makeContainer(3)
    mount(element)

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    expect(smoothDnD.isDragging()).toBe(true)

    smoothDnD.cancelDrag()
    await drag.settle()
    await flushFrames()

    expect(smoothDnD.isDragging()).toBe(false)
    expect(ghostElement()).toBeNull()
  })
})
