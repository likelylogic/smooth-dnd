<template>
  <div class="simple-page">
    <p class="drop-hint">
      Nothing slides out of the way. The library reports where the item would land, and the line
      below is rendered by this page from those bounds.
    </p>

    <!-- position: relative comes from .smooth-dnd-container, so the overlay can use the
         container-relative bounds directly -->
    <Container
      drop-feedback="indicator"
      :get-child-payload="index => items[index]"
      @drop-ready="onDropReady"
      @drop="onDrop"
      @drag-leave="indicator = null"
    >
      <Draggable v-for="item in items" :key="item.id">
        <div class="draggable-item">{{ item.data }}</div>
      </Draggable>

      <!-- the app's own indicator, drawn from what the library reported -->
      <div v-if="indicator" class="drop-line" :style="indicatorStyle" />
    </Container>

    <dl class="drop-readout">
      <dt>bounds</dt>
      <dd>{{ readout }}</dd>
      <dt>last drop</dt>
      <dd>{{ lastDrop }}</dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { smoothDnD, type DropCompleteResult, type DropIndicator, type DropResult } from '@likelylogic/smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: string
  data: string
}

const items = ref<Item[]>(generateItems(8, i => ({ id: `i${i}`, data: `Item ${i}` })))
const indicator = ref<DropIndicator | null>(null)
const lastDrop = ref('—')

// The indicator spans the gap the item would occupy; drawing a line down its middle is one
// choice among several — filling it, or insetting it, would work just as well.
const indicatorStyle = computed(() => {
  const box = indicator.value!.relative
  return {
    top: `${box.top + box.height / 2}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
  }
})

const readout = computed(() => {
  if (!indicator.value) {
    return '—'
  }
  const { top, left, width, height } = indicator.value.relative
  return `top ${Math.round(top)}, left ${Math.round(left)}, ${Math.round(width)} × ${Math.round(height)}`
})

function onDropReady (result: DropResult) {
  indicator.value = result.dropIndicator ?? null
}

function onDrop (dropResult: DragResult) {
  indicator.value = null
  items.value = applyDrag(items.value, dropResult)
}

// onDropComplete is global — a drag spans containers, so no single one of them owns the outcome.
const off = smoothDnD.onDropComplete((result: DropCompleteResult) => {
  lastDrop.value = `${result.action}: ${result.from?.index} → ${result.to?.index ?? '—'}`
})
onBeforeUnmount(off)
</script>
