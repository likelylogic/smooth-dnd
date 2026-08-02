<template>
  <Container
    class="drop-out"
    :class="{ 'is-active': isOver }"
    group-name="drop-out"
    behaviour="drop-zone"
    @drop="onDropOut"
    @drag-enter="isOver = true"
    @drag-leave="isOver = false"
  >
    <!--
      Plain divs, not <Draggable>s. They are still counted as this container's
      children internally, but `behaviour: drop-zone` never sorts, and without
      the wrapper class a mousedown on them can't start a drag.
    -->
    <div class="drop-out__lists">
      <div v-for="(list, listIndex) in lists" :key="listIndex" class="drop-out__list">
        <h4 class="drop-out__heading">List {{ listIndex + 1 }}</h4>
        <Container
          group-name="drop-out"
          :get-child-payload="index => lists[listIndex][index]"
          @drop="onDropInList(listIndex, $event)"
        >
          <Draggable v-for="item in list" :key="item.id">
            <div class="draggable-item">{{ item.data }}</div>
          </Draggable>
        </Container>
      </div>
    </div>

    <div class="drop-out__aside">
      <h4 class="drop-out__heading">
        Dropped out
        <button v-if="detached.length" class="drop-out__reset" @click="reset">reset</button>
      </h4>
      <p v-if="!detached.length" class="drop-out__hint">
        Drag an item off a list and release it anywhere in the dashed area.
      </p>
      <ul class="drop-out__detached">
        <li v-for="item in detached" :key="item.id">{{ item.data }}</li>
      </ul>

      <h4 class="drop-out__heading">Drop events</h4>
      <ol class="drop-out__log">
        <li v-for="(entry, i) in log" :key="i">{{ entry }}</li>
      </ol>
    </div>
  </Container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: string
  data: string
}

function build () {
  return [
    generateItems<Item>(6, i => ({ id: `a${i}`, data: `Item A${i}` })),
    generateItems<Item>(6, i => ({ id: `b${i}`, data: `Item B${i}` })),
  ]
}

const lists = ref<Item[][]>(build())
const detached = ref<Item[]>([])
const isOver = ref(false)
const log = ref<string[]>([])

function note (message: string) {
  log.value = [message, ...log.value].slice(0, 8)
}

function onDropInList (listIndex: number, dropResult: DragResult) {
  const { removedIndex, addedIndex } = dropResult
  if (removedIndex === null && addedIndex === null) {
    return
  }
  note(`list ${listIndex + 1} — removed: ${removedIndex}, added: ${addedIndex}`)
  lists.value[listIndex] = applyDrag(lists.value[listIndex], dropResult)
}

function onDropOut (dropResult: DragResult) {
  isOver.value = false

  // The surrounding zone fires for every drop, including ones that landed on a
  // list — those arrive with both indices null and are not ours to handle.
  if (dropResult.addedIndex === null) {
    return
  }

  note(`surround — added: ${dropResult.addedIndex} (always 0)`)
  if (dropResult.payload) {
    detached.value = [...detached.value, dropResult.payload as Item]
  }
}

function reset () {
  lists.value = build()
  detached.value = []
  log.value = []
}
</script>
