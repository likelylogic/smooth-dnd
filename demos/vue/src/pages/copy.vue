<template>
  <div style="display: flex; justify-content: stretch; margin-top: 50px; margin-right: 50px">
    <div style="margin-left: 50px; flex: 1">
      <Container behaviour="copy" group-name="1" :get-child-payload="getChildPayload1">
        <Draggable v-for="item in items1" :key="item.id">
          <div class="draggable-item">
            {{item.data}}
          </div>
        </Draggable>
      </Container>
    </div>
    <div style="margin-left: 50px; flex: 1">
      <Container group-name="1" :get-child-payload="getChildPayload2" @drop="onDrop2">
        <Draggable v-for="item in items2" :key="item.id">
          <div class="draggable-item">
            {{item.data}}
          </div>
        </Draggable>
      </Container>
    </div>
    <div style="margin-left: 50px; flex: 1">
      <Container group-name="1" :get-child-payload="getChildPayload3" @drop="onDrop3">
        <Draggable v-for="item in items3" :key="item.id">
          <div class="draggable-item">
            {{item.data}}
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
  id: string
  data: string
}

const items1 = ref<Item[]>(generateItems(15, i => ({
  id: '1' + i,
  data: `Source Draggable - ${i}`,
})))

const items2 = ref<Item[]>(generateItems(15, i => ({
  id: '2' + i,
  data: `Draggable 2 - ${i}`,
})))

const items3 = ref<Item[]>(generateItems(15, i => ({
  id: '3' + i,
  data: `Draggable 3 - ${i}`,
})))

function onDrop2 (dropResult: DragResult) {
  items2.value = applyDrag(items2.value, dropResult)
}

function onDrop3 (dropResult: DragResult) {
  items3.value = applyDrag(items3.value, dropResult)
}

function getChildPayload1 (index: number) {
  return items1.value[index]
}

function getChildPayload2 (index: number) {
  return items2.value[index]
}

function getChildPayload3 (index: number) {
  return items3.value[index]
}
</script>
