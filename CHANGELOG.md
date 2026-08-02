# Changelog

All three packages — `@likelylogic/smooth-dnd`, `@likelylogic/vue-smooth-dnd` and
`@likelylogic/react-smooth-dnd` — version together. The adapters are thin and track the engine, so
independent versions would only obscure which combination was tested.

**Pre-1.0.** Minor versions may contain breaking changes; patches will not. `1.0.0` is reserved for
when the roadmap's non-deferred work is complete — see the roadmap issue.

Nothing has been published yet, so no released version is being changed retroactively.

---

## 0.17.0

### Added

- **`dropOnItems` now works with any `dropFeedback`, and combines naturally with `gap`** — which is
  the pairing that matters:

  - a target *between* items opens a gap, as always. Something has to make room.
  - a target *into* an item does not. Nothing is making room, so no gap opens, and the item's bounds
    are reported on `onDropReady` instead so the application can highlight it.

  No new option: this is simply what `dropFeedback: 'gap'` plus `dropOnItems: true` now means. An
  `into` target reports bounds in *every* feedback mode, because no mode can express one otherwise.

### Fixed

- **Drop targets are resolved against where the items rest**, never where an in-flight animation has
  put them. This is what makes the above possible, and the earlier restriction unnecessary.

  Reading the live layout let the feedback feed back into the decision that produced it: resolving
  an `into` closes the gap, which shifts the items, which changes what is under the pointer, which
  reopens it. The reported index would jump backwards mid-drag — `at5 → into4 → at4 → at5`.

  The resting frame matches what is on screen minus any insertion gap, which differs by mode:
  `gap` closes the slot the dragged item left, the others leave it visibly open. The dragged item
  itself is excluded, since it is not in that layout at all — left in place it would occupy exactly
  the span of the item shifting up into it, and the insertion search is a binary search that
  requires ordered, non-overlapping bounds.

  Insertion indices in that frame come from the midpoint test rather than the live path's
  directional ±1 nudge, which overshoots by a whole slot when every item edge is a boundary.

  Classic sorting — `dropOnItems` off — is untouched and still resolves against the live layout.

---

## 0.16.4

### Fixed

- **The drop indicator was drawn in the middle of the slot the dragged item vacated**, rather than
  on a boundary between items.

  The neighbour lookup that produces the drop area deliberately skips the item being dragged. That
  is right for `gap` feedback, where the area describes the space being opened — but under
  `indicator` and `none` nothing opens, so an insertion point either side of the vacated slot
  reported the whole hole, a full item tall. A line drawn down the middle of that lands in the
  middle of an empty space.

  In those modes the drop area is now a zero-length **boundary** at the insertion point, which is
  what an indicator actually needs. The same collapse fixes appending, where the area otherwise ran
  from the last item to the container's end — most of the page, in a short list.

- **The indicator could only reach one edge of the vacated slot.** Dragging down past it reported
  its top edge and never its bottom; dragging up, the reverse. The same neighbour lookup is used for
  the hysteresis band, and skipping the dragged item stretched that band across two slots — so it
  swallowed the vacated slot whole and whichever edge you approached from was the only one
  reachable. Under the stationary modes the dragged item has not moved, its slot is still there, and
  both of its edges are legitimate insertion boundaries.

---

## 0.16.2

### Fixed

- **The drop indicator flickered between slots.** The insertion point re-resolved on every frame,
  bouncing back and forth rather than settling.

  The hysteresis band is derived from the gap between the neighbours either side of the insertion
  point. Under `gap` feedback the siblings slide apart, so that gap is a real one the width of the
  dragged item and the band is comfortably wide. Nothing moves under `indicator` or `none`, which
  leaves the neighbours touching and collapses the band to zero width — so the pointer could never
  be *inside* it and the index was recomputed continuously.

  The band is now widened to the neighbours' midpoints in those modes: one item wide, centred on
  the boundary, which is the natural hysteresis for a midpoint-based insertion and cannot
  oscillate. `gap` feedback is untouched.

