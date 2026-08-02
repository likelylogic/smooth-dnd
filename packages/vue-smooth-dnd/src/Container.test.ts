import { describe, expect, it } from 'vitest'
import Container from './Container'

/**
 * The adapter forwards a fixed list of props to the engine. Anything added to `ContainerOptions`
 * and not added here is silently dropped — Vue turns it into a fallthrough attribute on the root
 * element, so nothing fails and the option simply never arrives.
 *
 * This asserts the two lists agree, so the next option added cannot go missing quietly.
 */
describe('Container prop forwarding', () => {
  const declared = Object.keys((Container as any).props ?? {})

  it('declares every engine option it means to forward', () => {
    const shouldForward = [
      'behaviour', 'containerId', 'dropFeedback', 'dropOnItems', 'groupName', 'orientation',
      'dragHandleSelector', 'nonDragAreaSelector', 'dragBeginDelay', 'animationDuration',
      'autoScrollEnabled', 'lockAxis', 'dragClass', 'dropClass', 'removeOnDropOut',
      'getChildPayload', 'shouldAnimateDrop', 'shouldAcceptDrop', 'getGhostParent',
      'dropPlaceholder',
    ]

    const missing = shouldForward.filter(name => !declared.includes(name))
    expect(missing).toEqual([])
  })

  it('exposes the drop targeting options added for trees and indicators', () => {
    expect(declared).toContain('dropFeedback')
    expect(declared).toContain('dropOnItems')
    expect(declared).toContain('containerId')
  })

  it('emits the events the engine reports', () => {
    const emits = Object.keys((Container as any).emits ?? {})
    expect(emits).toEqual(
      expect.arrayContaining(['drag-start', 'drag-end', 'drop', 'drag-enter', 'drag-leave', 'drop-ready']),
    )
  })
})
