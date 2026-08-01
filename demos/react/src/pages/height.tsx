import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: number
  data: string
  height: string
}

/** Randomised item heights, which exercises the layout maths harder than uniform rows. */
export default function Height () {
  const [items, setItems] = useState<Item[]>(() => generateItems(50, index => ({
    id: index,
    data: 'Draggable' + index,
    height: `${(40 + Math.random() * 200).toFixed()}px`,
  })))

  const onDrop = useCallback((result: DropResult) => {
    setItems(items => applyDrag(items, result))
  }, [])

  return (
    <div>
      <div className="simple-page">
        <Container onDrop={onDrop}>
          {items.map(p => (
            <Draggable key={p.id}>
              <div className="draggable-item" style={{ height: p.height }}>
                {p.data}
              </div>
            </Draggable>
          ))}
        </Container>
      </div>
    </div>
  )
}
