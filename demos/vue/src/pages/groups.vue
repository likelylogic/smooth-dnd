<template>
  <div class="groups">
    <div class="group">
      <Container group-name="1" :get-child-payload="getChildPayload1" @drop="onDrop1">
        <Draggable v-for="item in items1" :key="item.id">
          <div class="draggable-item">
            {{item.data}}
          </div>
        </Draggable>
      </Container>
    </div>
    <div class="group">
      <Container group-name="1" :get-child-payload="getChildPayload2" @drop="onDrop2">
        <Draggable v-for="item in items2" :key="item.id">
          <div class="draggable-item">
            {{item.data}}
          </div>
        </Draggable>
      </Container>
    </div>
    <div class="group">
      <Container group-name="1" :get-child-payload="getChildPayload3" @drop="onDrop3">
        <Draggable v-for="item in items3" :key="item.id">
          <div class="draggable-item">
            {{item.data}}
          </div>
        </Draggable>
      </Container>
    </div>
    <div class="group">
      <Container group-name="1" :get-child-payload="getChildPayload4" @drop="onDrop4">
        <Draggable v-for="item in items4" :key="item.id">
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
  data: `Draggable 1 - ${i}`,
})))

const items2 = ref<Item[]>(generateItems(15, i => ({
  id: '2' + i,
  data: `Draggable 2 - ${i}`,
})))

const items3 = ref<Item[]>(generateItems(15, i => ({
  id: '3' + i,
  data: `Draggable 3 - ${i}`,
})))

const items4 = ref<Item[]>(generateItems(15, i => ({
  id: '4' + i,
  data: `Draggable 3 - ${i}`,
})))

function onDrop1 (dropResult: DragResult) {
  items1.value = applyDrag(items1.value, dropResult)
}

function onDrop2 (dropResult: DragResult) {
  items2.value = applyDrag(items2.value, dropResult)
}

function onDrop3 (dropResult: DragResult) {
  items3.value = applyDrag(items3.value, dropResult)
}

function onDrop4 (dropResult: DragResult) {
  items4.value = applyDrag(items4.value, dropResult)
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

function getChildPayload4 (index: number) {
  return items4.value[index]
}
</script>

<style lang="css" scoped>
  .groups {
    display: flex;
    justify-content: stretch;
    margin-top: 50px;
    margin-right: 50px;
  }

  .group {
    margin-left: 50px;
    flex: 1;
  }
</style>
