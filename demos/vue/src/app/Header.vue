<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  /** Whether the nav is expanded; the header's padding tracks it. */
  open: boolean
}>()

const route = useRoute()

const openClass = computed(() => props.open ? 'open' : 'closed')
const title = computed(() => route.meta.title as string | undefined)
const description = computed(() => route.meta.description as string | undefined)

function openCode () {
  const name = route.name
  if (!name) {
    return
  }
  const url = `https://github.com/likelylogic/smooth-dnd/tree/master/demos/vue/src/pages/${String(name)}.vue`
  window.open(url, '_blank')
}
</script>

<template>
  <div class="header" :class="openClass">
    <div class="source-code" @click="openCode()">
      <img
        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZml0PSIiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIGZvY3VzYWJsZT0iZmFsc2UiPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ij48L3BhdGg+CiAgICA8cGF0aCBkPSJNOS40IDE2LjZMNC44IDEybDQuNi00LjZMOCA2bC02IDYgNiA2IDEuNC0xLjR6bTUuMiAwbDQuNi00LjYtNC42LTQuNkwxNiA2bDYgNi02IDYtMS40LTEuNHoiIGZpbGw9IiNGRkYiPjwvcGF0aD4KPC9zdmc+Cg=="
        alt=""/>
      <span>source</span>
    </div>
    <div class="header-title">{{ title }}</div>
    <div v-if="description" class="header-description">{{ description }}</div>
  </div>
</template>

<style scoped>
  /* the shared header is a fixed-height single line; the description needs a
     second one, so relax the height here rather than in the shared stylesheet.
     Both state classes are named to out-specify `.header.open`. */
  .header.open,
  .header.closed {
    height: auto;
    line-height: 1.4;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .header.open .source-code,
  .header.closed .source-code {
    height: auto;
    line-height: 1.4;
  }

  .header-description {
    font-size: 13px;
    color: rgba(255, 255, 255, .85);
    margin-top: 2px;
  }
</style>
