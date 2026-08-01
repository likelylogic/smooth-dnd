<template>
  <div class="wide-page">

    <div class="columns">

      <div v-for="(items, index) in groups"
        :key="index"
        class="column"
      >
        <div>
          <label>
            <input type="checkbox" v-model="flags[index].drop"> Accept Drop
          </label>
          <label>
            <input type="checkbox" v-model="flags[index].animate"> Animate Drop
          </label>
        </div>
        <Container :data-index="index" group-name="column"

          :get-child-payload="itemIndex => getChildPayload(index, itemIndex)"
          :should-accept-drop="(src, payload) => getShouldAcceptDrop(index, src, payload)"
          :should-animate-drop="(src, payload) => getShouldAnimateDrop(index, src, payload)"

          @drag-start="onDragStart"
          @drag-enter="onDragEnter(index)"
          @drag-leave="onDragLeave(index)"
          @drag-end="onDragEnd"
          @drop="onDrop(index, $event)"
        >
          <Draggable v-for="item in items" :key="item.id">
            <div class="draggable-item">
              {{ item.data }}
            </div>
          </Draggable>
        </Container>
      </div>

    </div>

    <div class="controls">
      <div>
        <button @click="removeColumn()" :disabled="groups.length === 1">Remove Column</button>
        <button @click="addColumn()">Add Column</button>
      </div>
      <div>
        <label v-for="(enabled, name) in logs" :key="name">
          <input type="checkbox" v-model="logs[name]"> {{ name }}
        </label>
        <hr>
        <label>
          <input type="checkbox" v-model="logPayload"> Log payload
        </label>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: string
  data: string
}

interface Flags {
  drop: boolean
  animate: boolean
}

let i = 0

function id () {
  return `item-${++i}`
}

function generate (num: number): Item[] {
  return generateItems(5, i => ({
    id: id(),
    data: `Draggable ${num} - ${i + 1}`,
  }))
}

const groups = ref<Item[][]>([])
const flags = ref<Flags[]>([])

const logs = reactive<Record<string, boolean>>({
  'get-child-payload': true,
  'should-accept-drop': false,
  'should-animate-drop': false,
  'drag-start': true,
  'drag-end': true,
  'drag-enter': true,
  'drag-leave': true,
  'drop': true,
})

const logPayload = ref(true)

// -----------------------------------------------------------------------------------------------------------------
// callbacks

function getChildPayload (groupIndex: number, itemIndex: number) {
  log('get-child-payload', groupIndex, itemIndex)
  return groups.value[groupIndex][itemIndex]
}

function getShouldAcceptDrop (index: number, sourceContainerOptions: unknown, payload: unknown) {
  log('should-accept-drop', sourceContainerOptions, payload)
  return flags.value[index].drop
}

function getShouldAnimateDrop (index: number, sourceContainerOptions: unknown, payload: unknown) {
  log('should-animate-drop', sourceContainerOptions, payload)
  return flags.value[index].animate
}

// -----------------------------------------------------------------------------------------------------------------
// events

function onDragStart (...args: unknown[]) {
  log('drag-start', ...args)
}

function onDragEnd (...args: unknown[]) {
  log('drag-end', ...args)
}

function onDragEnter (...args: unknown[]) {
  log('drag-enter', ...args)
}

function onDragLeave (...args: unknown[]) {
  log('drag-leave', ...args)
}

function onDrop (groupIndex: number, dropResult: DragResult) {
  // Vue 3 proxies arrays, so plain index assignment is reactive (no Vue.set)
  groups.value[groupIndex] = applyDrag(groups.value[groupIndex], dropResult)
  log('drop', dropResult)
}

// -----------------------------------------------------------------------------------------------------------------
// app

function addColumn () {
  groups.value.push(generate(groups.value.length + 1))
  flags.value.push({ drop: true, animate: true })
}

function removeColumn () {
  groups.value.pop()
  flags.value.pop()
}

function log (name: string, ...args: unknown[]) {
  if (logs[name]) {
    logPayload.value
      ? console.log(name, ...args)
      : console.log(name)
  }
}

addColumn()
</script>

<style scoped>

  .controls {
    margin-top: 1em;
  }

  .controls > div {
    padding-top: 1em;
  }

  label {
    display: block;
    line-height: 1.6em;
  }

  .columns {
    display: flex;
    justify-content: stretch;
  }

  .column {
    margin-right: 20px;
    flex: 1;
  }

  .column {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .column .smooth-dnd-container.vertical {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

</style>
