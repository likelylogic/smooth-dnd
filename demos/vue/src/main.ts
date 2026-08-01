import { createApp } from 'vue'

// every stylesheet the demos need, shared with the React demo
import '@demo/shared/styles'

import router from './app/router'
import App from './app/App.vue'

createApp(App)
  .use(router)
  .mount('#app')
