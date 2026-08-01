<template>
  <div>
    <div class="simple-page">
      <Container @drop="onDrop">
        <Draggable v-for="item in items" :key="item.id">
          <div class="draggable-item" :style="{ height: item.height }">
            {{ item.data }}
          </div>
        </Draggable>
      </Container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: number
  data: string
  height: string
}

const items = ref<Item[]>(generateItems(50, index => ({
  id: index,
  data: 'Draggable' + index,
  height: `${(40 + Math.random() * 200).toFixed()}px`,
})))

function onDrop (dropResult: DragResult) {
  items.value = applyDrag(items.value, dropResult)
}
</script>
