# smooth-dnd

Monorepo for the `smooth-dnd` drag-and-drop engine and its Vue 3 and React adapters. An independent
fork of Kutlu Sahin's original — see [`README.md`](./README.md) for the relationship and credit.

## Orientation

- **[`docs/architecture.md`](./docs/architecture.md)** — how the engine works, the module map, and
  the seam the planned work introduces. Read this before changing the engine.
- **[`docs/known-issues.md`](./docs/known-issues.md)** — findings from a full read, split into fixed
  and open. Check here before diagnosing something.
- **Issue tracker** — the roadmap. Requirements and known bugs are filed there; the tracking issue
  holds the sequencing.

## Layout

```
packages/smooth-dnd/        the engine, no framework
packages/vue-smooth-dnd/    Vue 3 adapter
packages/react-smooth-dnd/  React adapter
demos/vue, demos/react      mirrored demos; demos/shared owns the page manifest
```

## Commands

```bash
pnpm install
pnpm build      # required before typecheck — adapters resolve the core via its dist
pnpm test
pnpm typecheck
pnpm dev:vue    # http://localhost:5174
pnpm dev:react  # http://localhost:5175
```

`pnpm build` must run before `pnpm typecheck`, or the adapters fail to resolve
`@likelylogic/smooth-dnd`. `demos/vue typecheck` currently fails on a missing `vue-tsc` binary —
pre-existing, unrelated to any change.

## Working on the engine

**Tests are the safety net for geometry.** `packages/smooth-dnd/src/__tests__/` characterises the
layout maths, the insertion index, the shadow hysteresis and the translation calculation. jsdom has
no layout engine, so `helpers.ts` supplies a synthetic one — use `layoutContainer()` and
`startDrag()` rather than hand-rolling geometry.

Three conventions that are easy to trip over:

- **`it.fails` marks known bugs deliberately.** Those tests assert the correct behaviour, fail
  today, and will report as failing-to-fail once fixed. Do not "fix" them by inverting the
  assertion.
- **Call `settleEngine()` in `afterEach` for any test that starts a drag.** Drag state is
  module-level, so an abandoned drag leaks into the next test. `cancelDrag()` alone is not enough —
  it starts a drop animation, and while one is pending further cancels are no-ops.
- **Some internals are `export`ed only for tests.** `index.ts` controls the published API and does
  not re-export from those modules, so adding an `export` there does not widen the public surface.

**The demos are the manual test bed.** `demos/shared/navigation.ts` is the single source of truth
for which pages exist; a page listed there without an implementation in *both* demos fails loudly at
startup. That is deliberate — it keeps the two from drifting.

## Working practice

- One PR per feature or fix. Iterate on the branch — never stack correction PRs on merged work.
- Anything that affects drag *feel* gets driven in the demos in a browser before the PR merges.
  The test suite runs on jsdom and cannot see visual behaviour; it has repeatedly passed on
  broken interactions.
- One version bump per merged PR. CHANGELOG entries are terse and consumer-facing — what changed
  and how to use it. Diagnosis and reasoning live in commit messages, not the changelog.
- Squash-merge, so each piece of work lands as one commit on main.

## Conventions

- Two-space indent, single quotes, no semicolons in the adapters and demos; the engine is older code
  and uses semicolons — match the file you are in.
- Comments explain *why*, not what. The engine has a lot of non-obvious geometry; when you work out
  what something does, leave a note.
- Commit messages: what changed and why it mattered, in prose. Reference behaviour, not line numbers.
