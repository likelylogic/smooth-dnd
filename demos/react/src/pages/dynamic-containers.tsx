import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { Container, Draggable, constants, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: string
  data: string
}

const makeItems = (group: number, count: number) => generateItems<Item>(count, i => ({
  id: group + '' + i,
  data: `Draggable ${group} - ${i}`,
}))

/**
 * Containers created and destroyed at runtime, including inside popups.
 *
 * `getGhostParent` puts the ghost on `document.body` so it isn't clipped by the
 * popup it was dragged out of, and `preventAutoScrollClass` stops the popup
 * itself being treated as a scroll target.
 */
export default function DynamicContainers () {
  const [items1, setItems1] = useState<Item[]>(() => makeItems(1, 45))
  const [items2, setItems2] = useState<Item[]>(() => makeItems(2, 25))
  const [items3, setItems3] = useState<Item[]>(() => makeItems(3, 25))
  const [items4, setItems4] = useState<Item[]>(() => makeItems(4, 25))
  const [popup1Open, setPopup1Open] = useState(false)
  const [popup2Open, setPopup2Open] = useState(false)

  const getGhostParent = useCallback(() => document.body, [])

  const renderContainer = (
    items: Item[],
    setItems: Dispatch<SetStateAction<Item[]>>,
    autoScroll = true,
  ) => (
    <div className="dynamic-container-holder">
      <Container
        autoScrollEnabled={autoScroll}
        getGhostParent={getGhostParent}
        groupName="1"
        getChildPayload={(i: number) => items[i]}
        onDrop={(e: DropResult) => setItems(items => applyDrag(items, e))}
      >
        {items.map(p => (
          <Draggable key={p.id}>
            <div className="draggable-item">
              {p.data}
            </div>
          </Draggable>
        ))}
      </Container>
    </div>
  )

  return (
    <div style={{ display: 'flex', justifyContent: 'stretch', height: '100%' }}>
      <div className="dynamic-left-pane">
        {renderContainer(items1, setItems1)}
      </div>
      <div className="dynamic-right-pane">
        <div className="dynamic-menu-container">
          <div
            className="popup-container-button"
            onMouseEnter={() => setPopup1Open(true)}
            onMouseLeave={() => setPopup1Open(false)}
          >
            Make Container Visible
            <div className={`popup-container ${popup1Open ? 'open' : ''}  ${constants.preventAutoScrollClass}`}>
              {renderContainer(items2, setItems2)}
            </div>
          </div>
          <div
            className="popup-container-button"
            onMouseEnter={() => setPopup2Open(true)}
            onMouseLeave={() => setPopup2Open(false)}
          >
            Mount New Container
            {popup2Open
              ? (
                  <div className={`popup-container ${popup2Open ? 'open' : ''}`}>
                    {renderContainer(items3, setItems3)}
                  </div>
                )
              : null}
          </div>
        </div>
        <div className="dynamic-right-content">
          {renderContainer(items4, setItems4)}
        </div>
      </div>
    </div>
  )
}
