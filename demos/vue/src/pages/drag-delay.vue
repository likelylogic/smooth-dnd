<template>
  <div class="simple-page">
    <Container @drop="onDrop" :drag-begin-delay="500" drag-class="form-ghost" drop-class="form-ghost-drop">
      <Draggable v-for="item in items" :key="item.id">
        <div class="draggable-item">
          {{item.data}}
        </div>
      </Draggable>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

const items = ref(generateItems(50, i => ({ id: i, data: 'Draggable ' + i })))

function onDrop (dropResult: DragResult) {
  items.value = applyDrag(items.value, dropResult)
}
</script>
