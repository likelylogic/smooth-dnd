import { useCallback, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: string
  data: string
}

const groupStyle: CSSProperties = {
  margin: '50px',
  overflowX: 'auto',
}

/** `orientation: horizontal`. */
export default function SimpleHorizontal () {
  const [items, setItems] = useState<Item[]>(() => generateItems(15, i => ({
    id: '2' + i,
    data: `Draggable - ${i}`,
  })))

  const onDrop = useCallback((result: DropResult) => {
    setItems(items => applyDrag(items, result))
  }, [])

  return (
    <div>
      <div style={groupStyle}>
        <Container orientation="horizontal" onDrop={onDrop}>
          {items.map(p => (
            <Draggable key={p.id}>
              <div className="draggable-item-horizontal">
                {p.data}
              </div>
            </Draggable>
          ))}
        </Container>
      </div>
    </div>
  )
}
