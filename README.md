# smooth-dnd

Monorepo for [smooth-dnd](https://github.com/likelylogic/smooth-dnd) and its framework adapters.

Forked from [kutlugsahin/smooth-dnd](https://github.com/kutlugsahin/smooth-dnd), with the Vue and
React adapters merged in from their own repositories (their history is preserved).

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

## Notes on the fork

- Packages are scoped to `@likelylogic` because the unscoped names on npm belong to the original
  author.
- The Vue adapter targets **Vue 3**. The last published `vue-smooth-dnd` (0.8.1) was Vue 2; this is
  a rewrite, not a compatible upgrade.
- Build tooling moved from Rollup 1 / Babel 7.3 / TypeScript 3.3 to Vite library mode and current
  TypeScript.
- Declarations are emitted by `tsc --emitDeclarationOnly`, not a Vite plugin: TypeScript 7 removed
  the JavaScript Compiler API that `vite-plugin-dts` relies on.
- The adapters keep `@likelylogic/smooth-dnd` **external**. They configure the core by mutating its
  module singleton (`smoothDnD.dropHandler`, `smoothDnD.wrapChild`), so bundling a private copy
  would leave anyone importing the core directly holding a different, unconfigured instance.
- Vite is pinned to 7 because `@vitejs/plugin-react` 6 requires Vite 8. The React side uses
  esbuild's JSX transform instead, which costs only React Fast Refresh in the demo.

## Licence

MIT — see [LICENSE](./LICENSE).
