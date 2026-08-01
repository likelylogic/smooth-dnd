import { useCallback, useState, type CSSProperties } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'
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

  const getCardPayload = useCallback((columnId: string, index: number) => {
    return scene.children.filter(p => p.id === columnId)[0].children[index]
  }, [scene])

  const onColumnDrop = useCallback((dropResult: DropResult) => {
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
      </Container>
    </div>
  )
}
