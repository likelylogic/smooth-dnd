/**
 * The demo page manifest, shared by the Vue and React demos.
 *
 * This is deliberately framework-agnostic: it names pages, it doesn't import
 * them. Each demo resolves a `name` to its own component — Vue via
 * `import.meta.glob`, React via an explicit map — so the two demos are
 * guaranteed to offer the same pages, under the same titles, in the same order.
 *
 * Adding a page here without implementing it in both demos will fail loudly at
 * startup, which is the point: it keeps the demos from drifting apart.
 */

export interface DemoPage {
  /** Page id — also the route path and the source filename stem. */
  name: string
  /** Label shown in the nav and the header. */
  title: string
  /** One-line explanation of what the page demonstrates. */
  description: string
}

export interface DemoSection {
  title: string
  pages: DemoPage[]
}

export const navigation: DemoSection[] = [
  {
    title: 'Showcase',
    pages: [
      {
        name: 'cards',
        title: 'Card board',
        description: 'A Trello-style board. The columns are draggable too, so this nests a horizontal container of vertical ones.',
      },
      {
        name: 'form',
        title: 'Form elements',
        description: 'Reordering live form fields — inputs keep their focus and value across a drag.',
      },
      {
        name: 'chess',
        title: 'Chess board',
        description: 'Uses shouldAcceptDrop per square to allow only legal targets.',
      },
    ],
  },
  {
    title: 'Sortables',
    pages: [
      {
        name: 'simple',
        title: 'Sortable with default options',
        description: 'The baseline: one container, default options.',
      },
      {
        name: 'simple-scroller',
        title: 'Sortable inside scroller',
        description: 'A sortable in a fixed-height scrolling parent, so the list auto-scrolls as you drag near an edge.',
      },
      {
        name: 'simple-horizontal',
        title: 'Horizontal sortable',
        description: 'orientation: horizontal.',
      },
      {
        name: 'height',
        title: 'Varying item heights',
        description: 'Items of randomised heights, which exercises the layout maths harder than uniform rows.',
      },
      {
        name: 'table',
        title: 'Custom tag (table)',
        description: 'tag="tbody" / tag="tr" — dragging table rows, where injected wrapper divs would break the layout.',
      },
    ],
  },
  {
    title: 'Groups',
    pages: [
      {
        name: 'groups',
        title: 'DnD between groups',
        description: 'Two containers sharing a groupName, so items move between them.',
      },
      {
        name: 'copy',
        title: 'Copy draggable',
        description: 'behaviour: copy — the source keeps its item and the target receives a clone.',
      },
      {
        name: 'drop-zone',
        title: 'Drop zones',
        description: 'behaviour: drop-zone — targets that accept a drop without reordering their own children.',
      },
      {
        name: 'drop-out',
        title: 'Drop out to empty space',
        description: 'A drop zone surrounding the sortables, so items can be dragged off a list and released into empty space.',
      },
    ],
  },
  {
    title: 'Drop targeting',
    pages: [
      {
        name: 'drop-indicator',
        title: 'Drop indicator',
        description: 'dropFeedback: indicator — nothing slides apart; the library reports bounds and the page draws its own line.',
      },
      {
        name: 'tree',
        title: 'Drop onto items',
        description: 'dropOnItems — the middle of a node accepts a drop into it, the edges still insert between nodes.',
      },
    ],
  },
  {
    title: 'Nesting',
    pages: [
      {
        name: 'nested',
        title: 'Nested vertical sortable',
        description: 'A sortable container inside a sortable container.',
      },
      {
        name: 'nested-group',
        title: 'Drag between parent and child',
        description: 'The hard nesting case: items moving across the parent/child boundary.',
      },
    ],
  },
  {
    title: 'Options',
    pages: [
      {
        name: 'lock-axis',
        title: 'Lock axis',
        description: 'lockAxis constrains the ghost to one axis.',
      },
      {
        name: 'drag-handle',
        title: 'Drag handle',
        description: 'dragHandleSelector — only the grip starts a drag.',
      },
      {
        name: 'drag-class',
        title: 'Drag and drop classes',
        description: 'dragClass and dropClass, the styling hooks for the ghost.',
      },
      {
        name: 'drag-delay',
        title: 'Drag begin delay of 500ms',
        description: 'dragBeginDelay — the long-press behaviour that makes touch scrolling usable.',
      },
      {
        name: 'transition-duration',
        title: 'Animation duration 1000ms',
        description: 'animationDuration turned right up so the animation is easy to watch.',
      },
    ],
  },
  {
    title: 'Advanced',
    pages: [
      {
        name: 'scroll-both',
        title: 'Auto-scroll on both axes',
        description: 'A container that scrolls horizontally and vertically at once.',
      },
      {
        name: 'dynamic-containers',
        title: 'Dynamic add/remove containers',
        description: 'Containers created and destroyed at runtime, including inside popups.',
      },
      {
        name: 'events',
        title: 'Callbacks and events',
        description: 'A live log of every callback and event as it fires.',
      },
    ],
  },
]

/** Flat list of every page, in nav order. */
export const pages: DemoPage[] = navigation.flatMap(section => section.pages)

/** The page shown at `/`. */
export const defaultPage = pages[0].name

export default navigation
