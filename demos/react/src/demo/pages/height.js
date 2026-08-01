import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Container, Draggable } from 'react-smooth-dnd';
import { applyDrag, generateItems } from './utils';


class Height extends Component {
  constructor() {
    super();
    this.state = {
      items: generateItems(50, (index) => {
        return {
          id: index,
          data: 'Draggable' + index,
          height: `${(40 + Math.random() * 200).toFixed()}px`
        };
      })
    };
  }
  render() {
    return (
      <div>
        <div className="simple-page">
          <Container onDrop={e => this.setState({ items: applyDrag(this.state.items, e) })}>
            {this.state.items.map(p => {
              return (
                <Draggable key={p.id}>
                  <div className="draggable-item" style={{height: p.height}}>
                    {p.data}
                  </div>
                </Draggable>
              );
            })}
          </Container>
        </div>
      </div>
    );
  }
}

Height.propTypes = {

};

export default Height;