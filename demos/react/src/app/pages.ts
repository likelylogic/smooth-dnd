/**
 * The React demo's page registry.
 *
 * `@demo/shared`'s `navigation` names the pages but deliberately doesn't import
 * them; this map is where the React demo resolves a `name` to a component. The
 * Vue demo does the same job with `import.meta.glob`, but React has no
 * single-file-component convention to glob for, so the map is explicit.
 *
 * The keys must match the `name` of every page in `navigation`, no more and no
 * less — `App` throws on a missing one.
 */

import type { ComponentType } from 'react'

import Cards from '../pages/cards'
import Chess from '../pages/chess'
import Copy from '../pages/copy'
import DragClass from '../pages/drag-class'
import DragDelay from '../pages/drag-delay'
import DragHandle from '../pages/drag-handle'
import DropZone from '../pages/drop-zone'
import DynamicContainers from '../pages/dynamic-containers'
import Events from '../pages/events'
import Form from '../pages/form'
import Groups from '../pages/groups'
import Height from '../pages/height'
import LockAxis from '../pages/lock-axis'
import Nested from '../pages/nested'
import NestedGroup from '../pages/nested-group'
import ScrollBoth from '../pages/scroll-both'
import Simple from '../pages/simple'
import SimpleHorizontal from '../pages/simple-horizontal'
import SimpleScroller from '../pages/simple-scroller'
import Table from '../pages/table'
import TransitionDuration from '../pages/transition-duration'

export const pages: Record<string, ComponentType> = {
  'cards': Cards,
  'form': Form,
  'chess': Chess,
  'simple': Simple,
  'simple-scroller': SimpleScroller,
  'simple-horizontal': SimpleHorizontal,
  'height': Height,
  'table': Table,
  'groups': Groups,
  'copy': Copy,
  'drop-zone': DropZone,
  'nested': Nested,
  'nested-group': NestedGroup,
  'lock-axis': LockAxis,
  'drag-handle': DragHandle,
  'drag-class': DragClass,
  'drag-delay': DragDelay,
  'transition-duration': TransitionDuration,
  'scroll-both': ScrollBoth,
  'dynamic-containers': DynamicContainers,
  'events': Events,
}

export default pages
