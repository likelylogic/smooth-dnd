<template>
  <div>
    <div class="simple-page">
      <Container group-name="1" :get-child-payload="getChildPayload" @drop="onDrop">
        <Draggable v-for="(p, i) in items" :key="i">

          <div v-if="p.type === 'draggable'" class="draggable-item">{{ p.data }}</div>

          <div v-else :style="boxStyle('#fff')">
            <h4 style="text-align: center">Nested Sortable List - {{ p.id }}</h4>
            <div style="cursor: default">
              <Container
                group-name="1"
                :get-child-payload="index => p.items?.[index]"
                @drop="onDrop2(i, $event)"
              >
                <Draggable v-for="(q, j) in p.items" :key="j">

                  <div v-if="q.type === 'draggable'" class="draggable-item" style="background-color: cornsilk">
                    {{ q.data }}
                  </div>

                  <div v-else :style="boxStyle('cornsilk')">
                    <h4 style="text-align: center">Nested Sortable List - {{ q.id }}</h4>
                    <div style="cursor: default">
                      <Container
                        group-name="1"
                        :get-child-payload="index => q.items?.[index]"
                        @drop="onDrop3(i, j, $event)"
                      >
                        <Draggable v-for="(t, y) in q.items" :key="y">
                          <div class="draggable-item" style="background-color: ghostwhite">
                            {{ t.data }}
                          </div>
                        </Draggable>
                      </Container>
                    </div>
                  </div>

                </Draggable>
              </Container>
            </div>
          </div>

        </Draggable>
      </Container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type CSSProperties } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface NestedItem {
  id: string
  type: 'draggable' | 'container'
  data?: string
  items?: NestedItem[]
}

function build (): NestedItem[] {
  const items = generateItems<NestedItem>(30, i => ({
    id: 'item1 ' + i,
    type: 'draggable',
    data: `Container 1 Draggable - ${i}`,
  }))

  const items2 = generateItems<NestedItem>(10, i => ({
    id: 'item2 ' + i,
    type: 'draggable',
    data: `Container 2 Draggable - ${i}`,
  }))

  items2[3] = {
    ...items2[3],
    type: 'container',
    items: generateItems<NestedItem>(4, i => ({
      id: 'item2 sub' + i,
      type: 'draggable',
      data: `Container 4 Draggable - ${i}`,
    })),
  }

  const items3 = generateItems<NestedItem>(4, i => ({
    id: 'item3 ' + i,
    type: 'draggable',
    data: `Container 3 Draggable - ${i}`,
  }))

  items[5] = {
    ...items[5],
    type: 'container',
    items: items2,
  }

  items[9] = {
    ...items[9],
    type: 'container',
    items: items3,
  }

  return items
}

const items = ref<NestedItem[]>(build())

/** The wrapper around a nested container — a draggable box in its own right. */
function boxStyle (backgroundColor: string): CSSProperties {
  return {
    padding: '20px 20px',
    marginTop: '2px',
    marginBottom: '2px',
    border: '1px solid rgba(0,0,0,.125)',
    backgroundColor,
    cursor: 'move',
  }
}

function getChildPayload (index: number) {
  return items.value[index]
}

function onDrop (dropResult: DragResult) {
  console.log('level 1: Drop')
  items.value = applyDrag(items.value, dropResult)
}

function onDrop2 (id: number, dropResult: DragResult) {
  console.log('level 2: Drop')
  const newItems = [...items.value]
  newItems[id].items = applyDrag(newItems[id].items!, dropResult)
  items.value = newItems
}

function onDrop3 (id1: number, id2: number, dropResult: DragResult) {
  console.log('level 3: Drop')
  const newItems = [...items.value]
  newItems[id1].items![id2].items = applyDrag(
    newItems[id1].items![id2].items!,
    dropResult,
  )
  items.value = newItems
}
</script>
