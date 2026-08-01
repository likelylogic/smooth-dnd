import { useCallback, useState, type CSSProperties } from 'react'
import {
  Container,
  Draggable,
  type ContainerOptions,
  type DragEndParams,
  type DragStartParams,
  type DropResult,
} from '@likelylogic/react-smooth-dnd'
import { applyDrag, generateItems } from '@demo/shared'

interface Item {
  id: string
  data: string
}

/** Per-column switches for the two predicate callbacks. */
interface Flags {
  drop: boolean
  animate: boolean
}

/**
 * Every callback the React adapter exposes, in the order the docs list them.
 * The first three are predicates/providers, the rest are notifications.
 */
const callbackNames = [
  'getChildPayload',
  'shouldAcceptDrop',
  'shouldAnimateDrop',
  'onDragStart',
  'onDragEnd',
  'onDragEnter',
  'onDragLeave',
  'onDrop',
] as const

type CallbackName = typeof callbackNames[number]

/**
 * `shouldAcceptDrop` and `shouldAnimateDrop` fire on every mouse move, so
 * they're off by default — left on they drown out everything else.
 */
const defaultLogs: Record<CallbackName, boolean> = {
  getChildPayload: true,
  shouldAcceptDrop: false,
  shouldAnimateDrop: false,
  onDragStart: true,
  onDragEnd: true,
  onDragEnter: true,
  onDragLeave: true,
  onDrop: true,
}

let nextId = 0

const makeId = () => `item-${++nextId}`

const generate = (num: number) => generateItems<Item>(5, i => ({
  id: makeId(),
  data: `Draggable ${num} - ${i + 1}`,
}))

const columnsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'stretch',
}

const columnStyle: CSSProperties = {
  marginRight: '20px',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  flex: 1,
}

/** Mirrors `.column .smooth-dnd-container.vertical` in the Vue demo. */
const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
}

const controlsStyle: CSSProperties = {
  marginTop: '1em',
}

const controlsGroupStyle: CSSProperties = {
  paddingTop: '1em',
}

const labelStyle: CSSProperties = {
  display: 'block',
  lineHeight: '1.6em',
}

/**
 * A live log of every callback as it fires.
 *
 * Columns can be added and removed at runtime, and each one can independently
 * refuse a drop or refuse to animate it, which makes it easy to see exactly
 * which callback governs which piece of behaviour.
 */
export default function Events () {
  const [groups, setGroups] = useState<Item[][]>(() => [generate(1)])
  const [flags, setFlags] = useState<Flags[]>(() => [{ drop: true, animate: true }])
  const [logs, setLogs] = useState<Record<CallbackName, boolean>>(defaultLogs)
  const [logPayload, setLogPayload] = useState(true)

  // Deliberately not memoised: it closes over `logs` / `logPayload`, and the
  // adapter re-reads the callback props on every call, so a fresh closure each
  // render is exactly what's wanted.
  const log = (name: CallbackName, ...args: unknown[]) => {
    if (logs[name]) {
      logPayload
        ? console.log(name, ...args)
        : console.log(name)
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // callbacks

  const getChildPayload = (groupIndex: number, itemIndex: number) => {
    log('getChildPayload', groupIndex, itemIndex)
    return groups[groupIndex][itemIndex]
  }

  const getShouldAcceptDrop = (index: number, source: ContainerOptions, payload: unknown) => {
    log('shouldAcceptDrop', source, payload)
    return flags[index].drop
  }

  const getShouldAnimateDrop = (index: number, source: ContainerOptions, payload: unknown) => {
    log('shouldAnimateDrop', source, payload)
    return flags[index].animate
  }

  // ---------------------------------------------------------------------------------------------------------------
  // events

  const onDragStart = (params: DragStartParams) => log('onDragStart', params)

  const onDragEnd = (params: DragEndParams) => log('onDragEnd', params)

  const onDragEnter = (index: number) => log('onDragEnter', index)

  const onDragLeave = (index: number) => log('onDragLeave', index)

  const onDrop = (groupIndex: number, dropResult: DropResult) => {
    setGroups(groups => groups.map((items, i) => (
      i === groupIndex ? applyDrag(items, dropResult) : items
    )))
    log('onDrop', dropResult)
  }

  // ---------------------------------------------------------------------------------------------------------------
  // app

  const addColumn = useCallback(() => {
    setGroups(groups => [...groups, generate(groups.length + 1)])
    setFlags(flags => [...flags, { drop: true, animate: true }])
  }, [])

  const removeColumn = useCallback(() => {
    setGroups(groups => groups.slice(0, -1))
    setFlags(flags => flags.slice(0, -1))
  }, [])

  const setFlag = useCallback((index: number, key: keyof Flags, value: boolean) => {
    setFlags(flags => flags.map((flag, i) => (
      i === index ? { ...flag, [key]: value } : flag
    )))
  }, [])

  return (
    <div className="wide-page">

      <div style={columnsStyle}>
        {groups.map((items, index) => (
          <div key={index} style={columnStyle}>
            <div>
              <label style={labelStyle}>
                <input
                  type="checkbox"
                  checked={flags[index].drop}
                  onChange={e => setFlag(index, 'drop', e.target.checked)}
                /> Accept Drop
              </label>
              <label style={labelStyle}>
                <input
                  type="checkbox"
                  checked={flags[index].animate}
                  onChange={e => setFlag(index, 'animate', e.target.checked)}
                /> Animate Drop
              </label>
            </div>
            <Container
              style={containerStyle}
              groupName="column"

              getChildPayload={itemIndex => getChildPayload(index, itemIndex)}
              shouldAcceptDrop={(source, payload) => getShouldAcceptDrop(index, source, payload)}
              shouldAnimateDrop={(source, payload) => getShouldAnimateDrop(index, source, payload)}

              onDragStart={onDragStart}
              onDragEnter={() => onDragEnter(index)}
              onDragLeave={() => onDragLeave(index)}
              onDragEnd={onDragEnd}
              onDrop={e => onDrop(index, e)}
            >
              {items.map(item => (
                <Draggable key={item.id}>
                  <div className="draggable-item">
                    {item.data}
                  </div>
                </Draggable>
              ))}
            </Container>
          </div>
        ))}
      </div>

      <div style={controlsStyle}>
        <div style={controlsGroupStyle}>
          <button onClick={removeColumn} disabled={groups.length === 1}>Remove Column</button>
          <button onClick={addColumn}>Add Column</button>
        </div>
        <div style={controlsGroupStyle}>
          {callbackNames.map(name => (
            <label key={name} style={labelStyle}>
              <input
                type="checkbox"
                checked={logs[name]}
                onChange={e => setLogs(logs => ({ ...logs, [name]: e.target.checked }))}
              /> {name}
            </label>
          ))}
          <hr/>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={logPayload}
              onChange={e => setLogPayload(e.target.checked)}
            /> Log payload
          </label>
        </div>
      </div>

    </div>
  )
}
