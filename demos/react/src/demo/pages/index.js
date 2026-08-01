import * as simples from './simple.jsx';
import SimpleHorizontal from './simple-horizontal.jsx';
import Groups from './groups.jsx';
import Copy from './copy.jsx';
import Horizontal from './horizontal.jsx';
import Nested from './nested.jsx';
import NestedGroup from './nested-group.jsx';
import VanillaNested from './vanilla-nested.jsx';
import Height from './height.jsx';
import Form from './form.jsx';
import Cards from './cards.jsx';
import LockAxis from './lock-axis.jsx';
import DragDelay from './drag-delay.jsx';
import DragHandle from './drag-handle.jsx';
import DragClass from './drag-class.jsx';
import TransitionDuration from './transition-duration.jsx';
import DropZone from './drop-zone.jsx';
import Chess from './chess.jsx';
import ScrollBoth from './scroll-both.jsx';
import DynamicContainers from './dynamic-containers.jsx';


const getUrl = (pagename) => {
  return `https://github.com/kutlugsahin/smooth-dnd-demo/blob/master/src/demo/pages/${pagename}`;
};


export default [
  {
    title: 'Showcase',
    pages: [
      // {
      //   title: 'Chess', page: Chess, url: getUrl('form.js')
      // },
      {
        title: 'Card board', page: Cards, url:getUrl('cards.js')
      },
      {
        title: 'Form elements', page: Form, url: getUrl('form.js')
      }
    ]
  },{
    title: 'Basic Sortables',
    pages: [
      {
        title: 'Sortable with default options', page: simples.Simple, url: getUrl('simple.js')
      },
      {
        title: 'Sortable inside scroller', page: simples.SimpleScroller, url: getUrl('simple.js')	
      }, {
        title: 'Horizontal sortable', page: SimpleHorizontal, url: getUrl('horizontal.js')
      }
    ]
  },
  {
    title: 'Groups',
    pages: [
      {
        title: 'DnD between groups', page: Groups, url: getUrl('groups.js')
      },
      {
        title: 'Copy draggable', page: Copy, url: getUrl('copy.js')
      },
      // {
      //   title: 'auto scroll', page: ScrollBoth, url: getUrl('copy.js')
      // },
      // {
      //   title: 'Drop Zones', page: DropZone, url: getUrl('drop-zone.js')
      // }
    ]
  },
  {
    title: 'Nested Groups',
    pages: [
      {
        title: 'Nested vertical sortable', page: Nested, url: getUrl('nested.js')
      },
      // {
      //   title: 'Drag-drop between parent/child', page: NestedGroup, url: getUrl('nested-group.js')
      // }
    ]
  },
  {
    title: 'Advanced options',
    pages: [
      {
        title: 'Lock axis', page: LockAxis, url: getUrl('lock-axis.js')
      },
      {
        title: 'Drag begin delay of 500ms', page: DragDelay, url: getUrl('drag-delay.js')
      },
      {
        title: 'Drag handle', page: DragHandle, url: getUrl('drag-handle.js')
      },
      {
        title: 'Drag and Drop classses', page: DragClass, url: getUrl('drag-class.js')
      },
      {
        title: 'Animation duration 500ms', page: TransitionDuration, url: getUrl('transition-duration.js')
      },
      // {
      //   title: 'Dynamic add/remove Containers', page: DynamicContainers, url: getUrl('dynamic-containers.js')
      // }
    ]
  }
];