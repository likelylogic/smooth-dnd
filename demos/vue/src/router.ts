import { createRouter, createWebHistory } from 'vue-router'
import navigation from './navigation'

// convert navigation to routes
const routes = navigation.reduce((routes, section) => {
  section.pages.forEach(page => {
    const name = page.name
    routes.push({
      name,
      path: `/${name}`,
      component: page.component,
      meta: {
        title: page.title
      }
    })
  })
  return routes
}, [])

// set up router
export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/cards'
    },
    ...routes
  ]
})
