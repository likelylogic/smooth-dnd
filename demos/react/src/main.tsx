import { createRoot } from 'react-dom/client'

import '@demo/shared/styles'

import App from './app/App'

// note: intentionally not wrapped in <React.StrictMode>; smooth-dnd attaches
// imperatively in componentDidMount, and StrictMode's double mount/unmount in
// development re-initialises the containers twice.
createRoot(document.getElementById('root')!).render(<App />)
