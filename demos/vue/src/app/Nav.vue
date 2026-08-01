<script setup lang="ts">
import { computed } from 'vue'
import { navigation } from '@demo/shared'

const props = defineProps<{
  /** Whether the nav is expanded; owned by App.vue. */
  open: boolean
}>()

defineEmits<{
  toggle: []
}>()

const openClass = computed(() => props.open ? 'open' : 'closed')
</script>

<template>
  <!-- the hamburger is position: fixed, so it sits outside the collapsing panel -->
  <div class="nav-button" :class="openClass" @click="$emit('toggle')">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>

  <div class="nav" :class="openClass">
    <div class="nav-content">
      <div class="nav-header">
        <h3>vue-smooth-dnd</h3>
        <div class="divider"></div>
      </div>
      <div>
        <div v-for="section in navigation" :key="section.title" class="menu-section">
          <h4>{{ section.title }}</h4>
          <ul>
            <!-- custom render, so the active class lands on the <li> rather than an <a> -->
            <router-link
              v-for="page in section.pages"
              :key="page.name"
              :to="`/${page.name}`"
              custom
              v-slot="{ navigate, isActive }"
            >
              <li :class="{ 'router-link-active': isActive }" :title="page.description" @click="navigate">
                {{ page.title }}
              </li>
            </router-link>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
