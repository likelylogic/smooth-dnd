import React, { Component } from 'react'
import { constants } from '@likelylogic/smooth-dnd'

const { wrapperClass } = constants

export interface DraggableProps {
  /**
   * Render the draggable yourself. The returned element is cloned with the
   * wrapper class applied, so it must accept a `className`.
   */
  render?: () => React.ReactElement<{ className?: string }>
  className?: string
  children?: React.ReactNode
}

class Draggable extends Component<DraggableProps> {
  render () {
    if (this.props.render) {
      return React.cloneElement(this.props.render(), { className: wrapperClass })
    }

    const { className, children, render, ...rest } = this.props
    const clsName = className ? `${className} ` : ''

    return (
      <div {...rest} className={`${clsName}${wrapperClass}`}>
        {children}
      </div>
    )
  }
}

export default Draggable
