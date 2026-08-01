import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'

/** 1 = the zone holds the draggable, 0 = it's empty. */
type Zone = 0 | 1

/**
 * `behaviour: drop-zone` — targets that accept a drop without reordering their
 * own children. Only one of the four zones holds the draggable at a time.
 */
export default function DropZone () {
  const [zones, setZones] = useState<Zone[]>([1, 0, 0, 0])
  const [classes, setClasses] = useState<string[]>(['', '', '', ''])

  const onDrop = useCallback((containerIndex: number, dropResult: DropResult) => {
    const { addedIndex, removedIndex } = dropResult

    if (addedIndex !== null || removedIndex !== null) {
      setZones(zones => {
        const next = [...zones]
        if (removedIndex !== null) {
          next[containerIndex] = 0
        }
        if (addedIndex !== null) {
          next[containerIndex] = 1
        }
        return next
      })
    }

    setClasses(classes => {
      const next = [...classes]
      next[containerIndex] = ''
      return next
    })
  }, [])

  const setHover = useCallback((index: number, hover: boolean) => {
    setClasses(classes => {
      const next = [...classes]
      next[index] = hover ? 'hover' : ''
      return next
    })
  }, [])

  return (
    <div className="drop-zone">
      {zones.map((p, i) => (
        <div key={i} className={`drop-zone-container ${classes[i]}`}>
          <Container
            style={{ height: '100%' }}
            groupName="1"
            behaviour="drop-zone"
            onDrop={e => onDrop(i, e)}
            onDragEnter={() => setHover(i, true)}
            onDragLeave={() => setHover(i, false)}
          >
            {p
              ? (
                  <Draggable>
                    <div className="drop-zone-draggable">
                      Draggable
                    </div>
                  </Draggable>
                )
              : null}
          </Container>
        </div>
      ))}
    </div>
  )
}
