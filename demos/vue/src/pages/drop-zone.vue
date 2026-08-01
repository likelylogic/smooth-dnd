<template>
  <div class="drop-zone">
    <div
      v-for="(occupied, index) in zones"
      :key="index"
      :class="['drop-zone-container', classes[index]]"
    >
      <Container
        style="height: 100%"
        group-name="1"
        behaviour="drop-zone"
        @drop="onDrop(index, $event)"
        @drag-enter="dragEnter(index)"
        @drag-leave="dragLeave(index)"
      >
        <Draggable v-if="occupied">
          <div class="drop-zone-draggable">
            Draggable
          </div>
        </Draggable>
      </Container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import type { DragResult } from '@demo/shared'

const zones = ref<number[]>([1, 0, 0, 0])
const classes = ref<string[]>(['', '', '', ''])

function onDrop (containerIndex: number, dropResult: DragResult) {
  const { addedIndex, removedIndex } = dropResult

  if (addedIndex !== null || removedIndex !== null) {
    if (removedIndex !== null) {
      zones.value[containerIndex] = 0
    }
    if (addedIndex !== null) {
      zones.value[containerIndex] = 1
    }
  }

  classes.value[containerIndex] = ''
}

function dragEnter (index: number) {
  classes.value[index] = 'hover'
}

function dragLeave (index: number) {
  classes.value[index] = ''
}
</script>
