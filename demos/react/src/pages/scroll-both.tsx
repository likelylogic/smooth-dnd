import { useCallback, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: string
  data: string
}

const groupStyle: CSSProperties = {
  marginLeft: '50px',
  flex: 1,
}

/**
 * The containers sit in a viewport that scrolls on both axes, so auto-scroll
 * has to track horizontal and vertical overflow at the same time.
 */
export default function ScrollBoth () {
  const [items1, setItems1] = useState<Item[]>(() => generateItems(45, i => ({
    id: '1' + i,
    data: `Source Draggable - ${i}`,
  })))
  const [items2, setItems2] = useState<Item[]>(() => generateItems(45, i => ({
    id: '2' + i,
    data: `Draggable 2 - ${i}`,
  })))
  const [items3, setItems3] = useState<Item[]>(() => generateItems(45, i => ({
    id: '3' + i,
    data: `Draggable 3 - ${i}`,
  })))

  const getPayload1 = useCallback((i: number) => items1[i], [items1])
  const getPayload2 = useCallback((i: number) => items2[i], [items2])
  const getPayload3 = useCallback((i: number) => items3[i], [items3])

  const onDrop1 = useCallback((e: DropResult) => setItems1(items => applyDrag(items, e)), [])
  const onDrop2 = useCallback((e: DropResult) => setItems2(items => applyDrag(items, e)), [])
  const onDrop3 = useCallback((e: DropResult) => setItems3(items => applyDrag(items, e)), [])

  return (
    <div style={{ height: '600px', width: '600px', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'stretch', marginTop: '50px', marginRight: '50px', height: '1000px', width: '1000px', overflow: 'auto' }}>
        <div style={groupStyle}>
          <Container groupName="1" behaviour="copy" getChildPayload={getPayload1} onDrop={onDrop1}>
            {items1.map((p, i) => (
              <Draggable key={i}>
                <div className="draggable-item">
                  {p.data}
                </div>
              </Draggable>
            ))}
          </Container>
        </div>
        <div style={groupStyle}>
          <Container groupName="1" getChildPayload={getPayload2} onDrop={onDrop2}>
            {items2.map((p, i) => (
              <Draggable key={i}>
                <div className="draggable-item">
                  {p.data}
                </div>
              </Draggable>
            ))}
          </Container>
        </div>
        <div style={groupStyle}>
          <Container groupName="1" getChildPayload={getPayload3} onDrop={onDrop3}>
            {items3.map(p => (
              <Draggable key={p.id}>
                <div className="draggable-item">
                  {p.data}
                </div>
              </Draggable>
            ))}
          </Container>
        </div>
      </div>
    </div>
  )
}
