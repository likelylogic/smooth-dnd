import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: number
  data: string
}

/** `dragClass` and `dropClass`, the styling hooks for the ghost. */
export default function DragClass () {
  const [items, setItems] = useState<Item[]>(() => generateItems(50, index => ({
    id: index,
    data: 'Draggable' + index,
  })))

  const onDrop = useCallback((result: DropResult) => {
    setItems(items => applyDrag(items, result))
  }, [])

  return (
    <div>
      <div className="simple-page">
        <Container dragClass="opacity-ghost" dropClass="opacity-ghost-drop" onDrop={onDrop}>
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
