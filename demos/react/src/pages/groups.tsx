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

const makeItems = (group: number) => generateItems<Item>(15, i => ({
  id: group + '' + i,
  data: `Draggable ${group} - ${i}`,
}))

/**
 * Four containers sharing a `groupName`, so items move between them.
 *
 * `getChildPayload` is what makes a cross-container move possible: the source
 * hands over the model object, and the target's `onDrop` receives it as
 * `payload`.
 */
export default function Groups () {
  const [items1, setItems1] = useState<Item[]>(() => makeItems(1))
  const [items2, setItems2] = useState<Item[]>(() => makeItems(2))
  const [items3, setItems3] = useState<Item[]>(() => makeItems(3))
  const [items4, setItems4] = useState<Item[]>(() => makeItems(4))

  const getPayload1 = useCallback((i: number) => items1[i], [items1])
  const getPayload2 = useCallback((i: number) => items2[i], [items2])
  const getPayload3 = useCallback((i: number) => items3[i], [items3])
  const getPayload4 = useCallback((i: number) => items4[i], [items4])

  const onDrop1 = useCallback((e: DropResult) => setItems1(items => applyDrag(items, e)), [])
  const onDrop2 = useCallback((e: DropResult) => setItems2(items => applyDrag(items, e)), [])
  const onDrop3 = useCallback((e: DropResult) => setItems3(items => applyDrag(items, e)), [])
  const onDrop4 = useCallback((e: DropResult) => setItems4(items => applyDrag(items, e)), [])

  const renderItems = (items: Item[]) => items.map(p => (
    <Draggable key={p.id}>
      <div className="draggable-item">
        {p.data}
      </div>
    </Draggable>
  ))

  return (
    <div style={{ display: 'flex', justifyContent: 'stretch', marginTop: '50px', marginRight: '50px' }}>
      <div style={groupStyle}>
        <Container groupName="1" getChildPayload={getPayload1} onDrop={onDrop1}>
          {renderItems(items1)}
        </Container>
      </div>
      <div style={groupStyle}>
        <Container groupName="1" getChildPayload={getPayload2} onDrop={onDrop2}>
          {renderItems(items2)}
        </Container>
      </div>
      <div style={groupStyle}>
        <Container groupName="1" getChildPayload={getPayload3} onDrop={onDrop3}>
          {renderItems(items3)}
        </Container>
      </div>
      <div style={groupStyle}>
        <Container groupName="1" getChildPayload={getPayload4} onDrop={onDrop4}>
          {renderItems(items4)}
        </Container>
      </div>
    </div>
  )
}
