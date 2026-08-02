<template>
  <div class="simple-page">
    <p class="drop-hint">
      The middle of a folder accepts a drop <em>into</em> it; the edges still insert between items.
      Both are reported by the library — the highlight and the line are drawn by this page.
    </p>

    <Container
      drop-feedback="indicator"
      :drop-on-items="true"
      :get-child-payload="index => nodes[index]"
      @drop-ready="onDropReady"
      @drop="onDrop"
      @drag-leave="target = null"
    >
      <Draggable v-for="node in nodes" :key="node.id">
        <div class="tree-node" :style="{ paddingLeft: `${12 + node.depth * 20}px` }">
          <span class="tree-node__icon">{{ node.kind === 'folder' ? '▸' : '·' }}</span>
          {{ node.name }}
        </div>
      </Draggable>

      <div v-if="indicator && kind === 'into'" class="drop-into" :style="boxStyle" />
      <div v-else-if="indicator" class="drop-line" :style="lineStyle" />
    </Container>

    <dl class="drop-readout">
      <dt>target</dt>
      <dd>{{ target ? `${target.kind} ${target.index}` : '—' }}</dd>
      <dt>last drop</dt>
      <dd>{{ lastDrop }}</dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { smoothDnD, type DropCompleteResult, type DropIndicator, type DropResult, type DropTarget } from '@likelylogic/smooth-dnd'
import { applyDrag, type DragResult } from '@demo/shared'

interface Node {
  id: string
  name: string
  kind: 'folder' | 'file'
  depth: number
}

function build (): Node[] {
  return [
    { id: 'n0', name: 'Projects', kind: 'folder', depth: 0 },
    { id: 'n1', name: 'smooth-dnd', kind: 'folder', depth: 1 },
    { id: 'n2', name: 'readme.md', kind: 'file', depth: 2 },
    { id: 'n3', name: 'changelog.md', kind: 'file', depth: 2 },
    { id: 'n4', name: 'Archive', kind: 'folder', depth: 1 },
    { id: 'n5', name: 'notes.txt', kind: 'file', depth: 0 },
    { id: 'n6', name: 'todo.txt', kind: 'file', depth: 0 },
  ]
}

const nodes = ref<Node[]>(build())
const indicator = ref<DropIndicator | null>(null)
const target = ref<DropTarget | null>(null)
const lastDrop = ref('—')

const kind = computed(() => target.value?.kind)

const boxStyle = computed(() => {
  const box = indicator.value!.relative
  return {
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  }
})

const lineStyle = computed(() => {
  const box = indicator.value!.relative
  return {
    top: `${box.top + box.height / 2}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
  }
})

function onDropReady (result: DropResult) {
  indicator.value = result.dropIndicator ?? null
  target.value = result.dropTarget ?? null
}

function onDrop (dropResult: DragResult) {
  const landedInto = target.value?.kind === 'into'
  const intoIndex = target.value?.index

  indicator.value = null
  target.value = null

  // A drop *into* a node has no insertion index — the library reports which node was landed on,
  // and re-parenting is the application's business.
  if (landedInto && intoIndex !== undefined) {
    const moved = nodes.value[dropResult.removedIndex!]
    const parent = nodes.value[intoIndex]
    if (moved && parent && moved !== parent) {
      const next = [...nodes.value]
      next.splice(dropResult.removedIndex!, 1)
      const parentAt = next.indexOf(parent)
      next.splice(parentAt + 1, 0, { ...moved, depth: parent.depth + 1 })
      nodes.value = next
    }
    return
  }

  nodes.value = applyDrag(nodes.value, dropResult)
}

const off = smoothDnD.onDropComplete((result: DropCompleteResult) => {
  lastDrop.value = result.to
    ? `${result.action} — ${result.to.kind} ${result.to.index}`
    : `${result.action}`
})
onBeforeUnmount(off)
</script>
