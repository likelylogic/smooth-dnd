import { afterEach, describe, expect, it } from 'vitest'
import {
  calculateTranslations,
  findDraggebleAtPos,
  getDragInsertionIndex,
  getShadowBeginEnd,
} from '../container'
import layoutManager from '../layoutManager'
import { defaultOptions } from '../defaults'
import type { ContainerProps, DraggableInfo, ElementX, LayoutManager } from '../interfaces'
import { cleanupDom, makeContainer, type LayoutOptions } from './helpers'

afterEach(cleanupDom)

/**
 * Build the `ContainerProps` bundle the pipeline functions close over, using the raw children as
 * draggables (smooth-dnd's wrapper divs are irrelevant to the geometry under test).
 */
function makeProps (count: number, options: LayoutOptions = {}): ContainerProps & { layout: LayoutManager } {
  const element = makeContainer(count, options)
  const layout = layoutManager(element as ElementX, options.orientation ?? 'vertical', 250)
  layout.invalidate()
  return {
    element: element as ElementX,
    draggables: Array.from(element.children) as ElementX[],
    getOptions: () => defaultOptions,
    layout,
  }
}

const draggableInfo = { invalidateShadow: false } as unknown as DraggableInfo

// ---------------------------------------------------------------------------------------------
// findDraggebleAtPos — the binary search R3/R9 will eventually replace
// ---------------------------------------------------------------------------------------------

describe('findDraggebleAtPos', () => {
  // three items occupying 0-50, 50-100, 100-150
  const setup = () => {
    const props = makeProps(3, { itemSize: 50, containerRect: { top: 0, bottom: 500 } })
    return { find: findDraggebleAtPos(props), draggables: props.draggables }
  }

  it('returns the index of the item containing the position', () => {
    const { find, draggables } = setup()

    expect(find(draggables, 10)).toBe(0)
    expect(find(draggables, 60)).toBe(1)
    expect(find(draggables, 120)).toBe(2)
  })

  it('returns the nearer slot when respecting midpoints', () => {
    const { find, draggables } = setup()

    expect(find(draggables, 10, true)).toBe(0)  // top half of item 0
    expect(find(draggables, 40, true)).toBe(1)  // bottom half of item 0 → insert after it
    expect(find(draggables, 60, true)).toBe(1)  // top half of item 1
    expect(find(draggables, 90, true)).toBe(2)  // bottom half of item 1
  })

  it('treats a position exactly on the midpoint as the later slot', () => {
    const { find, draggables } = setup()
    expect(find(draggables, 25, true)).toBe(1)
  })

  it('clamps before the first and after the last item', () => {
    const { find, draggables } = setup()

    expect(find(draggables, -500, true)).toBe(0)
    expect(find(draggables, 5000, true)).toBe(3) // === draggables.length
  })

  it('returns 0 for an empty container', () => {
    const props = makeProps(0)
    expect(findDraggebleAtPos(props)([], 100, true)).toBe(0)
  })

  it('works the same on the horizontal axis', () => {
    const props = makeProps(3, {
      orientation: 'horizontal',
      itemSize: 80,
      containerRect: { left: 0, right: 600, top: 0, bottom: 100 },
    })
    const find = findDraggebleAtPos(props)

    expect(find(props.draggables, 100)).toBe(1)
    // items are 80 wide, so item 0's midpoint is 40
    expect(find(props.draggables, 30, true)).toBe(0)
    expect(find(props.draggables, 50, true)).toBe(1)
  })
})

// ---------------------------------------------------------------------------------------------
// calculateTranslations — what R4's indicator mode will bypass
// ---------------------------------------------------------------------------------------------

