import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: number
  data: string
}

/**
 * The Vue demo does this with scoped styles; React has no equivalent, so the
 * rules are inlined and namespaced under `.table-page`.
 *
 * `display: table-row !important` is the load-bearing one: smooth-dnd's
 * stylesheet sets `display: block` on `.smooth-dnd-draggable-wrapper`, which
 * would take the rows out of the table layout.
 */
const styles = `
  .table-page table {
    display: table;
    /* border-collapse: collapse does not work when rows are dragged (transformed) */
    border-collapse: separate;
  }

  .table-page tr {
    display: table-row !important;
  }

  .table-page tr[style*="transform"] {
    border-collapse: separate !important;
  }

  .table-page td {
    padding: 5px;
    border: 1px solid #CCC !important;
  }
`

/**
 * Dragging table rows, where the wrapper elements an adapter would normally
 * inject would break the layout.
 *
 * The Vue adapter has a `tag` prop for this; the React one doesn't, because
 * React already has a better answer — `render`. `Container`'s `render` is
 * handed the ref smooth-dnd needs on its root, so the `<tbody>` becomes the
 * container; `Draggable`'s `render` returns a `<tr>`, which the adapter clones
 * with the wrapper class applied.
 */
export default function Table () {
  const [items, setItems] = useState<Item[]>(() => generateItems(50, i => ({
    id: i,
    data: 'Draggable ' + i,
  })))

  const onDrop = useCallback((dropResult: DropResult) => {
    setItems(items => applyDrag(items, dropResult))
  }, [])

  return (
    <div className="wide-page table-page">
      <style>{styles}</style>
      <table style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th>Lorem</th>
            <th>Ipsum</th>
            <th>Sit</th>
            <th>Amed</th>
          </tr>
        </thead>
        <Container
          onDrop={onDrop}
          render={ref => (
            <tbody ref={ref}>
              {items.map(item => (
                <Draggable
                  key={item.id}
                  render={() => (
                    <tr>
                      <td>Row {item.data} Column 1</td>
                      <td>Row {item.data} Column 2</td>
                      <td>Row {item.data} Column 3</td>
                      <td>Row {item.data} Column 4</td>
                    </tr>
                  )}
                />
              ))}
            </tbody>
          )}
        />
      </table>
    </div>
  )
}