---

## 0.16.1

### Fixed

- **The Vue adapter silently dropped `containerId`, `dropFeedback` and `dropOnItems`.** It forwards a
  fixed list of props to the engine, and the three added in 0.13.0–0.16.0 were never added to it —
  so Vue turned them into fallthrough attributes on the root element and the options never arrived.
  Nothing failed; the features simply did nothing. There is now a test asserting the adapter's
  declared props and the engine's options agree, so the next one cannot go missing quietly.

### Internal

- Two demo pages, `drop-indicator` and `tree`, covering the features added in 0.15.0 and 0.16.0.
  Both render their own feedback from the reported bounds rather than relying on anything built in,
  which is the intended usage and a check that the API is sufficient on its own.

---

## 0.16.0

### Added

- **`dropOnItems` container option** — resolve the middle half of an item to a drop *onto* it, which
  is what trees and folders need. The quarter at either end still resolves to an insertion point, so
  reordering keeps working.

  `onDropReady` and `onDropComplete` both carry the resolved target:

  ```ts
  { kind: 'at' | 'into', index }
  ```

  `at` means inserted at `index`; `into` means dropped onto the item at `index`. In indicator mode
  the indicator outlines the whole target item rather than a gap between two.

  **Requires `dropFeedback` to be `indicator` or `none`, and is ignored under `gap`.** Not an
  arbitrary restriction: an open gap has already displaced the items to make room for an insertion,
  so there is no longer an item under the pointer to resolve against, and the two kinds of feedback
  would oscillate against each other.

  An `into` drop reports `action: 'move'` even within one container — landing inside another item is
  not a change of position among siblings, so calling it a reorder would mislead.

### Fixed

- **A container nested inside the dragged item would accept it**, making the item its own
  descendant. The guard existed but compared the nearest ancestor *wrapper* against the source
  *container* element — and a wrapper is always a child of a container, never equal to one, so it
  never fired.

---

## 0.15.0

### Added

- **`dropFeedback` container option** — `'gap'` (default, unchanged), `'indicator'` or `'none'`.

  `'gap'` slides the siblings apart, as always. The other two leave them alone: `'indicator'`
  reports where the drop would land as bounds on `onDropReady`, so the application draws its own;
  `'none'` shows nothing at all.

  Orthogonal to `behaviour`, which describes what a drop *means* rather than how it looks.

  ```ts
  onDropReady({ addedIndex, dropIndicator }) {
    // dropIndicator: { viewport, relative, container } — or null when not over this container
  }
  ```

  The bounds are a resolved rectangle, not an axis pair, and come in both viewport and
  container-relative space so an absolutely-positioned overlay needs no arithmetic. They span the
  gap the item would occupy and run to the container's own bounds at the ends of a list and in an
  empty container — the cases an application would otherwise handle with a sentinel.

  Internally this is a third pipeline composition: the sorting chain minus the stretcher and the
  sibling translations. Notably the threshold band is *kept* — it is what stops the insertion point
  flickering between slots, and an indicator needs that as much as an opening gap does.

---

## 0.14.0

### Added

- **`smoothDnD.cancelOnEscape`** — pressing Escape now cancels an in-progress drag. On by default;
  set false to own the key yourself. The listener runs in the capture phase, so while a drag is
  running the key does not reach application handlers — which is the point, but also why the opt-out
  exists.

### Fixed

- **`dropArea.end` was `NaN` when inserting past the last item.** It read `.end` / `.begin` off a raw
  DOM rect, which has neither, and computed a length where every neighbouring branch assigns a
  viewport coordinate. Latent until now because only `dropArea.begin` was ever read, but these are
  the bounds the forthcoming drop-indicator API exposes.

---

## 0.13.0

The first release since the fork's tooling migration, covering the engine review and the first
round of fixes.