describe('calculateTranslations', () => {
  it('opens a gap below the insertion point when nothing was removed', () => {
    const props = makeProps(3, { itemSize: 50 })
    const translate = calculateTranslations(props)

    translate({ dragResult: { addedIndex: 1, removedIndex: null, elementSize: 50 } as any })

    expect(props.layout.getTranslation(props.draggables[0])).toBe(0)
    expect(props.layout.getTranslation(props.draggables[1])).toBe(50)
    expect(props.layout.getTranslation(props.draggables[2])).toBe(50)
  })

  it('closes the gap above a removed item', () => {
    const props = makeProps(3, { itemSize: 50 })
    const translate = calculateTranslations(props)

    translate({ dragResult: { addedIndex: null, removedIndex: 0, elementSize: 50 } as any })

    // index 0 is the removed item and is left alone
    expect(props.layout.getTranslation(props.draggables[1])).toBe(-50)
    expect(props.layout.getTranslation(props.draggables[2])).toBe(-50)
  })

  it('cancels out for items between a removal and a re-insertion', () => {
    const props = makeProps(4, { itemSize: 50 })
    const translate = calculateTranslations(props)

    // drag item 0 down to slot 2
    translate({ dragResult: { addedIndex: 2, removedIndex: 0, elementSize: 50 } as any })

    expect(props.layout.getTranslation(props.draggables[1])).toBe(-50) // shifts up into the gap
    expect(props.layout.getTranslation(props.draggables[2])).toBe(0)   // -50 then +50
    expect(props.layout.getTranslation(props.draggables[3])).toBe(0)
  })

  it('reports only when something changed', () => {
    const props = makeProps(3, { itemSize: 50 })
    const translate = calculateTranslations(props)
    const result = { dragResult: { addedIndex: 1, removedIndex: null, elementSize: 50 } as any }

    expect(translate(result)).toEqual({ removedIndex: null })
    expect(translate(result)).toBeUndefined()
  })

  it('parts the list at gapIndex when one is given, rather than at addedIndex', () => {
    // An `into` target has no insertion index but still holds the siblings apart, so the layout
    // does not jump every time the pointer crosses the boundary between "between" and "onto".
    const props = makeProps(4, { itemSize: 50 })
    const translate = calculateTranslations(props)

    translate({ dragResult: { addedIndex: null, gapIndex: 2, removedIndex: null, elementSize: 50 } as any })

    expect(props.layout.getTranslation(props.draggables[1])).toBe(0)
    expect(props.layout.getTranslation(props.draggables[2])).toBe(50)
    expect(props.layout.getTranslation(props.draggables[3])).toBe(50)
  })

  it('closes the gap when neither index is given', () => {
    const props = makeProps(4, { itemSize: 50 })
    const translate = calculateTranslations(props)

    translate({ dragResult: { addedIndex: 2, removedIndex: null, elementSize: 50 } as any })
    translate({ dragResult: { addedIndex: null, removedIndex: null, elementSize: 50 } as any })

    expect(props.layout.getTranslation(props.draggables[2])).toBe(0)
    expect(props.layout.getTranslation(props.draggables[3])).toBe(0)
  })

  it('never translates the removed item itself', () => {
    const props = makeProps(3, { itemSize: 50 })
    const translate = calculateTranslations(props)

    translate({ dragResult: { addedIndex: 2, removedIndex: 1, elementSize: 50 } as any })
    expect(props.draggables[1].style.transform).toBe('')
  })
})

// ---------------------------------------------------------------------------------------------
// getShadowBeginEnd — the anti-flicker hysteresis, and the source of the dropArea bug
// ---------------------------------------------------------------------------------------------

