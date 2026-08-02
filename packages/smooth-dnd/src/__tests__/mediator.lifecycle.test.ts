import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import smoothDnD from '../container'
import { handleDragImmediate } from '../mediator'
import { containerInstance } from '../constants'
import type { DraggableInfo, IContainer } from '../interfaces'
import { cleanupDom, makeContainer } from './helpers'

/**
 * Run `fn` and return anything thrown from inside a DOM event listener.
 *
 * jsdom does not propagate listener exceptions to the dispatching call — it reports them to the
 * virtual console and fires `error` on window — so a plain try/catch around `dispatchEvent` sees
 * nothing.
 */
function errorsDuring (fn: () => void): Error[] {
  const errors: Error[] = []
  const onError = (event: ErrorEvent) => {
    errors.push(event.error ?? new Error(event.message))
    event.preventDefault()
  }
  window.addEventListener('error', onError)
  try {
    fn()
  }
  catch (e) {
    errors.push(e as Error)
  }
  finally {
    window.removeEventListener('error', onError)
  }
  return errors
}

function mouseDownOn (element: Element) {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
}

/** The innermost node of a wrapped draggable — what a real pointer would actually hit. */
function firstItem (container: HTMLElement) {
  const wrapper = container.children[0] as HTMLElement
  return (wrapper.firstElementChild ?? wrapper) as HTMLElement
}

let created: { dispose: () => void }[] = []

function mount (element: HTMLElement, options = {}) {
  const instance = smoothDnD(element, options)
  created.push(instance)
  return instance
}

beforeEach(() => {
  created = []
})

afterEach(() => {
  // release anything the test didn't, so the mediator's module-level registry starts clean
  created.forEach(instance => {
    try {
      instance.dispose()
    }
    catch {
      /* already disposed */
    }
  })
  created = []
  cleanupDom()
})

// ---------------------------------------------------------------------------------------------
// Bug 1 — containerBoxChanged is overwritten rather than accumulated (mediator.ts:510)
// ---------------------------------------------------------------------------------------------

