/**
 * Helpers shared by the Vue and React demos.
 *
 * These were duplicated verbatim in both demos before the monorepo; they are
 * plain data functions with no framework dependency, so they live here now.
 */

export interface DragResult {
  removedIndex: number | null
  addedIndex: number | null
  payload?: any
}

/**
 * Apply a smooth-dnd drop result to an array, returning a new array.
 *
 * This is the canonical pattern for adapter-managed containers: smooth-dnd
 * reports what moved, and you update your own model rather than letting the
 * library touch the DOM.
 */
export function applyDrag<T> (arr: T[], dragResult: DragResult): T[] {
  const { removedIndex, addedIndex, payload } = dragResult

  if (removedIndex === null && addedIndex === null) {
    return arr
  }

  const result = [...arr]
  let itemToAdd: T = payload

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0]
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd)
  }

  return result
}

/**
 * Build `count` items using `creator`, which receives the index.
 */
export function generateItems<T> (count: number, creator: (index: number) => T): T[] {
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    result.push(creator(i))
  }
  return result
}
