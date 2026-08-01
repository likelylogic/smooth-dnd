import { navigation } from '@demo/shared'

export interface NavProps {
  /** `name` of the page currently being shown. */
  selected: string
  /** Whether the nav is expanded; drives the `.open` / `.closed` class. */
  open: boolean
  onSelect: (name: string) => void
}

/**
 * The sidebar menu, built from the shared `navigation` manifest.
 *
 * The Vue demo wraps each item in a `<router-link>`; the React demo has no
 * router, so selection is lifted to `App` and passed back down.
 */
export default function Nav ({ selected, open, onSelect }: NavProps) {
  return (
    <div className={`nav ${open ? 'open' : 'closed'}`}>
      <div className="nav-content">
        <div className="nav-header">
          <h3>react-smooth-dnd</h3>
          <div className="divider"></div>
        </div>
        <div>
          {navigation.map(section => (
            <div className="menu-section" key={section.title}>
              <h4>{section.title}</h4>
              <ul>
                {section.pages.map(page => (
                  <li
                    key={page.name}
                    className={page.name === selected ? 'selected' : ''}
                    onClick={() => onSelect(page.name)}
                  >
                    {page.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