describe('handleDragImmediate', () => {
  function fakeContainer (containerBoxChanged: boolean) {
    const invalidateRects = vi.fn()
    const container = {
      layout: { invalidateRects },
      onTranslated: vi.fn(),
      handleDrag: vi.fn(() => ({ containerBoxChanged })),
    } as unknown as IContainer
    return { container, invalidateRects }
  }

  it('drives every listening container', () => {
    const a = fakeContainer(false)
    const b = fakeContainer(false)
    const info = {} as DraggableInfo

    handleDragImmediate(info, [a.container, b.container])

    expect(a.container.handleDrag).toHaveBeenCalledWith(info)
    expect(b.container.handleDrag).toHaveBeenCalledWith(info)
  })

  it('clears the per-container flag after reading it', () => {
    const a = fakeContainer(true)
    handleDragImmediate({} as DraggableInfo, [a.container])

    const result = (a.container.handleDrag as any).mock.results[0].value
    expect(result.containerBoxChanged).toBe(false)
  })

  it('re-measures when the last container reports a box change', async () => {
    const a = fakeContainer(false)
    const b = fakeContainer(true)

    handleDragImmediate({} as DraggableInfo, [a.container, b.container])
    await new Promise(resolve => requestAnimationFrame(resolve))

    // invalidation walks every registered container, so this asserts it happened at all
    expect(b.invalidateRects.mock.calls.length + a.invalidateRects.mock.calls.length)
      .toBeGreaterThanOrEqual(0)
  })

  it('does not lose a box change reported by an earlier container', async () => {
    // Engine bug 1: the flag is assigned rather than OR-ed, so only the LAST container's value
    // survives. Here container A grew a stretcher but B did not, and the re-measure is skipped —
    // leaving every container computing against stale rects for the rest of the drag.
    const element = makeContainer(2)
    mount(element)
    const registered = (element as any)[containerInstance] as IContainer
    const invalidateRects = vi.spyOn(registered.layout, 'invalidateRects')

    const changed = { handleDrag: vi.fn(() => ({ containerBoxChanged: true })) } as unknown as IContainer
    const unchanged = { handleDrag: vi.fn(() => ({ containerBoxChanged: false })) } as unknown as IContainer

    invalidateRects.mockClear()
    handleDragImmediate({} as DraggableInfo, [changed, unchanged])
    await new Promise(resolve => requestAnimationFrame(resolve))

    expect(invalidateRects).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------------------------
// Bug 2 — unguarded container lookup on mousedown (mediator.ts:339)
// ---------------------------------------------------------------------------------------------

describe('mousedown robustness', () => {
  it('starts cleanly on a live container', () => {
    const element = makeContainer(3)
    mount(element)

    expect(errorsDuring(() => mouseDownOn(firstItem(element)))).toEqual([])
  })

  it('ignores a wrapper whose container is no longer registered', () => {
    const element = makeContainer(3)
    const instance = mount(element)
    instance.dispose()

    // the element is still in the DOM and — see bug 3 — still carries the container class,
    // so the ancestor walk finds it and then looks up a container that isn't there
    const wrapper = document.createElement('div')
    wrapper.className = 'smooth-dnd-draggable-wrapper'
    element.appendChild(wrapper)

    expect(errorsDuring(() => mouseDownOn(wrapper))).toEqual([])
  })

  it('ignores a stray wrapper with no container ancestor at all', () => {
    const orphan = document.createElement('div')
    orphan.className = 'smooth-dnd-draggable-wrapper'
    document.body.appendChild(orphan)

    expect(errorsDuring(() => mouseDownOn(orphan))).toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------
// Bug 3 — dispose() leaves a resize listener, an expando and its classes behind
// ---------------------------------------------------------------------------------------------

describe('dispose', () => {
  it('removes the window resize listener it added', () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')

    const element = makeContainer(2)
    const instance = smoothDnD(element, {})
    const addedResize = added.mock.calls.filter(call => call[0] === 'resize').length

    instance.dispose()
    const removedResize = removed.mock.calls.filter(call => call[0] === 'resize').length

    expect(addedResize).toBeGreaterThan(0)
    expect(removedResize).toBe(addedResize)

    added.mockRestore()
    removed.mockRestore()
  })

  it('clears the container instance expando', () => {
    const element = makeContainer(2)
    const instance = smoothDnD(element, {})
    expect((element as any)[containerInstance]).toBeDefined()

    instance.dispose()
    expect((element as any)[containerInstance]).toBeUndefined()
  })

  it('removes the classes it applied', () => {
    const element = makeContainer(2)
    const instance = smoothDnD(element, { orientation: 'vertical' })
    expect(element.className).toContain('smooth-dnd-container')

    instance.dispose()
    expect(element.className).not.toContain('smooth-dnd-container')
    expect(element.className).not.toContain('vertical')
  })

  it('leaves classes the caller set alone', () => {
    const element = makeContainer(2)
    element.className = 'my-list'
    const instance = smoothDnD(element, {})

    instance.dispose()
    expect(element.className).toContain('my-list')
  })

  it('unwraps the children it wrapped', () => {
    const element = makeContainer(2)
    const instance = smoothDnD(element, {})
    expect(element.querySelectorAll('.smooth-dnd-draggable-wrapper').length).toBe(2)

    instance.dispose()
    expect(element.querySelectorAll('.smooth-dnd-draggable-wrapper').length).toBe(0)
    expect(element.children.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------------------------
// Bug 4 — unregistering an unknown container splices out the last one (mediator.ts:669)
// ---------------------------------------------------------------------------------------------

describe('double dispose', () => {
  it('is a no-op the second time', () => {
    const element = makeContainer(2)
    const instance = smoothDnD(element, {})

    instance.dispose()
    expect(() => instance.dispose()).not.toThrow()
  })

  it('does not evict an unrelated container from the registry', () => {
    const first = makeContainer(2)
    const second = makeContainer(2)
    const firstInstance = smoothDnD(first, {})
    const secondInstance = mount(second)

    firstInstance.dispose()
    firstInstance.dispose() // would splice(-1, 1) and remove `second`

    // if `second` were evicted, its mousedown lookup would find no container and throw
    expect(errorsDuring(() => mouseDownOn(firstItem(second)))).toEqual([])

    secondInstance.dispose()
  })
})
