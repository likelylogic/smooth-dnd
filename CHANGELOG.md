# Changelog

All three packages — `@likelylogic/smooth-dnd`, `@likelylogic/vue-smooth-dnd` and
`@likelylogic/react-smooth-dnd` — version together. The adapters are thin and track the engine, so
independent versions would only obscure which combination was tested.

**Pre-1.0.** Minor versions may contain breaking changes; patches will not. `1.0.0` is reserved for
when the roadmap's non-deferred work is complete — see the roadmap issue.

Nothing has been published yet, so no released version is being changed retroactively.

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
