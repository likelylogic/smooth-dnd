import { useCallback, useEffect, useState } from 'react'
import { Container, Draggable } from '@likelylogic/react-smooth-dnd'
import {
  smoothDnD,
  type DropCompleteResult,
  type DropIndicator,
  type DropResult,
  type DropTarget,
} from '@likelylogic/smooth-dnd'
import { applyDrag, type DragResult } from '@demo/shared'

interface Node {
  id: string
  name: string
  kind: 'folder' | 'file'
  depth: number
}

function build (): Node[] {
  return [
    { id: 'n0', name: 'Projects', kind: 'folder', depth: 0 },
    { id: 'n1', name: 'smooth-dnd', kind: 'folder', depth: 1 },
    { id: 'n2', name: 'readme.md', kind: 'file', depth: 2 },
    { id: 'n3', name: 'changelog.md', kind: 'file', depth: 2 },
    { id: 'n4', name: 'Archive', kind: 'folder', depth: 1 },
    { id: 'n5', name: 'notes.txt', kind: 'file', depth: 0 },
    { id: 'n6', name: 'todo.txt', kind: 'file', depth: 0 },
  ]
}

/**
 * `dropOnItems` under the default `gap` feedback.
 *
 * Dropping *between* nodes slides them apart as usual. The middle of a node instead resolves to a
 * drop *into* it — nothing has to make room for that, so no gap opens and the library reports the
 * node's bounds for this page to highlight.
 */
export default function Tree () {
  const [nodes, setNodes] = useState<Node[]>(build)
  const [indicator, setIndicator] = useState<DropIndicator | null>(null)
  const [target, setTarget] = useState<DropTarget | null>(null)
  const [lastDrop, setLastDrop] = useState('—')

  const onDropReady = useCallback((result: DropResult) => {
    setIndicator(result.dropIndicator ?? null)
    setTarget(result.dropTarget ?? null)
  }, [])

  const onDrop = useCallback((dropResult: DragResult) => {
    const landedInto = target?.kind === 'into'
    const intoIndex = target?.index

    setIndicator(null)
    setTarget(null)

    // A drop *into* a node has no insertion index — the library reports which node was landed on,
    // and re-parenting is the application's business.
    if (landedInto && intoIndex !== undefined) {
      setNodes(nodes => {
        const moved = nodes[dropResult.removedIndex!]
        const parent = nodes[intoIndex]
        if (!moved || !parent || moved === parent) {
          return nodes
        }
        const next = [...nodes]
        next.splice(dropResult.removedIndex!, 1)
        const parentAt = next.indexOf(parent)
        next.splice(parentAt + 1, 0, { ...moved, depth: parent.depth + 1 })
        return next
      })
      return
    }

    setNodes(nodes => applyDrag(nodes, dropResult))
  }, [target])

  useEffect(() => smoothDnD.onDropComplete((result: DropCompleteResult) => {
    setLastDrop(result.to ? `${result.action} — ${result.to.kind} ${result.to.index}` : result.action)
  }), [])

  const box = indicator?.relative

  return (
    <div className="simple-page">
      <p className="drop-hint">
        The middle of a folder accepts a drop <em>into</em> it; the edges still insert between items.
        Both are reported by the library — the highlight and the line are drawn by this page.
      </p>

      <Container
        dropOnItems
        getChildPayload={index => nodes[index]}
        onDropReady={onDropReady}
        onDrop={onDrop}
        onDragLeave={() => setTarget(null)}
      >
        {nodes.map(node => (
          <Draggable key={node.id}>
            <div className="tree-node" style={{ paddingLeft: 12 + node.depth * 20 }}>
              <span className="tree-node__icon">{node.kind === 'folder' ? '▸' : '·'}</span>
              {node.name}
            </div>
          </Draggable>
        ))}

        {/* only an into target needs drawing; a between target is shown by the gap itself */}
        {box && target?.kind === 'into' && (
          <div
            className="drop-into"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
        )}
      </Container>

      <dl className="drop-readout">
        <dt>target</dt>
        <dd>{target ? `${target.kind} ${target.index}` : '—'}</dd>
        <dt>last drop</dt>
        <dd>{lastDrop}</dd>
      </dl>
    </div>
  )
}
