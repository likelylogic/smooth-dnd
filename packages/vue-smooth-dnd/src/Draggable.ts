import { defineComponent, h, type PropType } from 'vue'
import { constants } from '@likelylogic/smooth-dnd'
import { getTagProps, validateTagProp, type TagProp } from './utils'

export default defineComponent({
  name: 'Draggable',

  props: {
    tag: {
      type: [String, Object] as PropType<TagProp>,
      validator: validateTagProp,
      default: 'div',
    },
  },

  setup (props, { slots }) {
    return () => {
      const tag = getTagProps(props.tag, constants.wrapperClass)
      return h(tag.value as string, tag.props, slots.default?.())
    }
  },
})
