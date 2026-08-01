<script setup lang="ts">
import { ref } from 'vue'
import Header from './Header.vue'
import Nav from './Nav.vue'

// the nav's open state lives here, because both the nav and the header are
// laid out around it
const isNavOpen = ref(true)

function toggleNav () {
  isNavOpen.value = !isNavOpen.value
}
</script>

<template>
  <div class="app">

    <Nav :open="isNavOpen" @toggle="toggleNav" />

    <div class="content">
      <Header :open="isNavOpen" />
      <div class="demo">
        <router-view />
      </div>
    </div>

  </div>
</template>
