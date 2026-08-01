import { useCallback } from 'react'
import type { DemoPage } from '@demo/shared'

/** The `<>` glyph on the "source" link, inlined so there's no asset to ship. */
const sourceIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZml0PSIiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIGZvY3VzYWJsZT0iZmFsc2UiPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ij48L3BhdGg+CiAgICA8cGF0aCBkPSJNOS40IDE2LjZMNC44IDEybDQuNi00LjZMOCA2bC02IDYgNiA2IDEuNC0xLjR6bTUuMiAwbDQuNi00LjYtNC42LTQuNkwxNiA2bDYgNi02IDYtMS40LTEuNHoiIGZpbGw9IiNGRkYiPjwvcGF0aD4KPC9zdmc+Cg=='

const sourceUrl = 'https://github.com/likelylogic/smooth-dnd/tree/main/demos/react/src/pages'

/**
 * `header.css` is shared with the Vue demo and sizes the bar for a single line
 * of text. The description is an extra line, so the box has to grow — these are
 * the only overrides needed, and they're kept here rather than in the shared
 * stylesheet so the Vue demo's header is untouched.
 */
const headerStyle = {
  height: 'auto',
  lineHeight: 1.3,
  paddingTop: '10px',
  paddingBottom: '12px',
}

const descriptionStyle = {
  fontSize: '13px',
  color: '#e2f4ec',
  marginTop: '4px',
}

export interface HeaderProps {
  page: DemoPage
  /** Whether the nav is expanded; drives the `.open` / `.closed` class. */
  open: boolean
}

/**
 * The green bar above the demo: page title, description, and a link to the
 * source of the page being shown.
 */
export default function Header ({ page, open }: HeaderProps) {
  const openCode = useCallback(() => {
    window.open(`${sourceUrl}/${page.name}.tsx`, '_blank')
  }, [page.name])

  return (
    <div className={`header ${open ? 'open' : 'closed'}`} style={headerStyle}>
      <div className="source-code" onClick={openCode}>
        <img src={sourceIcon} alt=""/>
        <span>source</span>
      </div>
      <div>{page.title}</div>
      <div style={descriptionStyle}>{page.description}</div>
    </div>
  )
}
