<template>
  <div style="display: flex; justify-content: stretch; height: 100%">

    <div class="dynamic-left-pane">
      <div class="dynamic-container-holder">
        <Container
          group-name="1"
          :get-ghost-parent="getGhostParent"
          :get-child-payload="index => lists.items1[index]"
          @drop="onDrop('items1', $event)"
        >
          <Draggable v-for="item in lists.items1" :key="item.id">
            <div class="draggable-item">
              {{ item.data }}
            </div>
          </Draggable>
        </Container>
      </div>
    </div>

    <div class="dynamic-right-pane">
      <div class="dynamic-menu-container">

        <!-- always mounted, but hidden until hovered -->
        <div
          class="popup-container-button"
          @mouseenter="popup1Open = true"
          @mouseleave="popup1Open = false"
        >
          Make Container Visible
          <div :class="['popup-container', { open: popup1Open }, preventAutoScrollClass]">
            <div class="dynamic-container-holder">
              <Container
                group-name="1"
                :get-ghost-parent="getGhostParent"
                :get-child-payload="index => lists.items2[index]"
                @drop="onDrop('items2', $event)"
              >
                <Draggable v-for="item in lists.items2" :key="item.id">
                  <div class="draggable-item">
                    {{ item.data }}
                  </div>
                </Draggable>
              </Container>
            </div>
          </div>
        </div>

        <!-- mounted and unmounted on hover -->
        <div
          class="popup-container-button"
          @mouseenter="popup2Open = true"
          @mouseleave="popup2Open = false"
        >
          Mount New Container
          <div v-if="popup2Open" class="popup-container open">
            <div class="dynamic-container-holder">
              <Container
                group-name="1"
                :get-ghost-parent="getGhostParent"
                :get-child-payload="index => lists.items3[index]"
                @drop="onDrop('items3', $event)"
              >
                <Draggable v-for="item in lists.items3" :key="item.id">
                  <div class="draggable-item">
                    {{ item.data }}
                  </div>
                </Draggable>
              </Container>
            </div>
          </div>
        </div>

      </div>

      <div class="dynamic-right-content">
        <div class="dynamic-container-holder">
          <Container
            group-name="1"
            :get-ghost-parent="getGhostParent"
            :get-child-payload="index => lists.items4[index]"
            @drop="onDrop('items4', $event)"
          >
            <Draggable v-for="item in lists.items4" :key="item.id">
              <div class="draggable-item">
                {{ item.data }}
              </div>
            </Draggable>
          </Container>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Container, Draggable, constants } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: string
  data: string
}

type ListName = 'items1' | 'items2' | 'items3' | 'items4'

/** Opting the popup out of auto-scroll, so dragging in it doesn't scroll the pane behind. */
const preventAutoScrollClass = constants.preventAutoScrollClass

const lists = reactive<Record<ListName, Item[]>>({
  items1: generateItems(45, i => ({ id: '1' + i, data: `Draggable 1 - ${i}` })),
  items2: generateItems(25, i => ({ id: '2' + i, data: `Draggable 2 - ${i}` })),
  items3: generateItems(25, i => ({ id: '3' + i, data: `Draggable 3 - ${i}` })),
  items4: generateItems(25, i => ({ id: '4' + i, data: `Draggable 4 - ${i}` })),
})

const popup1Open = ref(false)
const popup2Open = ref(false)

function getGhostParent () {
  return document.body
}

function onDrop (listName: ListName, dropResult: DragResult) {
  lists[listName] = applyDrag(lists[listName], dropResult)
}
</script>
