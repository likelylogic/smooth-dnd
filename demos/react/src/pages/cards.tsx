import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
import type { ContainerOptions, DropIndicator } from '@likelylogic/smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

const columnNames = ['Lorem', 'Ipsum', 'Consectetur', 'Eiusmod']

const cardColors = [
  'azure',
  'beige',
  'bisque',
  'blanchedalmond',
  'burlywood',
  'cornsilk',
  'gainsboro',
  'ghostwhite',
  'ivory',
  'khaki',
]

const pickColor = () => cardColors[Math.floor(Math.random() * 10)]

interface Card {
  id: string
  type: 'draggable'
  props: {
    className: string
    style: CSSProperties
  }
  data: string
}

interface Column {
  id: string
  type: 'container'
  name: string
  props: {
    orientation: 'vertical'
    className: string
  }
  children: Card[]
}

interface Scene {
  type: 'container'
  props: {
    orientation: 'horizontal'
  }
  children: Column[]
}

function createScene (): Scene {
  return {
    type: 'container',
    props: {
      orientation: 'horizontal',
    },
    children: generateItems<Column>(4, i => ({
      id: `column${i}`,
      type: 'container',
      name: columnNames[i],
      props: {
        orientation: 'vertical',
        className: 'card-container',
      },
      children: generateItems<Card>(+(Math.random() * 10).toFixed() + 5, j => ({
        type: 'draggable',
        id: `${i}${j}`,
        props: {
          className: 'card',
          style: { backgroundColor: pickColor() },
        },
        data: lorem.slice(0, Math.floor(Math.random() * 150) + 30),
      })),
    })),
  }
}

/**
 * A Trello-style board: a horizontal container of columns, each of which is a
 * vertical container of cards.
 *
 * The columns are draggable too, so `dragHandleSelector` restricts the outer
 * container to the grip in the column header — otherwise grabbing a card would
 * also grab its column.
 */
export default function Cards () {
  const [scene, setScene] = useState<Scene>(createScene)
  const [columnIndicator, setColumnIndicator] = useState<DropIndicator | null>(null)
  const newColumnCount = useRef(0)

  const getCardPayload = useCallback((columnId: string, index: number) => {
    return scene.children.filter(p => p.id === columnId)[0].children[index]
  }, [scene])

  const onColumnDrop = useCallback((dropResult: DropResult) => {
    setColumnIndicator(null)
    const payload = dropResult.payload as Card | Column | undefined

    // a card dropped between columns becomes a new column holding it; the source column's own
    // drop handler removes it from where it came from
    if (payload && payload.type === 'draggable') {
      if (dropResult.addedIndex !== null) {
        newColumnCount.current++
        const column: Column = {
          id: `new-column-${newColumnCount.current}`,
          type: 'container',
          name: `New column ${newColumnCount.current}`,
          props: { orientation: 'vertical', className: 'card-container' },
          children: [payload as Card],
        }
        setScene(scene => {
          const children = [...scene.children]
          children.splice(dropResult.addedIndex!, 0, column)
          return { ...scene, children }
        })
      }
      return
    }

    setScene(scene => ({
      ...scene,
      children: applyDrag(scene.children, dropResult),
    }))
  }, [])

  const onCardDrop = useCallback((columnId: string, dropResult: DropResult) => {
    if (dropResult.removedIndex === null && dropResult.addedIndex === null) {
      return
    }

    setScene(scene => ({
      ...scene,
      children: scene.children.map(column => (
        column.id === columnId
          ? { ...column, children: applyDrag(column.children, dropResult) }
          : column
      )),
    }))
  }, [])

  return (
    <div className="card-scene">
      <Container
        orientation="horizontal"
        groupName="columns"
        // columns sort among themselves, and also accept cards — which land as a new column
        shouldAcceptDrop={(source: ContainerOptions) => source.groupName === 'columns' || source.groupName === 'col'}
        // sorting columns opens a gap as usual; a card dragged across the board shows an
        // indicator instead, since full columns sliding aside for a card would read as nonsense
        dropFeedback={(source: ContainerOptions) => source.groupName === 'col' ? 'indicator' : 'gap'}
        onDropReady={result => setColumnIndicator(result.dropIndicator ?? null)}
        onDragLeave={() => setColumnIndicator(null)}
        onDrop={onColumnDrop}
        dragHandleSelector=".column-drag-handle"
        dropPlaceholder={{
          animationDuration: 150,
          showOnTop: true,
          className: 'cards-drop-preview',
        }}
      >
        {scene.children.map(column => (
          <Draggable key={column.id}>
            <div className={column.props.className}>
              <div className="card-column-header">
                <span className="column-drag-handle">&#x2630;</span>
                {column.name}
              </div>
              <Container
                orientation={column.props.orientation}
                groupName="col"
                onDragStart={e => console.log('drag started', e)}
                onDragEnd={e => console.log('drag end', e)}
                onDrop={e => onCardDrop(column.id, e)}
                getChildPayload={index => getCardPayload(column.id, index)}
                dragClass="card-ghost"
                dropClass="card-ghost-drop"
                onDragEnter={() => console.log('drag enter:', column.id)}
                onDragLeave={() => console.log('drag leave:', column.id)}
                onDropReady={p => console.log('Drop ready: ', p)}
                dropPlaceholder={{
                  animationDuration: 150,
                  showOnTop: true,
                  className: 'drop-preview',
                }}
              >
                {column.children.map(card => (
                  <Draggable key={card.id}>
                    <div className={card.props.className} style={card.props.style}>
                      <p>{card.data}</p>
                    </div>
                  </Draggable>
                ))}
              </Container>
            </div>
          </Draggable>
        ))}

        {/* where a card dragged between columns would land, as a new column */}
        {columnIndicator && (
          <div
            className="drop-line-vertical"
            style={{
              left: columnIndicator.relative.left,
              top: columnIndicator.relative.top,
              height: columnIndicator.relative.height,
            }}
          />
        )}
      </Container>
    </div>
  )
}
