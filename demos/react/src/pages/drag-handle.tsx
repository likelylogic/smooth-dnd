import { useCallback, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: number
  data: string
}

const handleStyle: CSSProperties = {
  float: 'left',
  padding: '0 10px',
}

/** `dragHandleSelector` — only the grip starts a drag. */
export default function DragHandle () {
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
        <Container dragHandleSelector=".column-drag-handle" onDrop={onDrop}>
          {items.map(p => (
            <Draggable key={p.id}>
              <div className="draggable-item">
                <span className="column-drag-handle" style={handleStyle}>&#x2630;</span>
                {p.data}
              </div>
            </Draggable>
          ))}
        </Container>
      </div>
    </div>
  )
}
