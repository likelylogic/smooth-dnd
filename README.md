# smooth-dnd

Monorepo for [smooth-dnd](https://github.com/likelylogic/smooth-dnd) and its framework adapters.

## Credit and relationship to the original

All of the drag-and-drop engine here is the work of
**[Kutlu Sahin](https://github.com/kutlugsahin)**, who wrote and maintained the original
[smooth-dnd](https://github.com/kutlugsahin/smooth-dnd),
[vue-smooth-dnd](https://github.com/kutlugsahin/vue-smooth-dnd) and
[react-smooth-dnd](https://github.com/kutlugsahin/react-smooth-dnd), all under the MIT licence.
The core engine is his and is essentially untouched here — the physics, the layout maths and the
drop handling are all his work. What this project changes is the packaging and the tooling around
it, plus a Vue 3 rewrite of the Vue adapter (the original targeted Vue 2). Please star the original
repositories.

This is an **independent fork**. It is maintained separately, its changes are not submitted back
upstream, and it is not endorsed by the original author. It exists because the original packages
were last published in 2022, and this fork wanted Vue 3 support, current tooling and somewhere to
fix bugs — the upstream repositories remain the canonical `smooth-dnd`.

It is deliberately not a GitHub fork, so that it has its own issue tracker and shows up in search.
The three original repositories were subtree-merged rather than copied, so upstream authorship
survives in `git log` and `git blame`.

Packages are published under the `@likelylogic` scope, so they can't be confused with, and will
never overwrite, the originals on npm.

## Layout

```
packages/
  smooth-dnd/          @likelylogic/smooth-dnd         core library, no framework
  vue-smooth-dnd/      @likelylogic/vue-smooth-dnd     Vue 3 adapter
  react-smooth-dnd/    @likelylogic/react-smooth-dnd   React adapter
demos/
  shared/              @demo/shared    styles, page manifest, helpers
  vue/                 Vue 3 demo
  react/               React demo
```

The adapters depend on the core package via `workspace:*`, so they always build against local
source. The demos do the same.

The two demos deliberately mirror each other — same page names, same structure, same CSS classes —
so a page can be diffed across frameworks when chasing an adapter bug.
[`demos/shared/navigation.ts`](./demos/shared/navigation.ts) is the single source of truth for
which pages exist; a page listed there with no implementation fails loudly at startup, which is
what keeps the two from drifting.

## Getting started

```bash
pnpm install
pnpm build      # builds all three packages, in dependency order
```

The demos consume the packages' built output, so run `pnpm build` at least once before starting
one:

```bash
pnpm dev:vue          # http://localhost:5174
pnpm dev:react        # http://localhost:5175
```

To iterate on a package and a demo together, run the package's watch build alongside the demo:

```bash
pnpm --filter @likelylogic/vue-smooth-dnd dev   # rebuilds on change
pnpm dev:vue                                    # in another terminal
```

## Other tasks

```bash
pnpm typecheck   # tsc / vue-tsc across all packages
pnpm test        # vitest
```

## What changed from upstream

- The Vue adapter targets **Vue 3**. The last published `vue-smooth-dnd` (0.8.1) was Vue 2; this is
  a rewrite, not a compatible upgrade.
- Build tooling moved from Rollup 1 / Babel 7.3 / TypeScript 3.3 to Vite library mode and current
  TypeScript.
- TypeScript is pinned to the **5.x** line, not the 7.x tagged `latest`. TypeScript 7 (the native
  port) removed the JavaScript Compiler API and the `typescript/lib/tsc` entry point that much of
  the ecosystem still reaches for — `vue-tsc` and `vite-plugin-dts` both fail outright against it.
  Worth retrying once those catch up; nothing here depends on staying on 5.
- Declarations are emitted by `tsc --emitDeclarationOnly` rather than a Vite plugin. This started as
  a TypeScript 7 workaround but is kept because it is one fewer dependency and matches what the
  original build did.
- The adapters keep `@likelylogic/smooth-dnd` **external**. They configure the core by mutating its
  module singleton (`smoothDnD.dropHandler`, `smoothDnD.wrapChild`), so bundling a private copy
  would leave anyone importing the core directly holding a different, unconfigured instance.
- Vite is pinned to 7 because `@vitejs/plugin-react` 6 requires Vite 8. The React side uses
  esbuild's JSX transform instead, which costs only React Fast Refresh in the demo.

## Licence

MIT, as the original is — see [LICENSE](./LICENSE). Copyright for the original work remains with
Kutlu Sahin, and every upstream licence file is kept byte-for-byte as it arrived rather than
reassigned.

One oddity worth knowing: `packages/vue-smooth-dnd/LICENSE` is MIT but names Claudéric Demers
(2016), not Kutlu Sahin. That came in with the subtree merge — the upstream `vue-smooth-dnd`
repository has always shipped it, most likely inherited from the Vue library template it was
scaffolded from. It has been left exactly as found, since correcting someone else's copyright
notice isn't this fork's call to make.
