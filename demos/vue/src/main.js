import { createApp } from 'vue'

import './assets/layout.css'
import './assets/header.css'
import './assets/nav.css'
import './assets/demos.css'
import './assets/form.css'

import router from './config/router'
import Demo from './index.vue'

const app = createApp(Demo)

app.use(router)

// exposed for poking at from the console
window.app = app.mount('#app')
