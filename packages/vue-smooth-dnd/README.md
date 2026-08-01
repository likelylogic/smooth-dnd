# Vue Smooth DnD

A fast and lightweight drag & drop, sortable library for Vue, with many configuration options covering many d&d scenarios.

This package is a pair of thin Vue components – `Container` and `Draggable` – wrapping the framework-agnostic [smooth-dnd](https://github.com/likelylogic/smooth-dnd) library.

## Vue 3 only

This package targets **Vue 3** (peer dependency `vue: ^3.3.0`).

If you are coming from the original `vue-smooth-dnd` (0.8.x and earlier) note that:

- that package was **Vue 2 only**, and is not compatible with Vue 3
- this package is a rewrite, not a drop-in upgrade – the package name has changed, and the `tag` prop's object form is different

See [Migrating from vue-smooth-dnd 0.8.x](#migrating-from-vue-smooth-dnd-08x) for the details.

## Installation

```shell
pnpm add @likelylogic/vue-smooth-dnd
```

```shell
npm install @likelylogic/vue-smooth-dnd
```

```shell
yarn add @likelylogic/vue-smooth-dnd
```

The core library is pulled in as a dependency, and its styles are injected at runtime, so there is no CSS file to import.

## Usage

Import the components and use them directly:

```vue
<template>
  <Container @drop="onDrop">
    <Draggable v-for="item in items" :key="item.id">
      <div class="draggable-item">
        {{ item.data }}
      </div>
    </Draggable>
  </Container>
</template>

<script setup>
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'

const items = ref([
  { id: 1, data: 'Draggable 1' },
  { id: 2, data: 'Draggable 2' },
  { id: 3, data: 'Draggable 3' },
])

function onDrop ({ removedIndex, addedIndex, payload }) {
  if (removedIndex === null && addedIndex === null) {
    return
  }

  const result = [...items.value]
  let itemToAdd = payload

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0]
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd)
  }

  items.value = result
}
</script>
```

That `onDrop` body is the standard "apply drag" pattern – remove at `removedIndex`, insert at `addedIndex` – and is worth extracting to a helper if you have more than one list:

```js
export function applyDrag (arr, dropResult) {
  const { removedIndex, addedIndex, payload } = dropResult
  if (removedIndex === null && addedIndex === null) {
    return arr
  }

  const result = [...arr]
  let itemToAdd = payload

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0]
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd)
  }

  return result
}
```

The same thing with the Options API:

```vue
<script>
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag } from './utils'

export default {
  components: {
    Container,
    Draggable,
  },

  data () {
    return {
      items: [
        { id: 1, data: 'Draggable 1' },
      ],
    }
  },

  methods: {
    onDrop (dropResult) {
      this.items = applyDrag(this.items, dropResult)
    },
  },
}
</script>
```

Note that when items move **between** containers, `payload` is what makes the moved item available to the target container – so any container you want to drag *out of* needs a [`get-child-payload`](#get-child-payload) function.

---

## API: Container

The component that contains the draggable elements or components. Each of its children should be wrapped in a **Draggable** component.

### Props

Props are only forwarded to smooth-dnd if you actually set them, so anything you leave off falls back to the core library's own default. The "Default" column below shows the effective value.

| Prop | Type | Default | Description |
| - | :-: | :-: | - |
| `:behaviour` | `'move' \| 'copy' \| 'drop-zone' \| 'contain'` | `move` | Whether the dragged item is moved or copied to the target container. With `drop-zone` no draggable slides to open a gap when a container is dragged over. |
| `:group-name` | `string` | `undefined` | Draggables can be moved between containers sharing the same group name. If not set, the container will not accept drags from outside. Can be overridden by [`should-accept-drop`](#should-accept-drop). |
| `:orientation` | `'vertical' \| 'horizontal'` | `vertical` | Orientation of the container. |
| `:drag-handle-selector` | `string` | `undefined` | CSS selector to test for enabling dragging. If not given, an item can be grabbed anywhere within its bounds. |
| `:non-drag-area-selector` | `string` | `undefined` | CSS selector to prevent dragging. Useful for form elements or selectable text inside a draggable. Takes precedence over `drag-handle-selector`. |
| `:drag-begin-delay` | `number` | `0` (`200` for touch) | Milliseconds to wait after press before dragging starts. Moving the cursor more than 5px before the delay elapses cancels the drag. |
| `:animation-duration` | `number` | `250` | Animation duration in milliseconds, applied to both drop and reorder animations. |
| `:auto-scroll-enabled` | `boolean` | `true` | The first scrollable parent scrolls automatically when the dragged item nears its boundaries. |
| `:lock-axis` | `'x' \| 'y'` | `undefined` | Locks the movement axis of the drag. |
| `:drag-class` | `string` | `undefined` | Class added to the ghost item being dragged. It is added *after* the ghost enters the DOM, so transitions in the class apply as intended. |
| `:drop-class` | `string` | `undefined` | Class added to the ghost item just before the drop animation begins. |
| `:remove-on-drop-out` | `boolean` | `false` | When true, `@drop` is emitted with a `removedIndex` if you drop the element outside any relevant container. |
| `:drop-placeholder` | `boolean \| DropPlaceholderOptions` | `undefined` | Shows a placeholder at the drop position. Pass `true` for the default, or an object with `className`, `animationDuration` and `showOnTop`. |
| `:get-child-payload` | `(index: number) => unknown` | `undefined` | See [get-child-payload](#get-child-payload). |
| `:should-animate-drop` | `(sourceOptions, payload) => boolean` | `undefined` | See [should-animate-drop](#should-animate-drop). |
| `:should-accept-drop` | `(sourceOptions, payload) => boolean` | `undefined` | See [should-accept-drop](#should-accept-drop). |
| `:get-ghost-parent` | `() => HTMLElement` | `undefined` | See [get-ghost-parent](#get-ghost-parent). |
| `:tag` | `string \| TagObject` | `div` | See [tag](#tag). |

The four function props are **props, not events** – they are called to *ask a question* and their return value matters. Everything else that happens during a drag is delivered as an [event](#events).

### `tag`

The tag name, or a tag description, for the root element the Container renders:

```html
<Container tag="ul">
```

```html
<Container :tag="{ value: 'ul', props: { class: 'my-list' } }">
```

Possible values:

- `string` – the tag name of the root element to create
- `object` – a tag description
  - `value` : `string` – the tag name
  - `props` : `object` – a **flat** props object, spread onto the created element

> **Breaking change from 0.8.x:** `props` is now a flat object, matching Vue 3's [`h()`](https://vuejs.org/guide/extras/render-function.html#creating-vnodes) signature. Vue 2's nested data object (`{ attrs, props, on, domProps, ... }`) is gone – write `{ class: 'x', id: 'y' }`, not `{ attrs: { id: 'y' } }`.

Attributes set on the component itself fall through to the root element as usual, so `tag.props` is only needed when you want to build the tag description dynamically.

### Template ref

The Container exposes the underlying smooth-dnd instance as `container`, for the occasions you need imperative access:

```vue
<template>
  <Container ref="list">
    ...
  </Container>
</template>

<script setup>
import { ref } from 'vue'
import { Container } from '@likelylogic/vue-smooth-dnd'

const list = ref(null)

function refresh () {
  // SmoothDnD: { dispose(), setOptions(options, merge?) }
  list.value.container.setOptions({ animationDuration: 500 }, true)
}
</script>
```

It is `null` before mount and after unmount. Note that the component calls `setOptions()` itself on every update, so options you set imperatively will be overwritten – prefer props unless you have a specific reason not to.

---

## Lifecycle

The lifecycle of a drag is both described, and can be controlled, by the function [props](#props) and [events](#events), illustrated below for an example **containing 3 containers**:

```
Mouse     Calls  Prop / Event           Parameters              Notes

down   o                                                        Initial click

move   o                                                        Initial drag
       |
       |         get-child-payload()    index                   Function should return payload
       |
       |   3 x   should-accept-drop()   srcOptions, payload     Fired for all containers
       |
       |   3 x   drag-start             dragResult              Fired for all containers
       |
       |         drag-enter
       v

move   o                                                        Drag over containers
       |
       |   n x   drag-leave                                     Fired as draggable leaves container
       |   n x   drag-enter                                     Fired as draggable enters container
       |   n x   drop-ready             dropResult              Fired as the drop index changes
       v

up     o                                                        Finish drag

                 should-animate-drop()  srcOptions, payload     Fires once for dropped container

           3 x   drag-end               dragResult              Fired for all containers

           n x   drop                   dropResult              Fired only for droppable containers
```

The `dragResult` parameter (`DragStartParams` / `DragEndParams`) has the format:

```js
{
  payload,
  isSource,
  willAcceptDrop,
}
```

The `dropResult` parameter (`DropResult`) has the format:

```js
{
  removedIndex,
  addedIndex,
  payload,
  element,     // drop-ready only
}
```

Note that additional parameters can be passed to props and event handlers by writing an interim handler *inline* in the markup:

```html
<div v-for="(items, index) in groups" :key="index">
  <Container
    group-name="column"
    :should-accept-drop="(src, payload) => getShouldAcceptDrop(index, src, payload)"
    @drop="onDrop(index, $event)"
  >
    ...
  </Container>
</div>
```

This gives your handlers context-sensitive data, such as the loop index or current item.

---

## Function props

These provide additional logic and checks before and during user interaction. Because their return values are used, they are bound as props (`:get-child-payload="..."`) rather than listened to as events.

### `get-child-payload`

Called to get the payload object passed to the [`@drop`](#drop) handler.

```html
<Container :get-child-payload="getChildPayload">
```

```js
function getChildPayload (index) {
  return items.value[index]
}
```

Parameters:

- **index** : `number` – index of the child item

Returns:

- **payload** : `any`

### `should-accept-drop`

Called on all containers before a drag starts, to determine which containers can be dropped into. Setting this overrides the `group-name` prop – only the return value of this function is taken into account.

```html
<Container :should-accept-drop="shouldAcceptDrop">
```

```js
function shouldAcceptDrop (sourceContainerOptions, payload) {
  return true
}
```

Parameters:

- **sourceContainerOptions** : `ContainerOptions` – options of the source container (the parent container of the dragged item)
- **payload** : `any` – the payload returned by [`get-child-payload`](#get-child-payload)

Returns:

- `boolean`

### `should-animate-drop`

Called on the target container the dragged item will be dropped into. Sometimes the dragged item's dimensions do not suit the target container and the drop animation looks odd, so it can be disabled by returning **false**. If not set, drop animations are enabled.

```html
<Container :should-animate-drop="shouldAnimateDrop">
```

```js
function shouldAnimateDrop (sourceContainerOptions, payload) {
  return false
}
```

Parameters:

- **sourceContainerOptions** : `ContainerOptions` – options of the source container
- **payload** : `any` – the payload returned by [`get-child-payload`](#get-child-payload)

Returns:

- `boolean`

### `get-ghost-parent`

Called to get the element the dragged ghost is appended to. By default this is the container itself.

The ghost element is positioned `fixed` and appended to the given parent. If any ancestor of the container has a `transform`, the ghost is positioned relative to *that* element, which breaks the calculations – so if you have a transformed ancestor, use this to return an element that does not.

```html
<Container :get-ghost-parent="getGhostParent">
```

```js
function getGhostParent () {
  return document.body
}
```

Returns:

- `HTMLElement` – the element the ghost will be appended to

---

## Events

Events are emitted in kebab-case, and are listened to with `@`:

| Event | Parameter | Description |
| - | :-: | - |
| `@drag-start` | `DragStartParams` | Emitted by all containers when a drag starts. |
| `@drag-end` | `DragEndParams` | Emitted by all containers when a drag ends. Emitted before `@drop`. |
| `@drag-enter` | – | Emitted by a container when a dragged item enters its bounds. |
| `@drag-leave` | – | Emitted by a container when a dragged item leaves its bounds. |
| `@drop-ready` | `DropResult` | Emitted by the container being dragged over each time the potential drop index changes – i.e. each time its draggables slide to open a space. |
| `@drop` | `DropResult` | Emitted by any relevant container once the drop is over (after the drop animation ends). The source container, and any container that could accept the drop, are considered relevant. |

### `@drag-start` / `@drag-end`

```html
<Container @drag-start="onDragStart" @drag-end="onDragEnd">
```

```js
function onDragStart (dragResult) {
  const { isSource, payload, willAcceptDrop } = dragResult
}
```

Parameters:

- **dragResult** : `object`
  - **isSource** : `boolean` – true if emitted by the container the drag started from
  - **payload** : `any` – the payload returned by [`get-child-payload`](#get-child-payload); `undefined` if that prop is not set
  - **willAcceptDrop** : `boolean` – true if the dragged item can be dropped into this container

### `@drag-enter` / `@drag-leave`

```html
<Container @drag-enter="onDragEnter" @drag-leave="onDragLeave">
```

```js
function onDragEnter () {
  // ...
}
```

No parameters are passed.

### `@drop-ready`

```html
<Container @drop-ready="onDropReady">
```

```js
function onDropReady (dropResult) {
  const { removedIndex, addedIndex, payload, element } = dropResult
}
```

Parameters:

- **dropResult** : `object`
  - **removedIndex** : `number | null` – index of the removed child; `null` if no item is removed
  - **addedIndex** : `number | null` – index the dropped item would be added at; `null` if no item is added
  - **payload** : `any` – the payload returned by [`get-child-payload`](#get-child-payload)
  - **element** : `HTMLElement | undefined` – the DOM element being moved

### `@drop`

```html
<Container @drop="onDrop">
```

```js
function onDrop (dropResult) {
  const { removedIndex, addedIndex, payload } = dropResult
}
```

Parameters:

- **dropResult** : `object`
  - **removedIndex** : `number | null` – index of the removed child; `null` if no item is removed
  - **addedIndex** : `number | null` – index to add the dropped item at; `null` if no item is added
  - **payload** : `any` – the payload returned by [`get-child-payload`](#get-child-payload)

Nothing is moved in the DOM for you – Vue owns the children, so it is your `@drop` handler's job to update the backing array (see [Usage](#usage)).

---

## API: Draggable

Wrapper component for a Container's children. Every child element should be wrapped in a **Draggable**.

### Props

| Prop | Type | Default | Description |
| - | :-: | :-: | - |
| `:tag` | `string \| TagObject` | `div` | The tag name, or tag description, for the root element. |

### `tag`

Works exactly as it does on [Container](#tag), and takes the same flat `props` object:

```html
<Draggable tag="tr">
```

```html
<Draggable :tag="{ value: 'tr', props: { class: 'my-table-row' } }">
```

The library's own wrapper class is merged into whatever `class` you provide, so you can safely set one.

A table, for example:

```vue
<template>
  <table>
    <thead>
      <tr>
        <th>Name</th>
      </tr>
    </thead>
    <Container tag="tbody" @drop="onDrop">
      <Draggable v-for="item in items" :key="item.id" tag="tr">
        <td>{{ item.data }}</td>
      </Draggable>
    </Container>
  </table>
</template>
```

---

## TypeScript

The package re-exports the core library's types, so you can import them from here directly:

```ts
import type {
  ContainerOptions,
  DragEndParams,
  DragStartParams,
  DropPlaceholderOptions,
  DropResult,
  SmoothDnD,
} from '@likelylogic/vue-smooth-dnd'
```

Plus the types for the `tag` prop:

```ts
import type { TagObject, TagProp, TagValue } from '@likelylogic/vue-smooth-dnd'
```

---

## Migrating from vue-smooth-dnd 0.8.x

| | 0.8.x | This package |
| - | - | - |
| Package | `vue-smooth-dnd` | `@likelylogic/vue-smooth-dnd` |
| Vue | 2 | 3 |
| `tag` object form | `{ value, props }` where `props` is Vue 2's nested data object | `{ value, props }` where `props` is a **flat** Vue 3 props object |

Everything else – the component names, the props, the event names – is unchanged, so in most cases the migration is the import path plus any `tag` objects you have written.
