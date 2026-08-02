# Known issues

Findings from a full read of the engine, plus what the characterisation suite turned up. Line
references are to the state of the code when each was written; they may drift.

Anything marked **pinned** has a test asserting the *correct* behaviour with `it.fails`. Those tests
are expected to fail today and will announce themselves when the bug is fixed.

---

## Fixed

Recorded because the reasoning is easy to lose, and because several were latent for years.

| Issue | Detail |
|---|---|
| `containerBoxChanged` overwritten | The flag was assigned rather than accumulated while iterating containers, so a later container could clear a change reported by an earlier one. The re-measure was skipped and every container spent the rest of the drag on stale rectangles. Presented as drops landing one slot out in multi-container layouts. |
| `mousedown` threw on an orphaned wrapper | The container lookup was unguarded. Reachable via a disposed-but-still-mounted container, or hand-written markup carrying the wrapper class. Once thrown it threw on every subsequent `mousedown` in that subtree. |
| `dispose()` was incomplete | Left behind the `window` resize listener and pending invalidate timer — leaking a closure per container ever created — plus the `containerInstance` expando and the container/orientation classes. The classes are what made the `mousedown` crash reachable. |
| Double `dispose()` evicted a live container | `splice(indexOf(x), 1)` with `indexOf === -1` becomes `splice(-1, 1)`, removing the *last registered* container instead. |
| Drop teardown had no `try`/`finally` | A consumer `onDrop` that threw skipped the state reset, leaving `dropAnimationStarted` stuck true. `cancelDrag()` guards on that flag, so **escape-to-cancel silently stopped working for the rest of the session**. A throwing container also prevented every later container from running `handleDrop`, which is what restores their draggables' translations and visibility. |
| Ghost removal could throw | `getGhostParent().removeChild(ghost)` recomputes the parent at teardown and falls back to `document.body`, so it threw if the source item was unmounted mid-drag. Now `ghost.remove()`. |
| Ghost was clipped or offset | The ghost is `position: fixed` in viewport coordinates but was appended *inside* its container. Any ancestor with a `transform` becomes its containing block — silently reinterpreting those coordinates and clipping it if that ancestor also has `overflow: hidden`. Both are routine: the library puts `transform` on wrappers during a drag, and the stylesheet gives every vertical wrapper `overflow: hidden`. Now parented to `document.body`, with `getGhostParent` as the escape hatch. |
| Vanilla cross-container drops were broken | The dragged node was commented out of the parameters passed to the drop handler, so `domDropHandler` had nothing to insert when a container received an item it did not own. The item was removed from the source, never added to the target, and it threw. Framework adapters replace the handler, which is why this went unnoticed. |

---

## Open

### Geometry

**Scale is applied twice** — `layoutManager.ts` `getBeginEnd`. `getSize()` returns
`getBoundingClientRect()` deltas, which already include any ancestor `transform: scale()`, and the
result is multiplied by scale again. The same happens on the `OffsetSize` path, where the size was
also derived from a bounding rect. Invisible at scale 1, which is why it survived; breaks zoomable
canvases and content inside scaled modals. **Pinned.**

**Scale is never refreshed during a drag** — it is computed only in `invalidate()`, and the drag
loop only calls `invalidateRects()`. Geometry also throws outright before the first invalidation and
returns `NaN` after `invalidateRects()` alone, currently masked by an init timer and the
`invalidate()` in `onMouseDown`.

**`lastVisibleRect` is one measurement stale** — the guard checks whether the *new* rect is visible
before stashing the old one, so the value is not updated at the moment a container collapses, which
is exactly when it is needed. It exists to animate a dropped ghost back to where a now-hidden
container used to be. **Pinned.**

**`dropArea.end` is `NaN` past the last item** — `getShadowBeginEnd` reads `.end` and `.begin` off
`getContainerRectangles().rect`, which is a raw DOM rect with no such keys, so both are `undefined`.
Separately, the other branches assign viewport *coordinates* while this one computes a *length*.
Latent today because only `dropArea.begin` is ever read — but this field is wanted as public API for
drop indicators, so it has to be fixed first. **Pinned.**

### Lifecycle and events

**`onDragStart` fires before the ghost is in the DOM.** The order is: payload → ghost created
(detached) → `onDragStart` → ghost appended. So there is no callback from which a consumer can
legitimately modify the ghost, which forces a `setTimeout` plus a global selector.

