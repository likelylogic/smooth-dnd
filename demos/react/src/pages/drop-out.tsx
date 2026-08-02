import { useCallback, useState } from 'react'
import { Container, Draggable } from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems, type DragResult } from '@demo/shared'

interface Item {
  id: string
  data: string
}

function build (): Item[][] {
  return [
    generateItems<Item>(6, i => ({ id: `a${i}`, data: `Item A${i}` })),
    generateItems<Item>(6, i => ({ id: `b${i}`, data: `Item B${i}` })),
  ]
}

/**
 * A drop zone that surrounds the sortables, so an item can be dragged off a
 * list and released into empty space.
 *
 * The outer `behaviour: drop-zone` container wraps everything; `getPosition`
 * resolves to the innermost relevant container under the pointer, so a list
 * wins while you are over it and the surround takes over once you are not.
 */
export default function DropOut () {
  const [lists, setLists] = useState<Item[][]>(build)
  const [detached, setDetached] = useState<Item[]>([])
  const [isOver, setIsOver] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const note = useCallback((message: string) => {
    setLog(log => [message, ...log].slice(0, 8))
  }, [])

  const onDropInList = useCallback((listIndex: number, dropResult: DragResult) => {
    const { removedIndex, addedIndex } = dropResult
    if (removedIndex === null && addedIndex === null) {
      return
    }
    note(`list ${listIndex + 1} — removed: ${removedIndex}, added: ${addedIndex}`)
    setLists(lists => lists.map((list, i) => (
      i === listIndex ? applyDrag(list, dropResult) : list
    )))
  }, [note])

  const onDropOut = useCallback((dropResult: DragResult) => {
    setIsOver(false)

    // The surrounding zone fires for every drop, including ones that landed on
    // a list — those arrive with both indices null and are not ours to handle.
    if (dropResult.addedIndex === null) {
      return
    }

    note(`surround — added: ${dropResult.addedIndex} (always 0)`)
    if (dropResult.payload) {
      setDetached(detached => [...detached, dropResult.payload as Item])
    }
  }, [note])

  const reset = useCallback(() => {
    setLists(build())
    setDetached([])
    setLog([])
  }, [])

  return (
    <Container
      groupName="drop-out"
      behaviour="drop-zone"
      onDrop={onDropOut}
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      // The React Container renders a bare div and drops className, so the
      // render prop is the way to style the root.
      render={ref => (
        <div ref={ref} className={`drop-out ${isOver ? 'is-active' : ''}`}>
          {/*
            Plain divs, not Draggables. They are still counted as this
            container's children internally, but drop-zone never sorts, and
            without the wrapper class a mousedown on them can't start a drag.
          */}
          <div className="drop-out__lists">
            {lists.map((list, listIndex) => (
              <div key={listIndex} className="drop-out__list">
                <h4 className="drop-out__heading">List {listIndex + 1}</h4>
                <Container
                  groupName="drop-out"
                  getChildPayload={index => lists[listIndex][index]}
                  onDrop={e => onDropInList(listIndex, e)}
                >
                  {list.map(item => (
                    <Draggable key={item.id}>
                      <div className="draggable-item">{item.data}</div>
                    </Draggable>
                  ))}
                </Container>
              </div>
            ))}
          </div>

          <div className="drop-out__aside">
            <h4 className="drop-out__heading">
              Dropped out
              {detached.length > 0 && (
                <button className="drop-out__reset" onClick={reset}>reset</button>
              )}
            </h4>
            {detached.length === 0 && (
              <p className="drop-out__hint">
                Drag an item off a list and release it anywhere in the dashed area.
              </p>
            )}
            <ul className="drop-out__detached">
              {detached.map(item => <li key={item.id}>{item.data}</li>)}
            </ul>

            <h4 className="drop-out__heading">Drop events</h4>
            <ol className="drop-out__log">
              {log.map((entry, i) => <li key={i}>{entry}</li>)}
            </ol>
          </div>
        </div>
      )}
    />
  )
}
