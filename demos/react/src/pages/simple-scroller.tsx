import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: number
  data: string
}

/**
 * The same sortable as `simple`, but in a fixed-height scrolling parent, so the
 * list auto-scrolls as you drag near an edge.
 */
export default function SimpleScroller () {
  const [items, setItems] = useState<Item[]>(() => generateItems(50, index => ({
    id: index,
    data: 'Draggable' + index,
  })))

  const onDrop = useCallback((result: DropResult) => {
    setItems(items => applyDrag(items, result))
  }, [])

  return (
    <div>
      <div className="simple-page-scroller">
        <Container onDrop={onDrop}>
          {items.map(p => (
            <Draggable key={p.id}>
              <div className="draggable-item">
                {p.data}
              </div>
            </Draggable>
          ))}
        </Container>
      </div>
    </div>
  )
}
