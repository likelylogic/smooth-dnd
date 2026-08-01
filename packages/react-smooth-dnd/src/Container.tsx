import React, { Component, type CSSProperties } from 'react'
import {
  dropHandlers,
  smoothDnD as container,
  type ContainerOptions,
  type SmoothDnD,
} from '@likelylogic/smooth-dnd'

// The framework renders and owns the children, so smooth-dnd must not move DOM
// nodes itself or wrap them in its own elements.
container.dropHandler = dropHandlers.reactDropHandler().handler
container.wrapChild = false

export interface ContainerProps extends ContainerOptions {
  render?: (rootRef: React.RefObject<any>) => React.ReactElement
  style?: CSSProperties
  children?: React.ReactNode
}

class Container extends Component<ContainerProps> {
  public static defaultProps: Partial<ContainerProps> = {
    behaviour: 'move',
    orientation: 'vertical',
  }

  prevContainer: HTMLElement | null = null
  container: SmoothDnD = null!
  containerRef: React.RefObject<any> = React.createRef()

  constructor (props: ContainerProps) {
    super(props)
    this.getContainerOptions = this.getContainerOptions.bind(this)
    this.getContainer = this.getContainer.bind(this)
    this.isObjectTypePropsChanged = this.isObjectTypePropsChanged.bind(this)
  }

  componentDidMount () {
    this.prevContainer = this.getContainer()
    this.container = container(this.getContainer(), this.getContainerOptions())
  }

  componentWillUnmount () {
    if (this.container) {
      this.container.dispose()
      this.container = null!
    }
  }

  componentDidUpdate (prevProps: ContainerProps) {
    if (this.getContainer()) {
      if (this.prevContainer && this.prevContainer !== this.getContainer()) {
        this.container.dispose()
        this.container = container(this.getContainer(), this.getContainerOptions())
        this.prevContainer = this.getContainer()
        return
      }

      if (this.isObjectTypePropsChanged(prevProps)) {
        this.container.setOptions(this.getContainerOptions())
      }
    }
  }

  isObjectTypePropsChanged (prevProps: ContainerProps) {
    const { render, children, style, ...containerOptions } = this.props

    for (const _key in containerOptions) {
      const key = _key as keyof ContainerOptions
      if (Object.prototype.hasOwnProperty.call(containerOptions, key)) {
        const prop = containerOptions[key]

        if (typeof prop !== 'function' && prop !== prevProps[key]) {
          return true
        }
      }
    }

    return false
  }

  render () {
    if (this.props.render) {
      return this.props.render(this.containerRef)
    }

    return (
      <div style={this.props.style} ref={this.containerRef}>
        {this.props.children}
      </div>
    )
  }

  getContainer () {
    return this.containerRef.current
  }

  getContainerOptions (): ContainerOptions {
    return Object.keys(this.props).reduce((result: ContainerOptions, key: string) => {
      const optionName = key as keyof ContainerOptions
      const prop = this.props[optionName]

      if (typeof prop === 'function') {
        ;(result as Record<string, unknown>)[optionName] = (...params: any[]) => {
          return (this.props[optionName] as Function)(...params)
        }
      }
      else {
        ;(result as Record<string, unknown>)[optionName] = prop
      }

      return result
    }, {}) as ContainerOptions
  }
}

export default Container
