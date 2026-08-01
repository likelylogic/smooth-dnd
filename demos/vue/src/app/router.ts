import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { defaultPage, pages } from '@demo/shared'

/**
 * Every demo page component, keyed by filename stem.
 *
 * The shared `navigation` manifest names pages but deliberately doesn't import
 * them, so this is where a name becomes a component. The glob is eager rather
 * than lazy: the demo is small, and loading everything up front means a page
 * listed in the manifest but not implemented here fails at startup rather than
 * silently on navigation.
 */
const modules = import.meta.glob<{ default: Component }>('../pages/*.vue', { eager: true })

const components = Object.entries(modules).reduce((output, [path, module]) => {
  const name = path.replace('../pages/', '').replace('.vue', '')
  output[name] = module.default
  return output
}, {} as Record<string, Component>)

const routes: RouteRecordRaw[] = pages.map(page => {
  const component = components[page.name]
  if (!component) {
    throw new Error(`Demo page "${page.name}" is listed in the shared navigation, but demos/vue/src/pages/${page.name}.vue does not exist`)
  }
  return {
    name: page.name,
    path: `/${page.name}`,
    component,
    meta: {
      title: page.title,
      description: page.description,
    },
  }
})

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: `/${defaultPage}`,
    },
    ...routes,
  ],
})
