<template>
  <div class="card-scene">
    <Container
      orientation="horizontal"
      group-name="columns"
      :should-accept-drop="shouldAcceptColumnDrop"
      :drop-feedback="columnDropFeedback"
      @drop="onColumnDrop($event)"
      @drop-ready="onColumnDropReady"
      @drag-leave="columnIndicator = null"
      drag-handle-selector=".column-drag-handle"
      @drag-start="dragStart"
      :drop-placeholder="upperDropPlaceholderOptions"
    >
      <Draggable v-for="column in scene.children" :key="column.id">
        <div :class="column.props.className">
          <div class="card-column-header">
            <span class="column-drag-handle">&#x2630;</span>
            {{ column.name }}
          </div>
          <Container
            group-name="col"
            @drop="(e) => onCardDrop(column.id, e)"
            @drag-start="(e) => log('drag start', e)"
            @drag-end="(e) => log('drag end', e)"
            :get-child-payload="getCardPayload(column.id)"
            drag-class="card-ghost"
            drop-class="card-ghost-drop"
            :drop-placeholder="dropPlaceholderOptions"
          >
            <Draggable v-for="card in column.children" :key="card.id">
              <div :class="card.props.className" :style="card.props.style">
                <p>{{ card.data }}</p>
              </div>
            </Draggable>
          </Container>
        </div>
      </Draggable>

      <!-- where a card dragged between columns would land, as a new column -->
      <div v-if="columnIndicator" class="drop-line-vertical" :style="columnIndicatorStyle" />
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import type { ContainerOptions, DropIndicator, DropResult } from '@likelylogic/smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Card {
  id: string
  type: string
  props: {
    className: string
    style: CSSProperties
  }
  data: string
}

interface Column {
  id: string
  type: string
  name: string
  props: {
    orientation: string
    className: string
  }
  children: Card[]
}

interface Scene {
  type: string
  props: { orientation: string }
  children: Column[]
}

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

const columnNames = ['Lorem', 'Ipsum', 'Consectetur', 'Eiusmod']

const cardColors = [
  'azure',
  'beige',
  'bisque',
  'blanchedalmond',
  'burlywood',
  'cornsilk',
  'gainsboro',
  'ghostwhite',
  'ivory',
  'khaki',
]

const pickColor = () => {
  const rand = Math.floor(Math.random() * 10)
  return cardColors[rand]
}

const initialScene: Scene = {
  type: 'container',
  props: {
    orientation: 'horizontal',
  },
  children: generateItems<Column>(4, i => ({
    id: `column${i}`,
    type: 'container',
    name: columnNames[i],
    props: {
      orientation: 'vertical',
      className: 'card-container',
    },
    children: generateItems<Card>(+(Math.random() * 10).toFixed() + 5, j => ({
      type: 'draggable',
      id: `${i}${j}`,
      props: {
        className: 'card',
        style: { backgroundColor: pickColor() },
      },
      data: lorem.slice(0, Math.floor(Math.random() * 150) + 30),
    })),
  })),
}

const scene = ref<Scene>(initialScene)

const upperDropPlaceholderOptions = {
  className: 'cards-drop-preview',
  animationDuration: 150,
  showOnTop: true,
}

const dropPlaceholderOptions = {
  className: 'drop-preview',
  animationDuration: 150,
  showOnTop: true,
}

const columnIndicator = ref<DropIndicator | null>(null)

const columnIndicatorStyle = computed(() => {
  const box = columnIndicator.value!.relative
  return { left: `${box.left}px`, top: `${box.top}px`, height: `${box.height}px` }
})

// Columns sort among themselves, and also accept cards — which land as a new column.
function shouldAcceptColumnDrop (source: ContainerOptions) {
  return source.groupName === 'columns' || source.groupName === 'col'
}

// Sorting columns opens a gap as usual; a card dragged across the board shows an indicator
// instead, since full columns sliding aside for a single card would read as nonsense.
function columnDropFeedback (source: ContainerOptions) {
  return source.groupName === 'col' ? 'indicator' as const : 'gap' as const
}

function onColumnDropReady (result: DropResult) {
  columnIndicator.value = result.dropIndicator ?? null
}

let newColumnCount = 0

function newColumn (card: Card): Column {
  newColumnCount++
  return {
    id: `new-column-${newColumnCount}`,
    type: 'container',
    name: `New column ${newColumnCount}`,
    props: { orientation: 'vertical', className: 'card-container' },
    children: [card],
  }
}

function onColumnDrop (dropResult: DragResult) {
  columnIndicator.value = null
  const payload = dropResult.payload as Card | Column | undefined

  // a card dropped between columns becomes a new column holding it; the source column's own
  // drop handler removes it from where it came from
  if (payload && payload.type === 'draggable') {
    if (dropResult.addedIndex !== null) {
      const next = Object.assign({}, scene.value)
      next.children = [...next.children]
      next.children.splice(dropResult.addedIndex, 0, newColumn(payload as Card))
      scene.value = next
    }
    return
  }

  const next = Object.assign({}, scene.value)
  next.children = applyDrag(next.children, dropResult)
  scene.value = next
}

function onCardDrop (columnId: string, dropResult: DragResult) {
  if (dropResult.removedIndex !== null || dropResult.addedIndex !== null) {
    const next = Object.assign({}, scene.value)
    const column = next.children.filter(p => p.id === columnId)[0]
    const columnIndex = next.children.indexOf(column)

    const newColumn = Object.assign({}, column)
    newColumn.children = applyDrag(newColumn.children, dropResult)
    next.children.splice(columnIndex, 1, newColumn)

    scene.value = next
  }
}

function getCardPayload (columnId: string) {
  return (index: number) => {
    return scene.value.children.filter(p => p.id === columnId)[0].children[index]
  }
}

function dragStart () {
  console.log('drag started')
}

function log (...params: unknown[]) {
  console.log(...params)
}
</script>
