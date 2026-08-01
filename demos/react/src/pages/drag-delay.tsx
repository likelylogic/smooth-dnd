import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: number
  data: string
}

/** `dragBeginDelay` — the long-press behaviour that makes touch scrolling usable. */
export default function DragDelay () {
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
        <Container
          dragBeginDelay={500}
          dragClass="form-ghost"
          dropClass="form-ghost-drop"
          onDrop={onDrop}
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
    </div>
  )
}