### Added

- **`smoothDnD.onDropComplete(handler)`** — subscribe to the end of every drag, reported **once**,
  with both ends of the move resolved. Returns an unsubscribe function.

  `onDrop` fires per *container*, so a single cross-container move arrives as two events that the
  consumer has to correlate — and with `removeOnDropOut`, uninvolved containers get a third with
  both indices `null`. This reports the whole drag instead:

  ```ts
  smoothDnD.onDropComplete(({ action, from, to, payload, droppedOutside, cancelled }) => {
    // action: 'reorder' | 'move' | 'copy' | 'remove' | 'none'
  })
  ```

  `action` is derived rather than left to the consumer, including the cases that are easy to get
  wrong: a drop back in the same place is `'none'`, not a reorder, and a drop outside is only
  `'remove'` if the source was configured to allow it. Indices are the ones the item actually ended
  up at — the same adjustment `onDrop` applies, so the two agree.

  `onDrop` is unchanged.

- **`containerId` container option** — an opaque identifier echoed back on both ends of
  `onDropComplete`, so handlers can tell containers apart without closing over them at every call
  site. Unused by the engine otherwise.

### Fixed

- **Cross-container drops in vanilla usage were completely broken.** The dragged node was not passed
  to the drop handler, so a container receiving an item it did not own had nothing to insert: the
  item was removed from the source, never added to the target, and it threw. Framework adapters
  replace the handler, which is why this went unnoticed.
- **The drag preview could be clipped out of existence or offset.** It is `position: fixed` in
  viewport coordinates but was appended inside its container, so any ancestor with a `transform`
  became its containing block — silently reinterpreting those coordinates, and clipping it if that
  ancestor also had `overflow: hidden`. Both are routine, since the library puts `transform` on
  wrappers during a drag and the stylesheet gives every vertical wrapper `overflow: hidden`.
- **A consumer `onDrop` that threw left the library in a broken state.** The teardown was skipped,
  which among other things silently disabled cancel-on-drag for the rest of the session. Drop
  handling is now individually contained per container, with state reset unconditionally and the
  first error re-thrown afterwards so it stays visible.
- **Drop animations settle on `transitionend` or a timeout, whichever comes first.** Previously a
  bare timer, which desynced as soon as anyone restyled the ghost.
- **`containerBoxChanged` was overwritten rather than accumulated** while iterating containers, so a
  change reported by one could be cleared by the next. The re-measure was skipped and every
  container spent the rest of the drag on stale rectangles — presenting as drops landing one slot
  out in multi-container layouts.
- **`mousedown` threw on a wrapper whose container was no longer registered**, and then kept
  throwing for every subsequent `mousedown` in that subtree.
- **`dispose()` was incomplete** — it left behind a `window` resize listener and a pending timer
  (leaking a closure per container ever created), the container instance expando, and the container
  and orientation classes.
- **Disposing an unregistered container evicted a live one** from the registry.

### Changed

- **The drag preview now defaults to `document.body`** rather than its container — see the clipping
  fix above. A preview at the body no longer inherits container-scoped CSS: class-based styling is
  unaffected, but inherited properties such as `font` or `color` set on an ancestor are lost. Use
  `getGhostParent` to restore the previous behaviour.
- **Adapter versions realigned.** Both adapters were at `1.0.0` while the engine was at `0.12.x`.
  Nothing had been published, so all three now share the `0.13.0` line.

### Internal

- Characterisation test suite for the engine, which previously had none. jsdom implements no layout
  engine, so the harness supplies a synthetic one and drives drags through the real event path.
- `docs/architecture.md` and `docs/known-issues.md`; `CLAUDE.md` for orientation.
- A "drop out to empty space" demo, and a shared visual language across the drop demos.

---

## 0.12.1 and earlier

Inherited from upstream `smooth-dnd`. See the
[original repository](https://github.com/kutlugsahin/smooth-dnd).
