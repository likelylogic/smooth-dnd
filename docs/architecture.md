# Architecture

How the engine works, and where it is going. Written for someone about to change it.

---

## The shape of a drag

Any drag-and-drop system does five things:

1. **Sense** — pointer input becomes an activation and a position
2. **Track** — what is being dragged, and what payload it carries
3. **Resolve** — given a position, what is the drop target?
4. **Feed back** — show the user what would happen
5. **Commit** — report the result

smooth-dnd is a **sortable**: it assumes the answer to (3) is always *"the gap between two
siblings"*, and the answer to (4) is always *"translate the siblings apart"*. Those two are computed
in the same pipeline pass — you cannot obtain the insertion index without also opening the gap.

That assumption is why the library is small and why the animation feels good. It is also the
constraint behind most of the open work in [`known-issues.md`](./known-issues.md) and the issue
tracker: drop-onto-item, drop indicators and non-list layouts all want (3) and (4) separated and
made pluggable.

---

## Module map

| File | Responsibility |
|---|---|
| `mediator.ts` | Module-level singleton. Owns global drag state, the document event listeners, the ghost, and the drop lifecycle. Everything starts here. |
| `container.ts` | Per-container behaviour, and the public `smoothDnD()` entry point. Contains the drag pipeline. |
| `layoutManager.ts` | All geometry, behind an orientation-mapped property model. |
| `scroller.ts` | Auto-scroll during a drag. |
| `dropHandlers.ts` | How a completed drop is applied — DOM mutation, or handed to a framework. |
| `utils.ts` | Rect maths, DOM traversal, scroll detection. |
| `styles.ts` | The injected stylesheet. |

### `mediator.ts` — the singleton

One registry of containers, one `isDragging`, one `draggableInfo`. There is no per-instance
isolation: every container on the page shares this state, and `smoothDnD.wrapChild` /
`smoothDnD.dropHandler` are global configuration set at import time by whichever adapter loads
first.

The consequences are worth knowing before you design around it:

- the React and Vue adapters cannot coexist in one bundle
- two copies of the package produce two mediators, both handling the same `mousedown`
- you cannot have two areas of a page with genuinely different rules

### `container.ts` — the pipeline

The best part of the codebase. `compose()` builds a chain of small functions, each taking
`{ draggableInfo, dragResult }` and returning a partial `dragResult` which is merged into a shared
object. Each drag frame runs the chain once.

```
getRemovedItem           which index left this container, if any
setRemovedItemVisibilty  hide it
getPosition              is the pointer over this container? (document.elementFromPoint)
getElementSize           how big is the dragged item on the layout axis
handleTargetContainer    claim or release the drop target
invalidateShadowBeginEnd…
getNextAddedIndex        where would it land            ← target resolution
resetShadowAdjustment
handleInsertionSizeChange  grow the container if needed
calculateTranslations    move the siblings apart        ← feedback
getShadowBeginEnd        compute the hysteresis band
drawDropPlaceholder
handleFirstInsertShadow…
fireDragEnterLeaveEvents
fireOnDropReady
```

`getDragHandler()` already selects between two compositions — the full sortable chain, and a
shorter one for `behaviour: 'drop-zone'` that omits sorting entirely. **That branch is the seam**:
new feedback modes are new compositions, not new conditionals inside the existing functions.

### The two functions where the "smooth" lives

- **`getShadowBeginEnd`** computes a band around the insertion point. When the dragged item is
  smaller than its neighbours the band is widened by half the difference either side. This
  hysteresis is what stops the insertion index flickering between slots as the pointer sits near a
  boundary. It is subtle, it is load-bearing, and it should survive any refactor.
- **`calculateTranslations`** displaces every sibling by `±elementSize` along the layout axis.
  Simple, and the reason the engine is one-dimensional.

### `layoutManager.ts` — one axis, by construction

Every geometric concept is mapped through a horizontal *or* vertical property table: `size` →
`offsetWidth | offsetHeight`, `begin` → `left | top`. There is no second axis in the model.

Positions come from `offsetTop` / `offsetLeft` plus a recorded translation, not from
`getBoundingClientRect()` per item. That is a deliberate performance choice — it avoids forced
layout on every frame — but it means the engine ignores transforms the consumer applies to
draggables, and assumes the container is the offset parent (`styles.ts` gives it
`position: relative`).

`invalidate()` recomputes rectangles *and* scale; `invalidateRects()` recomputes only rectangles.
The drag loop only ever calls the latter.

---

## Testing

`packages/smooth-dnd/src/__tests__/` holds a characterisation suite. jsdom implements no layout
engine, so `helpers.ts` supplies a synthetic one — without it every rect and `offset*` property
reads 0.

- **`layoutContainer()`** applies a synthetic layout to a container and its children
- **`startDrag()`** drives a real drag through the actual event path, stubbing
  `document.elementFromPoint` (jsdom always returns null, and the engine relies on it to pick the
  container under the pointer)
- **`settleEngine()`** returns the module-level singleton to a clean slate between tests. Needed
  because a drag abandoned by a failed assertion leaks into the next test, and `cancelDrag()` alone
  is not enough — it *starts* a drop animation, and while one is pending `dropAnimationStarted`
  makes further cancels a no-op.

Some internals are `export`ed purely for testing. They are not part of the published API:
`index.ts` controls what ships and does not re-export from those modules.

**`it.fails` marks known bugs deliberately.** Those tests assert the *correct* behaviour and are
expected to fail; they will start failing loudly — i.e. passing — when the bug is fixed. See
[`known-issues.md`](./known-issues.md).

---

## Direction

The engine stays one-dimensional for now. The work in flight introduces the seam anyway, so that
two-dimensional layouts later are a new strategy rather than a rewrite:

```
resolve:  (pointer, activeRect, candidates) => { kind: 'before' | 'after' | 'into', index, bounds }
feedback: (items, activeIndex, target, rects) => transforms   // returning nothing = no movement
```

With that in place:

- **drop onto an item** is a resolver that can return `kind: 'into'`
- **drop indicator** is the null feedback strategy, plus exposing `bounds`
- **wrapping and grid layouts** are a rect-based resolver and a layout-diffing strategy
- **free placement** (no sorting at all) is the null strategy with zone-kind targets

See the issue tracker for what is planned and in what order.
