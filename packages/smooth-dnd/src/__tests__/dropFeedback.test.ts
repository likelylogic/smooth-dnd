import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ContainerOptions, DropResult } from '../exportTypes'
import { cleanupDom, makeContainer, mountContainer, settleEngine, startDrag } from './helpers'

let created: { dispose: () => void }[] = []

function mount (element: HTMLElement, options: Record<string, unknown> = {}, layout: Record<string, unknown> = {}) {
  const instance = mountContainer(element, options, layout as any)
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

const CARDS = { top: 0, bottom: 200, left: 0, right: 200 }
const BOARD = { top: 300, bottom: 500, left: 0, right: 200 }

/**
 * The board scenario `dropFeedback`-as-a-function exists for: a columns container that sorts its
 * own columns with a gap, but shows an indicator when a card from another group is dragged across
 * it — because a card dropped between columns becomes a new column, and full columns sliding aside
 * for a card would read as nonsense.
 */
function mountBoard (ready: DropResult[], dropped: DropResult[]) {
  const cards = makeContainer(3, { containerRect: CARDS })
  const board = makeContainer(2, { containerRect: BOARD })

  mount(cards, { groupName: 'cards', getChildPayload: (i: number) => ({ card: i }) }, { containerRect: CARDS })
  mount(board, {
    groupName: 'columns',
    shouldAcceptDrop: (source: ContainerOptions) => source.groupName === 'columns' || source.groupName === 'cards',
    dropFeedback: (source: ContainerOptions) => source.groupName === 'cards' ? 'indicator' : 'gap',
    getChildPayload: (i: number) => ({ column: i }),
    onDropReady: (r: DropResult) => ready.push(r),
    onDrop: (r: DropResult) => dropped.push(r),
  }, { containerRect: BOARD })

  return { cards, board }
}

describe('dropFeedback as a function', () => {
  it('shows an indicator for a foreign payload, without moving the columns', async () => {
    const ready: DropResult[] = []
    const dropped: DropResult[] = []
    const { cards, board } = mountBoard(ready, dropped)

    let hit: Element = cards
    const drag = await startDrag(cards, 0, () => hit)
    hit = board
    await drag.moveTo(0, 380)
    await drag.drop()

    // the columns stayed put...
    const transforms = Array.from(board.children).map(child => (child as HTMLElement).style.transform)
    expect(transforms.every(t => t === '')).toBe(true)
    // ...an indicator was reported...
    expect(ready.some(r => r.dropIndicator != null)).toBe(true)
    // ...and the drop landed with a column insertion index for the app to build a new column at
    const landed = dropped.find(r => r.addedIndex !== null)!
    expect(landed).toBeDefined()
    expect(landed.payload).toEqual({ card: 0 })
  })

  it('still sorts its own kind with a gap', async () => {
    const ready: DropResult[] = []
    const dropped: DropResult[] = []
    const { board } = mountBoard(ready, dropped)

    const drag = await startDrag(board, 0)
    await drag.moveTo(0, 470)
    await drag.drop()

    // reordering columns is an ordinary gap-mode sort: siblings translate, no indicator
    expect(ready.every(r => r.dropIndicator == null)).toBe(true)
    const landed = dropped.find(r => r.removedIndex !== null && r.addedIndex !== null)!
    expect(landed).toBeDefined()
  })

  it('resolves the function once per drag, from the source and payload', async () => {
    const calls: any[] = []
    const source = makeContainer(2, { containerRect: CARDS })
    const target = makeContainer(2, { containerRect: BOARD })

    mount(source, { groupName: 'a', getChildPayload: (i: number) => ({ id: i }) }, { containerRect: CARDS })
    mount(target, {
      groupName: 'a',
      dropFeedback: (sourceOptions: ContainerOptions, payload: any) => {
        calls.push([sourceOptions.groupName, payload])
        return 'none'
      },
    }, { containerRect: BOARD })

    let hit: Element = source
    const drag = await startDrag(source, 0, () => hit)
    hit = target
    await drag.moveTo(0, 350)
    await drag.moveTo(0, 420)
    await drag.moveTo(0, 470)
    await drag.drop()

    // one evaluation per container per drag, not one per frame
    expect(calls.length).toBe(1)
    expect(calls[0][0]).toBe('a')
    expect(calls[0][1]).toEqual({ id: 0 })
  })
})
