import { useCallback, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface LeafNode {
  id: string
  type: 'draggable'
  data: string
}

interface BranchNode {
  id: string
  type: 'container'
  data?: string
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
    id: 'item1 ' + i,
    type: 'draggable',
    data: `Container 1 Draggable - ${i}`,
  }))

  const items2 = generateItems<TreeNode>(10, i => ({
    id: 'item2 ' + i,
    type: 'draggable',
    data: `Container 2 Draggable - ${i}`,
  }))

  items2[3] = {
    ...items2[3],
    type: 'container',
    items: generateItems<TreeNode>(4, i => ({
      id: 'item2 sub' + i,
      type: 'draggable',
      data: `Container 4 Draggable - ${i}`,
    })),
  }

  const items3 = generateItems<TreeNode>(4, i => ({
    id: 'item3 ' + i,
    type: 'draggable',
    data: `Container 3 Draggable - ${i}`,
  }))

  items[5] = { ...items[5], type: 'container', items: items2 }
  items[9] = { ...items[9], type: 'container', items: items3 }

  return items
}

/**
 * The hard nesting case: every container shares `groupName="1"`, so an item can
 * be dragged across the parent/child boundary — including a whole sub-list into
 * another sub-list.
 */
export default function NestedGroup () {
  const [items, setItems] = useState<TreeNode[]>(createTree)

  const onDrop = useCallback((e: DropResult) => {
    console.log('level 1: Drop')
    setItems(items => applyDrag(items, e))
  }, [])

  const onDrop2 = useCallback((index: number, e: DropResult) => {
    console.log('level 2: Drop')
    setItems(items => items.map((item, i) => (
      i === index && item.type === 'container'
        ? { ...item, items: applyDrag(item.items, e) }
        : item
    )))
  }, [])

  const onDrop3 = useCallback((index1: number, index2: number, e: DropResult) => {
    console.log('level 3: Drop')
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
        <Container groupName="1" onDrop={onDrop} getChildPayload={i => items[i]}>
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
                      <Container
                        groupName="1"
                        getChildPayload={index => p.items[index]}
                        onDrop={e => onDrop2(i, e)}
                      >
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
                                    <Container
                                      groupName="1"
                                      getChildPayload={index => q.items[index]}
                                      onDrop={e => onDrop3(i, j, e)}
                                    >
                                      {q.items.map((t, y) => (
                                        <Draggable key={y}>
                                          <div className="draggable-item" style={{ backgroundColor: 'ghostwhite' }}>
                                            {t.data}
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
