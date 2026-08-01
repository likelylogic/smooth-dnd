import { useCallback, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface LeafNode {
  id: number
  type: 'draggable'
  data: string
}

interface BranchNode {
  id: number
  type: 'container'
  items: TreeNode[]
}

type TreeNode = LeafNode | BranchNode

const branchStyle: CSSProperties = {
  padding: '20px 20px',
  marginTop: '2px',
  marginBottom: '2px',
  border: '1px solid rgba(0,0,0,.125)',
  backgroundColor: '#fff',
  cursor: 'move',
}

const nestedBranchStyle: CSSProperties = {
  ...branchStyle,
  backgroundColor: 'cornsilk',
}

function createTree (): TreeNode[] {
  const items = generateItems<TreeNode>(30, i => ({
    id: i,
    type: 'draggable',
    data: `Container 1 Draggable - ${i}`,
  }))

  const items2 = generateItems<TreeNode>(10, i => ({
    id: i,
    type: 'draggable',
    data: `Container 2 Draggable - ${i}`,
  }))

  items2[3] = {
    id: 3,
    type: 'container',
    items: generateItems<TreeNode>(4, i => ({
      id: i,
      type: 'draggable',
      data: `Container 4 Draggable - ${i}`,
    })),
  }

  const items3 = generateItems<TreeNode>(4, i => ({
    id: i,
    type: 'draggable',
    data: `Container 3 Draggable - ${i}`,
  }))

  items[5] = { id: 5, type: 'container', items: items2 }
  items[9] = { id: 9, type: 'container', items: items3 }

  return items
}

/**
 * A sortable container inside a sortable container, three levels deep.
 *
 * No `groupName` here, so each level is its own island: items reorder within
 * their own list and can't cross a boundary. `nested-group` is the case where
 * they can.
 */
export default function Nested () {
  const [items, setItems] = useState<TreeNode[]>(createTree)

  const onDrop = useCallback((e: DropResult) => {
    setItems(items => applyDrag(items, e))
  }, [])

  const onDrop2 = useCallback((index: number, e: DropResult) => {
    setItems(items => items.map((item, i) => (
      i === index && item.type === 'container'
        ? { ...item, items: applyDrag(item.items, e) }
        : item
    )))
  }, [])

  const onDrop3 = useCallback((index1: number, index2: number, e: DropResult) => {
    setItems(items => items.map((item, i) => {
      if (i !== index1 || item.type !== 'container') {
        return item
      }
      return {
        ...item,
        items: item.items.map((child, j) => (
          j === index2 && child.type === 'container'
            ? { ...child, items: applyDrag(child.items, e) }
            : child
        )),
      }
    }))
  }, [])

  return (
    <div>
      <div className="simple-page">
        <Container onDrop={onDrop}>
          {items.map((p, i) => p.type === 'draggable'
            ? (
                <Draggable key={i}>
                  <div className="draggable-item">{p.data}</div>
                </Draggable>
              )
            : (
                <Draggable key={i}>
                  <div style={branchStyle}>
                    <h4 style={{ textAlign: 'center' }}>
                      Nested Sortable List - {p.id}
                    </h4>
                    <div style={{ cursor: 'default' }}>
                      <Container onDrop={e => onDrop2(i, e)}>
                        {p.items.map((q, j) => q.type === 'draggable'
                          ? (
                              <Draggable key={j}>
                                <div className="draggable-item" style={{ backgroundColor: 'cornsilk' }}>
                                  {q.data}
                                </div>
                              </Draggable>
                            )
                          : (
                              <Draggable key={j}>
                                <div style={nestedBranchStyle}>
                                  <h4 style={{ textAlign: 'center' }}>
                                    Nested Sortable List - {q.id}
                                  </h4>
                                  <div style={{ cursor: 'default' }}>
                                    <Container onDrop={e => onDrop3(i, j, e)}>
                                      {q.items.map((t, y) => (
                                        <Draggable key={y}>
                                          <div className="draggable-item" style={{ backgroundColor: 'ghostwhite' }}>
                                            {t.type === 'draggable' ? t.data : null}
                                          </div>
                                        </Draggable>
                                      ))}
                                    </Container>
                                  </div>
                                </div>
                              </Draggable>
                            ))}
                      </Container>
                    </div>
                  </div>
                </Draggable>
              ))}
        </Container>
      </div>
    </div>
  )
}
