/**
 * The `tag` prop lets callers control the element a component renders.
 *
 * It accepts either a tag name (`"ul"`) or an object carrying the tag plus the
 * props to spread onto it (`{ value: 'ul', props: { class: 'list' } }`).
 *
 * Note that Vue 3's `h()` takes a single flat props object, unlike Vue 2's
 * nested `data` object — so `props` here is flat too.
 */
export type TagValue = string | Record<string, unknown>

export interface TagObject {
  value?: TagValue
  props?: Record<string, unknown>
}

export type TagProp = string | TagObject

export interface ResolvedTag {
  value: TagValue
  props: Record<string, unknown>
}

/**
 * Merge an extra class into a flat props object without clobbering what's there.
 */
function addClass (props: Record<string, unknown>, className: string): void {
  const existing = props.class
  if (!existing) {
    props.class = className
  }
  else if (Array.isArray(existing)) {
    existing.push(className)
  }
  else {
    props.class = [existing, className]
  }
}

export function getTagProps (tag: TagProp | undefined, tagClasses?: string): ResolvedTag {
  if (tag) {
    if (typeof tag === 'string') {
      const result: ResolvedTag = { value: tag, props: {} }
      if (tagClasses) {
        result.props.class = tagClasses
      }
      return result
    }

    if (typeof tag === 'object') {
      const result: ResolvedTag = {
        value: tag.value || 'div',
        props: { ...(tag.props || {}) },
      }
      if (tagClasses) {
        addClass(result.props, tagClasses)
      }
      return result
    }
  }

  const fallback: ResolvedTag = { value: 'div', props: {} }
  if (tagClasses) {
    fallback.props.class = tagClasses
  }
  return fallback
}

export function validateTagProp (tag: unknown): boolean {
  if (tag) {
    if (typeof tag === 'string') {
      return true
    }
    if (typeof tag === 'object') {
      const value = (tag as TagObject).value
      if (typeof value === 'string' || typeof value === 'function' || typeof value === 'object') {
        return true
      }
    }
    return false
  }
  return true
}