**Callback ordering is surprising.** `onDragEnd` fires *before* `onDrop`. `onDragStart` and
`onDragEnd` fire on *every* registered container, not just relevant ones. A container registered
mid-drag never receives `onDragStart` but does receive `onDragEnd`. With `removeOnDropOut`,
uninvolved containers receive `onDrop` with both indices `null`.

**The nested self-drop guard is dead code.** It compares the result of a wrapper lookup against a
*container* element. A wrapper is always a child of a container and never equal to one, so the
comparison is never true. The intent — a container nested inside the dragged item must not accept
it — is unimplemented, and `utils.hasParent` (currently uncalled) is what it needs.

**No second grab for up to `animationDuration`.** `isDragging` only clears at the end of the drop
animation, so an item cannot be picked up for up to 250 ms after dropping the previous one.

### Input

**Mouse and touch, not Pointer Events.** Three event families are hard-coded, and the pointer
extractor always takes `touches[0]` — the *first* touch, not the one that started the drag. A second
finger landing mid-drag hijacks the position. There is no pointer capture, so a drag leaving the
document strands.

**Listener options are passed as `forEach`'s `thisArg`** in the drag-start condition handlers, so
those listeners register with defaults — passive for `touchmove` in Chrome. Harmless today because
nothing calls `preventDefault` there, but a trap. Correctly-written versions exist elsewhere in the
same file.

**`debounce`'s `immediate` mode is broken** — the timer is cleared but never nulled, so the
immediate branch fires once and never again. Only used with `immediate: false` today.

### Compatibility

**`className` string manipulation breaks on SVG** — `className` is an `SVGAnimatedString` there, so
`.split` throws. SVG draggables and containers are impossible. `addClass` also reorders the
consumer's classes.

**Hit testing uses `document.elementFromPoint`**, which returns the host for shadow DOM, so web
components are unsupported. It also creates two disagreeing notions of "inside the container": the
hit test, and a container rect that is inflated by `scrollWidth` when content visibly overflows.

**No accessibility.** No keyboard dragging, focus management, ARIA, live regions or
`prefers-reduced-motion`. Hard to retrofit: the engine is driven by coordinates, and keyboard
dragging needs it drivable by index.

### Performance

Not measured — reasoned from the code paths.

- `document.elementFromPoint` runs once per relevant container per frame
- a watcher re-measures every 50 ms, and the visible-rect walk calls `getComputedStyle` twice per
  ancestor
- the auto-scroller repeats that ancestor walk per frame per scrollable
- the drag cursor is applied via an injected `body * { cursor: … !important }` rule, added and
  removed on every drag

Modern libraries do this measurement once at drag start.

### Auto-scroll

**The window never scrolls.** Scrollable ancestors are collected by computed `overflow`, and the
document element is normally `visible`, so it is never collected — there is no page auto-scroll near
the viewport edge unless the app made `html` or `body` scrollable. The `window` branch of the
scroll-value helper is unreachable.

**Arbitration is per-element, not per-axis.** The topmost scrollable ancestor under the pointer wins
and all others are stopped — without checking whether it can actually scroll on the axis being
asked for. An inner element that only overflows vertically will absorb horizontal scroll intent and
silently do nothing, while the outer element that could have scrolled has already been stopped.

### Types

`strict` is on and `tsc` passes, but assertions paper over the gaps: `null!` and `undefined!` appear
around thirty times in `mediator.ts` alone. `DragResult.pos` is typed `number` and is routinely
`null`; `LayoutManager.getPosition` is typed to return a `Rect` and returns a number; `getAxisValue`
is typed to return an `Axis` and returns a number; `getContainerRectangles()` returns three `any`s.

### Adapters

**The React `Container` drops `className`.** It renders a bare `div` and ignores the prop; the
`render` prop is the only way to style the root. The Vue adapter passes attributes through, so the
two behave differently. The React `Draggable`'s `render` path also *replaces* the rendered element's
`className` rather than merging it.

---

## Dead code

`isInVisibleRect`, `getBeginEndOfDOMRect`, `getTranslation`, `setScrollValue`, `getDistanceToParent`,
`hasParent`, the constants `defaultGrabHandleClass` and `isDraggableDetached`, and
`extraSizeForInsertion` (written, never read). `isInVisibleRect` is notable — a rect-based hit test
presumably superseded by `elementFromPoint` and left behind. `wrapChildren`'s non-element branch is
unreachable, since `element.children` is an `HTMLCollection`.