describe('getShadowBeginEnd', () => {
  function shadowFor (
    props: ContainerProps,
    dragResult: Partial<Record<string, unknown>>,
  ): any {
    const compute = getShadowBeginEnd(props)
    return compute({
      draggableInfo,
      dragResult: {
        addedIndex: null,
        removedIndex: null,
        elementSize: 50,
        pos: 0,
        shadowBeginEnd: null,
        ...dragResult,
      } as any,
    })
  }

  it('clears the shadow when the pointer is outside the container', () => {
    const props = makeProps(3, { itemSize: 50 })
    expect(shadowFor(props, { pos: null, addedIndex: 1 })).toEqual({ shadowBeginEnd: null })
  })

  it('sits the shadow on the boundary when neighbours match the dragged size', () => {
    const props = makeProps(3, { itemSize: 50 })
    const result = shadowFor(props, { addedIndex: 1, elementSize: 50, pos: 60 })!

    expect(result.shadowBeginEnd.begin).toBe(50)
    expect(result.shadowBeginEnd.end).toBe(50)
  })

  it('widens the shadow band when neighbours are larger than the dragged item', () => {
    // This band is the hysteresis that stops the insertion point flickering between slots.
    const props = makeProps(3, { itemSize: 50 })
    const result = shadowFor(props, { addedIndex: 1, elementSize: 30, pos: 60 })!

    // threshold = (50 - 30) / 2 = 10 either side of the boundary at 50
    expect(result.shadowBeginEnd.begin).toBe(40)
    expect(result.shadowBeginEnd.end).toBe(60)
  })

  it('reports an open-ended shadow before the first item', () => {
    const props = makeProps(3, { itemSize: 50, containerRect: { top: 0, bottom: 500 } })
    const result = shadowFor(props, { addedIndex: 0, pos: 5 })!

    expect(result.shadowBeginEnd.begin).toBe(Number.MIN_SAFE_INTEGER)
    expect(result.shadowBeginEnd.dropArea.begin).toBe(0) // container begin
  })

  it('skips over the removed item when picking neighbours', () => {
    const props = makeProps(4, { itemSize: 50 })
    // inserting at 1 while item 1 is the one being dragged: the "after" neighbour is item 2
    const result = shadowFor(props, { addedIndex: 1, removedIndex: 1, elementSize: 30, pos: 60 })!

    // after-neighbour is item 2 (100-150), so end = 100 + 10
    expect(result.shadowBeginEnd.end).toBe(110)
  })

  it('recomputes only when the added index changes', () => {
    const props = makeProps(3, { itemSize: 50 })
    const compute = getShadowBeginEnd(props)
    const args = {
      draggableInfo,
      dragResult: { addedIndex: 1, removedIndex: null, elementSize: 50, pos: 60, shadowBeginEnd: null } as any,
    }

    expect(compute(args)).not.toBeNull()
    expect(compute(args)).toBeNull()
  })

  it('recomputes regardless when invalidateShadow is set', () => {
    const props = makeProps(3, { itemSize: 50 })
    const compute = getShadowBeginEnd(props)
    const args = {
      draggableInfo: { invalidateShadow: true } as unknown as DraggableInfo,
      dragResult: { addedIndex: 1, removedIndex: null, elementSize: 50, pos: 60, shadowBeginEnd: null } as any,
    }

    expect(compute(args)).not.toBeNull()
    expect(compute(args)).not.toBeNull()
  })

  it('runs the drop area to the container end when inserting after the last item', () => {
    const props = makeProps(3, { itemSize: 50, containerRect: { top: 0, bottom: 500 } })
    const result = shadowFor(props, { addedIndex: 3, pos: 160 })!

    expect(result.shadowBeginEnd.dropArea.begin).toBe(150) // end of the last item
    expect(result.shadowBeginEnd.dropArea.end).toBe(500)   // end of the container
  })

  it('reports the drop area in the same coordinate space at both ends', () => {
    // Every branch has to agree, or a consumer rendering an indicator from these bounds gets a
    // rect that is right in the middle of a list and wrong at the end of it.
    const props = makeProps(3, { itemSize: 50, containerRect: { top: 0, bottom: 500 } })

    const middle = shadowFor(props, { addedIndex: 1, pos: 60 })!.shadowBeginEnd.dropArea
    const past = shadowFor(props, { addedIndex: 3, pos: 160 })!.shadowBeginEnd.dropArea

    // both are viewport coordinates, so both are within the container's own span
    for (const area of [middle, past]) {
      expect(Number.isFinite(area.begin)).toBe(true)
      expect(Number.isFinite(area.end)).toBe(true)
      expect(area.end).toBeGreaterThanOrEqual(area.begin)
      expect(area.begin).toBeGreaterThanOrEqual(0)
      expect(area.end).toBeLessThanOrEqual(500)
    }
  })
})

// ---------------------------------------------------------------------------------------------
// getDragInsertionIndex
// ---------------------------------------------------------------------------------------------

describe('getDragInsertionIndex', () => {
  it('picks the nearest slot when no shadow exists yet', () => {
    const props = makeProps(3, { itemSize: 50 })
    const getIndex = getDragInsertionIndex(props)

    expect(getIndex({ dragResult: { shadowBeginEnd: null, pos: 10 } as any })).toBe(0)
    expect(getIndex({ dragResult: { shadowBeginEnd: null, pos: 90 } as any })).toBe(2)
  })

  it('returns null while the pointer stays inside the current shadow band', () => {
    const props = makeProps(3, { itemSize: 50 })
    const getIndex = getDragInsertionIndex(props)

    const shadowBeginEnd = { begin: 40, end: 60, beginAdjustment: 0 } as any
    expect(getIndex({ dragResult: { shadowBeginEnd, pos: 50 } as any })).toBeNull()
  })

  it('moves to the previous slot when the pointer leaves the band upwards', () => {
    const props = makeProps(3, { itemSize: 50 })
    const getIndex = getDragInsertionIndex(props)

    const shadowBeginEnd = { begin: 90, end: 110, beginAdjustment: 0 } as any
    expect(getIndex({ dragResult: { shadowBeginEnd, pos: 20 } as any })).toBe(0)
  })

  it('moves to the next slot when the pointer leaves the band downwards', () => {
    const props = makeProps(3, { itemSize: 50 })
    const getIndex = getDragInsertionIndex(props)

    const shadowBeginEnd = { begin: 40, end: 60, beginAdjustment: 0 } as any
    expect(getIndex({ dragResult: { shadowBeginEnd, pos: 120 } as any })).toBe(3)
  })
})
