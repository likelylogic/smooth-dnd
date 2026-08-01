<template>
  <div class="app">

    <div class="nav-button" :class="openClass" @click="toggleNav()">
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
          <div v-for="section in pages" :key="section.title" class="menu-section">
            <h4>{{ section.title }}</h4>
            <ul>
              <router-link v-for="page in section.pages"
                :key="page.name"
                :to="`/${page.name}`"
                custom
                v-slot="{ navigate, isActive }"
              >
                <li :class="{ 'router-link-active': isActive }" @click="navigate">{{ page.title }}</li>
              </router-link>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="header" :class="openClass">
        {{ $route.meta.title }}
        <div class="source-code" @click="openCode()">
          <img
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZml0PSIiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIGZvY3VzYWJsZT0iZmFsc2UiPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ij48L3BhdGg+CiAgICA8cGF0aCBkPSJNOS40IDE2LjZMNC44IDEybDQuNi00LjZMOCA2bC02IDYgNiA2IDEuNC0xLjR6bTUuMiAwbDQuNi00LjYtNC42LTQuNkwxNiA2bDYgNi02IDYtMS40LTEuNHoiIGZpbGw9IiNGRkYiPjwvcGF0aD4KPC9zdmc+Cg=="
            alt=""/>
          <span>source</span>
        </div>
      </div>
      <div class="demo">
        <router-view></router-view>
      </div>
    </div>

  </div>
</template>

<script>
import pages from './config/navigation'

export default {
  name: 'Demo',

  data () {
    return {
      pages,
      isNavOpen: true
    }
  },

  computed: {
    openClass () {
      return this.isNavOpen ? 'open' : 'closed'
    }
  },

  methods: {
    toggleNav () {
      this.isNavOpen = !this.isNavOpen
    },

    openCode () {
      const name = this.$route.name
      if (!name) {
        return
      }
      const url = `https://github.com/likelylogic/smooth-dnd/tree/master/demos/vue/src/pages/${name}.vue`
      window.open(url, '_blank')
    }
  }
}
</script>
