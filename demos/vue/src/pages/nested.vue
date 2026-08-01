<template>
  <div class="simple-page">
    <Container @drop="onDrop($event)">
      <Draggable v-for="item in items" :key="item.id">
        <div v-if="item.type === 'draggable'" class="draggable-item">
          {{item.data}}
        </div>
        <div v-if="item.type === 'container'">
          <div :style="innerContainerStyle">
            <h4>Sortable List</h4>
            <div class="no-cursor">
              <Container @drop="onInnerDrop(item, $event)">
                <Draggable v-for="q in item.items" :key="q.id">
                  <div v-if="q.type === 'draggable'" class="draggable-item">
                    {{q.data}}
                  </div>
                  <div v-if="q.type === 'container'">
                    <div :style="innerContainerStyle">
                      <h4>Sortable List</h4>
                      <div class="no-cursor">
                        <Container @drop="onInnerDrop2(item, q, $event)">
                          <Draggable v-for="t in q.items" :key="t.id">
                            <div class="draggable-item">
                              {{t.data}}
                            </div>
                          </Draggable>
                        </Container>
                      </div>
                    </div>
                  </div>
                </Draggable>
              </Container>
            </div>
          </div>
        </div>
      </Draggable>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, type CSSProperties } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface NestedItem {
  id: number
  type: 'draggable' | 'container'
  data?: string
  items?: NestedItem[]
}

function build (): NestedItem[] {
  const items = generateItems<NestedItem>(30, i => ({
    id: i,
    type: 'draggable',
    data: `Container 1 Draggable - ${i}`,
  }))

  const items2 = generateItems<NestedItem>(10, i => ({
    id: i,
    type: 'draggable',
    data: `Container 2 Draggable - ${i}`,
  }))

  const items3 = generateItems<NestedItem>(4, i => ({
    id: i,
    type: 'draggable',
    data: `Container 3 Draggable - ${i}`,
  }))

  items[5] = {
    id: 5,
    type: 'container',
    items: items2,
  }

  items[5].items![3] = {
    id: 3,
    type: 'container',
    items: generateItems<NestedItem>(4, i => ({
      id: i,
      type: 'draggable',
      data: `Container 4 Draggable - ${i}`,
    })),
  }

  items[9] = {
    id: 9,
    type: 'container',
    items: items3,
  }

  return items
}

const items = ref<NestedItem[]>(build())

const innerContainerStyle: CSSProperties = {
  padding: '20px 20px',
  marginTop: '2px',
  marginBottom: '2px',
  border: '1px solid rgba(0,0,0,.125)',
  backgroundColor: '#f4f5f9aa',
  cursor: 'move',
}

function onDrop (dropResult: DragResult) {
  items.value = applyDrag(items.value, dropResult)
}

function onInnerDrop (item: NestedItem, dropResult: DragResult) {
  const newItems = [...items.value]
  const index = newItems.indexOf(item)
  newItems[index].items = applyDrag(newItems[index].items!, dropResult)
  items.value = newItems
}

function onInnerDrop2 (item: NestedItem, item2: NestedItem, dropResult: DragResult) {
  const newItems = [...items.value]
  const index = newItems.indexOf(item)
  const index2 = item.items!.indexOf(item2)
  newItems[index].items![index2].items = applyDrag(
    newItems[index].items![index2].items!,
    dropResult,
  )
  items.value = newItems
}
</script>

<style lang="css" scoped>
  .no-cursor {
    cursor: default;
  }
</style>
