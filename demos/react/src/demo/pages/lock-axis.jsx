import { Component } from 'react';
import { Container, Draggable } from '@likelylogic/react-smooth-dnd';
import { applyDrag, generateItems } from './utils.js';

class LockAxis extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: generateItems(50, (index) => {
        return {
          id: index,
          data: 'Draggable' + index
        };
      })
    };
  }
  render() {
    return (
      <div>
        <div className="simple-page">
          <Container lockAxis="y" onDrop={e => this.setState({ items: applyDrag(this.state.items, e) })}>
            {this.state.items.map(p => {
              return (
                <Draggable key={p.id}>
                  <div className="draggable-item">
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

export default LockAxis;
