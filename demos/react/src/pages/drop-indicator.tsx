import { useCallback, useEffect, useState } from 'react'
import { Container, Draggable } from '@likelylogic/react-smooth-dnd'
import { smoothDnD, type DropCompleteResult, type DropIndicator, type DropResult } from '@likelylogic/smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: string
  data: string
}

/**
 * `dropFeedback: 'indicator'` — nothing slides out of the way. The library reports where the item
 * would land, and this page renders the line from those bounds.
 */
export default function DropIndicatorPage () {
  const [items, setItems] = useState<Item[]>(() => generateItems(8, i => ({ id: `i${i}`, data: `Item ${i}` })))
  const [indicator, setIndicator] = useState<DropIndicator | null>(null)
  const [lastDrop, setLastDrop] = useState('—')

  const onDropReady = useCallback((result: DropResult) => {
    setIndicator(result.dropIndicator ?? null)
  }, [])

  const onDrop = useCallback((dropResult: DragResult) => {
    setIndicator(null)
    setItems(items => applyDrag(items, dropResult))
  }, [])

  // onDropComplete is global — a drag spans containers, so no single one of them owns the outcome.
  useEffect(() => smoothDnD.onDropComplete((result: DropCompleteResult) => {
    setLastDrop(`${result.action}: ${result.from?.index} → ${result.to?.index ?? '—'}`)
  }), [])

  const box = indicator?.relative
  const readout = box
    ? `top ${Math.round(box.top)}, left ${Math.round(box.left)}, ${Math.round(box.width)} × ${Math.round(box.height)}`
    : '—'

  return (
    <div className="simple-page">
      <p className="drop-hint">
        Nothing slides out of the way. The library reports where the item would land, and the line
        below is rendered by this page from those bounds.
      </p>

      <Container
        dropFeedback="indicator"
        getChildPayload={index => items[index]}
        onDropReady={onDropReady}
        onDrop={onDrop}
        onDragLeave={() => setIndicator(null)}
      >
        {items.map(item => (
          <Draggable key={item.id}>
            <div className="draggable-item">{item.data}</div>
          </Draggable>
        ))}

        {box && (
          <div
            className="drop-line"
            style={{ top: box.top + box.height / 2, left: box.left, width: box.width }}
          />
        )}
      </Container>

      <dl className="drop-readout">
        <dt>bounds</dt>
        <dd>{readout}</dd>
        <dt>last drop</dt>
        <dd>{lastDrop}</dd>
      </dl>
    </div>
  )
}
