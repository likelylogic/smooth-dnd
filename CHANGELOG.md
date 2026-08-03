# Changelog

The engine and both adapters version together, pre-1.0. `1.0.0` when the roadmap's non-deferred
work is done — see the roadmap issue.

## 0.15.0

### Added

- `dropFeedback` container option: `'gap'` (default), `'indicator'` or `'none'`, or a function of
  `(sourceContainerOptions, payload)` decided once per drag. `indicator` and `none` keep the items
  still; `indicator` reports where the drop would land as `dropIndicator` bounds (viewport and
  container-relative) on `onDropReady`.
- `dropOnItems` container option: the middle of an item resolves to a drop onto it, reported as
  `dropTarget: { kind: 'into', index }` on `onDropReady` and `onDropComplete`; the edges still
  insert between items. Works with any feedback mode, including `gap`.
- Demo pages: `drop-indicator`, `tree`, and the cards board grows a new column when a card is
  dropped between columns.

### Fixed

- The Vue adapter did not forward `containerId`, `dropFeedback` or `dropOnItems`.

## 0.14.0

### Added

- Escape cancels an in-progress drag. `smoothDnD.cancelOnEscape = false` to opt out.

### Fixed

- `dropArea.end` was `NaN` when inserting past the last item.

## 0.13.0

### Added

- `smoothDnD.onDropComplete(handler)` — the whole drag reported once, with
  `{ action, from, to, payload, droppedOutside, cancelled }`. Returns an unsubscribe function.
- `containerId` container option, echoed on drop results.

### Fixed

- Cross-container drops in vanilla (non-adapter) usage threw and lost the item.
- The drag ghost is now parented to `document.body`, fixing clipping and offset inside nested or
  transformed containers. `getGhostParent` still overrides.
- A consumer `onDrop` that threw could leave dragging permanently broken.
- Assorted lifecycle fixes: stale rect invalidation, mousedown on disposed containers, incomplete
  `dispose()`, double-dispose corrupting the registry.

### Internal

- Characterisation test suite for the engine; `docs/architecture.md` and `docs/known-issues.md`.

## 0.12.1 and earlier

Inherited from upstream [smooth-dnd](https://github.com/kutlugsahin/smooth-dnd).
