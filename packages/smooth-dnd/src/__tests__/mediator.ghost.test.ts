import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import smoothDnD from '../container'
import { cleanupDom, ghostElement, layoutContainer, makeContainer, startDrag } from './helpers'

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
  // a failed assertion can abandon a drag mid-flight; the mediator's state is module-level, so
  // leaving it set would make every later test look broken for the wrong reason
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

/**
 * Build an outer container whose second item hosts an inner container — the shape the nested-group
 * demo uses, and the one where the ghost used to be clipped.
 */
function makeNested () {
  const outer = document.createElement('div')
  for (let i = 0; i < 3; i++) {
    outer.appendChild(document.createElement('div'))
  }
  document.body.appendChild(outer)

  const host = outer.children[1] as HTMLElement
  const inner = document.createElement('div')
  for (let i = 0; i < 3; i++) {
    inner.appendChild(document.createElement('div'))
  }
  host.appendChild(inner)

  layoutContainer(outer, { itemSize: 120 })
  layoutContainer(inner, { itemSize: 40 })
  return { outer, inner }
}

describe('ghost parent', () => {
  it('appends the ghost to the body, not the container', async () => {
    // The ghost is position:fixed with viewport coordinates. Parenting it inside the container
    // means any transformed ancestor becomes its containing block — which silently reinterprets
    // those coordinates and, if that ancestor also clips, hides the ghost entirely.
    const element = makeContainer(3)
    mount(element)

    const drag = await startDrag(element, 0)
    const ghost = ghostElement()!

    expect(ghost).not.toBeNull()
    expect(ghost.parentElement).toBe(document.body)
    expect(element.contains(ghost)).toBe(false)

    await drag.drop()
  })

  it('keeps a nested container’s ghost out of the transformed wrapper chain', async () => {
    const { outer, inner } = makeNested()
    mount(outer)
    mount(inner)
    layoutContainer(outer, { itemSize: 120 })
    layoutContainer(inner, { itemSize: 40 })

    const drag = await startDrag(inner, 0, () => inner)
    const ghost = ghostElement()!

    expect(ghost.parentElement).toBe(document.body)
    // the wrappers in this chain get `transform` during a drag and carry `overflow: hidden`
    expect(outer.contains(ghost)).toBe(false)
    expect(inner.contains(ghost)).toBe(false)

    await drag.drop()
  })

  it('honours an explicit getGhostParent', async () => {
    const host = document.createElement('div')
    host.id = 'ghost-host'
    document.body.appendChild(host)

    const element = makeContainer(3)
    mount(element, { getGhostParent: () => host })

    const drag = await startDrag(element, 0)
    expect(ghostElement()!.parentElement).toBe(host)

    await drag.drop()
    expect(ghostElement()).toBeNull()
  })

  it('removes the ghost from the body when the drag ends', async () => {
    const element = makeContainer(3)
    mount(element)

    const drag = await startDrag(element, 0)
    await drag.moveTo(0, 120)
    await drag.drop()

    expect(ghostElement()).toBeNull()
    expect(document.body.querySelector('.smooth-dnd-ghost')).toBeNull()
  })

  it('leaves the container’s own children untouched by ghost creation', async () => {
    const element = makeContainer(3)
    mount(element)
    const before = element.children.length

    const drag = await startDrag(element, 0)
    expect(element.children.length).toBe(before)

    await drag.drop()
  })
})
