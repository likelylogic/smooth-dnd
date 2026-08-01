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
  javascript/          vanilla JS demo
  vue/                 Vue 3 demo
  react/               React demo
```

The adapters depend on the core package via `workspace:*`, so they always build against local
source. The demos do the same.

## Getting started

```bash
pnpm install
pnpm build      # builds all three packages, in dependency order
```

The demos consume the packages' built output, so run `pnpm build` at least once before starting
one:

```bash
pnpm dev:javascript   # http://localhost:5173
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

## Licence

MIT — see [LICENSE](./LICENSE).
