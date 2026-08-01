import { useCallback, useMemo, useState } from 'react'
import { defaultPage, pages as manifest } from '@demo/shared'

import Header from './Header'
import Nav from './Nav'
import pages from './pages'

/**
 * The demo shell.
 *
 * The Vue demo uses vue-router; this has no router, so the selected page is
 * plain state. Both read the same `@demo/shared` manifest, so the two demos
 * always offer the same pages in the same order.
 */
export default function App () {
  // the nav's open state lives here, because both the nav and the header are
  // laid out around it
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [selected, setSelected] = useState(defaultPage)

  const toggleNav = useCallback(() => setIsNavOpen(open => !open), [])

  const page = useMemo(() => {
    const found = manifest.find(candidate => candidate.name === selected)
    if (!found) {
      throw new Error(`Demo page "${selected}" is not in the shared navigation manifest`)
    }
    return found
  }, [selected])

  const Page = pages[page.name]
  if (!Page) {
    // matches the Vue router's startup check: a page listed in the shared
    // manifest but never implemented should fail loudly, not silently
    throw new Error(`Demo page "${page.name}" is listed in the shared navigation, but is not registered in demos/react/src/app/pages.ts`)
  }

  return (
    <div className="app">

      <Nav
        selected={selected}
        open={isNavOpen}
        onSelect={setSelected}
        onToggle={toggleNav}
      />

      <div className="content">
        <Header page={page} open={isNavOpen}/>
        <div className="demo">
          <Page/>
        </div>
      </div>

    </div>
  )
}
