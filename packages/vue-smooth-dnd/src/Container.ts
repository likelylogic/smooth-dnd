import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  type PropType,
} from 'vue'
import {
  dropHandlers,
  smoothDnD,
  type ContainerOptions,
  type DragEndParams,
  type DragStartParams,
  type DropPlaceholderOptions,
  type DropResult,
  type SmoothDnD,
} from '@likelylogic/smooth-dnd'
import { getTagProps, validateTagProp, type TagProp } from './utils'

// The framework renders and owns the children, so smooth-dnd must not move DOM
// nodes itself or wrap them in its own elements. Despite the name, this handler
// is the "host framework manages the DOM" one, not a React-specific thing.
smoothDnD.dropHandler = dropHandlers.reactDropHandler().handler
smoothDnD.wrapChild = false

export default defineComponent({
  name: 'Container',

  props: {
    behaviour: String as PropType<ContainerOptions['behaviour']>,
    containerId: [String, Number] as PropType<ContainerOptions['containerId']>,
    dropFeedback: String as PropType<ContainerOptions['dropFeedback']>,
    dropOnItems: { type: Boolean, default: undefined },
    groupName: String,
    orientation: String as PropType<ContainerOptions['orientation']>,
    dragHandleSelector: String,
    nonDragAreaSelector: String,
    dragBeginDelay: Number,
    animationDuration: Number,
    autoScrollEnabled: { type: Boolean, default: true },
    lockAxis: String as PropType<ContainerOptions['lockAxis']>,
    dragClass: String,
    dropClass: String,
    removeOnDropOut: { type: Boolean, default: false },
    getChildPayload: Function as PropType<(index: number) => unknown>,
    shouldAnimateDrop: Function as PropType<(sourceOptions: ContainerOptions, payload: unknown) => boolean>,
    shouldAcceptDrop: Function as PropType<(sourceOptions: ContainerOptions, payload: unknown) => boolean>,
    getGhostParent: Function as PropType<() => HTMLElement>,
    dropPlaceholder: [Object, Boolean] as PropType<DropPlaceholderOptions | boolean>,
    tag: {
      type: [String, Object] as PropType<TagProp>,
      validator: validateTagProp,
      default: 'div',
    },
  },

  emits: {
    'drag-start': (params: DragStartParams) => !!params,
    'drag-end': (params: DragEndParams) => !!params,
    'drop': (params: DropResult) => !!params,
    'drag-enter': () => true,
    'drag-leave': () => true,
    'drop-ready': (params: DropResult) => !!params,
  },

  setup (props, { emit, slots, expose }) {
    const rootRef = ref<HTMLElement | null>(null)

    // The element smooth-dnd is currently bound to. Tracked separately from
    // rootRef so we can detect the root being swapped out (e.g. `tag` changed)
    // and rebind rather than silently keep driving a detached node.
    let boundElement: HTMLElement | null = null
    let instance: SmoothDnD | null = null

    function buildOptions (): ContainerOptions {
      const options: ContainerOptions = {
        onDragStart: params => emit('drag-start', params),
        onDragEnd: params => emit('drag-end', params),
        onDrop: params => emit('drop', params),
        onDragEnter: () => emit('drag-enter'),
        onDragLeave: () => emit('drag-leave'),
        onDropReady: params => emit('drop-ready', params),
      }

      // Only forward props the caller actually set — smooth-dnd fills in its own
      // defaults, and passing `undefined` would override them.
      const passthrough = [
        'behaviour', 'containerId', 'dropFeedback', 'dropOnItems',
        'groupName', 'orientation', 'dragHandleSelector',
        'nonDragAreaSelector', 'dragBeginDelay', 'animationDuration',
        'autoScrollEnabled', 'lockAxis', 'dragClass', 'dropClass',
        'removeOnDropOut', 'getChildPayload', 'shouldAnimateDrop',
        'shouldAcceptDrop', 'getGhostParent', 'dropPlaceholder',
      ] as const

      for (const key of passthrough) {
        const value = props[key]
        if (value !== undefined) {
          ;(options as Record<string, unknown>)[key] = value
        }
      }

      return options
    }

    function bind (element: HTMLElement) {
      boundElement = element
      instance = smoothDnD(element, buildOptions())
    }

    function unbind () {
      if (instance) {
        instance.dispose()
        instance = null
      }
      boundElement = null
    }

    onMounted(() => {
      if (rootRef.value) {
        bind(rootRef.value)
      }
    })

    onUpdated(() => {
      if (rootRef.value && rootRef.value !== boundElement) {
        unbind()
        bind(rootRef.value)
        return
      }
      instance?.setOptions(buildOptions())
    })

    onBeforeUnmount(unbind)

    expose({
      /** The underlying smooth-dnd instance, for imperative access. */
      get container () {
        return instance
      },
    })

    return () => {
      const tag = getTagProps(props.tag)
      return h(
        tag.value as string,
        { ...tag.props, ref: rootRef },
        slots.default?.(),
      )
    }
  },
})
