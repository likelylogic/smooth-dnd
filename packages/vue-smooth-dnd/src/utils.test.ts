import { describe, expect, it } from 'vitest'
import { getTagProps, validateTagProp } from './utils'

describe('getTagProps', () => {
  it('defaults to a div when no tag is given', () => {
    expect(getTagProps(undefined)).toEqual({ value: 'div', props: {} })
  })

  it('accepts a bare tag name', () => {
    expect(getTagProps('ul')).toEqual({ value: 'ul', props: {} })
  })

  it('accepts a tag object and passes its props through', () => {
    expect(getTagProps({ value: 'ul', props: { id: 'list' } }))
      .toEqual({ value: 'ul', props: { id: 'list' } })
  })

  it('falls back to div when a tag object omits its value', () => {
    expect(getTagProps({ props: { id: 'list' } }))
      .toEqual({ value: 'div', props: { id: 'list' } })
  })

  it('copies the props object rather than mutating the caller’s', () => {
    const props = { id: 'list' }
    const result = getTagProps({ value: 'ul', props }, 'wrapper')

    expect(result.props).not.toBe(props)
    expect(props).toEqual({ id: 'list' })
  })

  describe('when merging an extra class', () => {
    it('sets it when there is none', () => {
      expect(getTagProps('ul', 'wrapper').props.class).toBe('wrapper')
    })

    it('combines it with an existing string class', () => {
      const result = getTagProps({ value: 'ul', props: { class: 'list' } }, 'wrapper')
      expect(result.props.class).toEqual(['list', 'wrapper'])
    })

    it('appends to an existing array class', () => {
      const result = getTagProps({ value: 'ul', props: { class: ['a', 'b'] } }, 'wrapper')
      expect(result.props.class).toEqual(['a', 'b', 'wrapper'])
    })

    it('still applies when falling back to a div', () => {
      expect(getTagProps(undefined, 'wrapper').props.class).toBe('wrapper')
    })
  })
})

describe('validateTagProp', () => {
  it.each([
    ['undefined', undefined],
    ['a string', 'ul'],
    ['an object with a string value', { value: 'ul' }],
    ['an object with a component value', { value: {} }],
  ])('accepts %s', (_label, tag) => {
    expect(validateTagProp(tag)).toBe(true)
  })

  it.each([
    ['a number', 42],
    ['an object with no value', { props: {} }],
    ['an object with a non-tag value', { value: 42 }],
  ])('rejects %s', (_label, tag) => {
    expect(validateTagProp(tag)).toBe(false)
  })
})
