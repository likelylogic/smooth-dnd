import { animationClass, containerClass, containerInstance, dropPlaceholderFlexContainerClass, dropPlaceholderInnerClass, dropPlaceholderWrapperClass, stretcherElementClass, stretcherElementInstance, translationValue, wrapperClass, dropPlaceholderDefaultClass } from './constants';
import { defaultOptions } from './defaults';
import { domDropHandler } from './dropHandlers';
import { ContainerOptions, SmoothDnD, SmoothDnDCreator, DropPlaceholderOptions, DropCompleteCallback } from './exportTypes';
import { ContainerProps, DraggableInfo, DragInfo, DragResult, ElementX, IContainer, LayoutManager } from './interfaces';
import layoutManager from './layoutManager';
import Mediator, { getDraggedElement } from './mediator';
import { addClass, getParent, getParentRelevantContainerElement, hasClass, hasParent, listenScrollParent, removeClass } from './utils';

function setAnimation(element: HTMLElement, add: boolean, animationDuration = defaultOptions.animationDuration) {
  if (add) {
    addClass(element, animationClass);
    element.style.transitionDuration = animationDuration + 'ms';
  } else {
    removeClass(element, animationClass);
    element.style.removeProperty('transition-duration');
  }
}

function isDragRelevant({ element, getOptions }: ContainerProps) {
  return function (sourceContainer: IContainer, payload: any) {
    const options = getOptions();

    if (options.shouldAcceptDrop) {
      return options.shouldAcceptDrop(sourceContainer.getOptions(), payload);
    }
    const sourceOptions = sourceContainer.getOptions();
    if (options.behaviour === 'copy') return false;

    // A container living inside the item being dragged must not accept it — that would make the
    // item its own descendant.
    //
    // This previously compared the nearest ancestor *wrapper* against the source *container*
    // element. A wrapper is always a child of a container and never equal to one, so the check
    // never fired and nested containers would happily swallow their own ancestor.
    const draggedElement = getDraggedElement();
    if (draggedElement && hasParent(element, draggedElement)) {
      return false;
    }

    if (sourceContainer.element === element) return true;
    if (sourceOptions.groupName && sourceOptions.groupName === options.groupName) return true;

    return false;
  };
}

function wrapChild(child: HTMLElement) {
  if (smoothDnD.wrapChild) {
    const div = window.document.createElement('div');
    div.className = `${wrapperClass}`;
    child.parentElement!.insertBefore(div, child);
    div.appendChild(child);
    return div;
  }

  return child;
}

function wrapChildren(element: HTMLElement) {
  const draggables: ElementX[] = [];
  Array.prototype.forEach.call(element.children, (child: ElementX) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      let wrapper = child;
      if (!hasClass(child, wrapperClass)) {
        wrapper = wrapChild(child);
      }
      wrapper[translationValue] = 0;
      draggables.push(wrapper);
    } else {
      element.removeChild(child);
    }
  });
  return draggables;
}

function unwrapChildren(element: HTMLElement) {
  if (smoothDnD.wrapChild) {
    Array.prototype.forEach.call(element.children, (child: HTMLElement) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (hasClass(child, wrapperClass)) {
          element.insertBefore(child.firstElementChild as HTMLElement, child);
          element.removeChild(child);
        }
      }
    });
  }
}

// Exported for tests. Not part of the package's public API — index.ts controls what ships,
// and does not re-export from this module.
export function findDraggebleAtPos(
  { layout }: { layout: LayoutManager },
  boundsOf?: (element: HTMLElement, index: number) => { begin: number; end: number },
) {
  const getBounds = (draggables: HTMLElement[], index: number) => (
    boundsOf ? boundsOf(draggables[index], index) : layout.getBeginEnd(draggables[index])
  );
  const find = (
    draggables: HTMLElement[],
    pos: number,
    startIndex: number,
    endIndex: number,
    withRespectToMiddlePoints = false
  ): number | null => {
    if (endIndex < startIndex) {
      return startIndex;
    }
    // binary serach draggable
    if (startIndex === endIndex) {
      let { begin, end } = getBounds(draggables, startIndex);
      // mouse pos is inside draggable
      // now decide which index to return
      // if (pos > begin && pos <= end) {
        if (withRespectToMiddlePoints) {
          return pos < (end + begin) / 2 ? startIndex : startIndex + 1;
        } else {
          return startIndex;
        }
      // } else {
      //   return null;
      // }
    } else {
      const middleIndex = Math.floor((endIndex + startIndex) / 2);
      const { begin, end } = getBounds(draggables, middleIndex);
      if (pos < begin) {
        return find(draggables, pos, startIndex, middleIndex - 1, withRespectToMiddlePoints);
      } else if (pos > end) {
        return find(draggables, pos, middleIndex + 1, endIndex, withRespectToMiddlePoints);
      } else {
        if (withRespectToMiddlePoints) {
          return pos < (end + begin) / 2 ? middleIndex : middleIndex + 1;
        } else {
          return middleIndex;
        }
      }
    }
  };

  return (draggables: HTMLElement[], pos: number, withRespectToMiddlePoints = false) => {
    return find(draggables, pos, 0, draggables.length - 1, withRespectToMiddlePoints);
  };
}

function resetDraggables({ element, draggables, layout }: ContainerProps) {
  return function () {
    draggables.forEach((p: ElementX) => {
      setAnimation(p, false);
      layout.setTranslation(p, 0);
      layout.setVisibility(p, true);
    });

    if (element[stretcherElementInstance]) {
      element[stretcherElementInstance].parentNode.removeChild(element[stretcherElementInstance]);
      element[stretcherElementInstance] = null;
    }
  };
}

function setTargetContainer(draggableInfo: DraggableInfo, element: HTMLElement, set = true) {
  if (element && set) {
    draggableInfo.targetElement = element;
  } else {
    if (draggableInfo.targetElement === element) {
      draggableInfo.targetElement = null;
    }
  }
}

function handleDrop({ element, draggables, layout, getOptions }: ContainerProps) {
  const draggablesReset = resetDraggables({ element, draggables, layout, getOptions });
  const dropHandler = (smoothDnD.dropHandler || domDropHandler)({ element, draggables, layout, getOptions });
  return function (draggableInfo: DraggableInfo, { addedIndex, removedIndex }: DragResult, forDispose: boolean = false) {
    draggablesReset();
    // if drop zone is valid => complete drag else do nothing everything will be reverted by draggablesReset()
    if (!draggableInfo.cancelDrop) {
      if (draggableInfo.targetElement || getOptions().removeOnDropOut || forDispose) {
        let actualAddIndex =
          addedIndex !== null ? (removedIndex !== null && removedIndex < addedIndex ? addedIndex - 1 : addedIndex) : null;
        const dropHandlerParams = {
          removedIndex,
          addedIndex: actualAddIndex,
          payload: draggableInfo.payload,
          // The DOM drop handler needs the node when this container is receiving an item it did
          // not own — it has no `removedIndex`, so nothing to move. Without this, any vanilla
          // cross-container drop threw and the item was removed from the source but never added
          // to the target. Framework adapters replace the handler entirely, which is why this
          // only ever affected vanilla usage.
          droppedElement: draggableInfo.element ? draggableInfo.element.firstElementChild : undefined,
        };
        dropHandler(dropHandlerParams, getOptions().onDrop);
      }
    }
  };
}

function getContainerProps(element: HTMLElement, getOptions: () => ContainerOptions): ContainerProps {
  const draggables = wrapChildren(element);
  const options = getOptions();
  // set flex classes before layout is inited for scroll listener
  addClass(element, `${containerClass} ${options.orientation}`);
  const layout = layoutManager(element, options.orientation!, options.animationDuration!);
  return {
    element,
    draggables,
    getOptions,
    layout,
  };
}

/**
 * Fix the feedback mode for this drag, once, on its first frame.
 *
 * The option may be a function of the source container's options and the payload — the same shape
 * as `shouldAcceptDrop` — so a board's columns can sort themselves with a gap yet show an
 * indicator when a card from another group is dragged across them.
 */
function resolveDropFeedback({ getOptions }: ContainerProps) {
  return ({ draggableInfo, dragResult }: DragInfo) => {
    if (dragResult.dropFeedback) {
      return null;
    }
    const option = getOptions().dropFeedback || 'gap';
    const resolved = typeof option === 'function'
      ? option(draggableInfo.container.getOptions(), draggableInfo.payload) || 'gap'
      : option;
    return { dropFeedback: resolved };
  };
}

function getRemovedItem({ element, getOptions }: ContainerProps) {
  let prevRemovedIndex: number | null = null;
  return ({ draggableInfo }: DragInfo) => {
    let removedIndex = prevRemovedIndex;
    if (prevRemovedIndex == null && draggableInfo.container.element === element && getOptions().behaviour !== 'copy') {
      removedIndex = prevRemovedIndex = draggableInfo.elementIndex;
    }

    return { removedIndex };
  };
}

function setRemovedItemVisibilty({ draggables, layout }: ContainerProps) {
  return ({ dragResult }: DragInfo) => {
    if (dragResult.removedIndex !== null) {
      layout.setVisibility(draggables[dragResult.removedIndex], false);
    }
  };
}

function getPosition({ element, layout }: ContainerProps) {
  return ({ draggableInfo }: DragInfo) => {
    let hitElement = document.elementFromPoint(draggableInfo.position.x, draggableInfo.position.y);

    // TODO: if center is out of bounds use mouse position for hittest
    // if (!hitElement) {
    //   hitElement = document.elementFromPoint(draggableInfo.mousePosition.x, draggableInfo.mousePosition.y);
    // }

    if (hitElement) {
      const container: IContainer = getParentRelevantContainerElement(hitElement, draggableInfo.relevantContainers);
      if (container && container.element === element) {
        return {
          pos: layout.getPosition(draggableInfo.position),
        }
      }
    }

    return {
      pos: null,
    };
  };
}

function getElementSize({ layout }: ContainerProps) {
  let elementSize: number | null = null;
  return ({ draggableInfo, dragResult }: DragInfo) => {
    if (dragResult.pos === null) {
      return (elementSize = null);
    } else {
      elementSize = elementSize || layout.getSize(draggableInfo.size);
    }
    return { elementSize };
  };
}

function handleTargetContainer({ element }: ContainerProps) {
  return ({ draggableInfo, dragResult }: DragInfo) => {
    setTargetContainer(draggableInfo, element, !!dragResult.pos);
  };
}

// Exported for tests — see note on findDraggebleAtPos.
export function getDragInsertionIndex(params: ContainerProps) {
  const { draggables, layout, getOptions } = params;
  const findDraggable = findDraggebleAtPos({ layout });

  return ({ dragResult: { shadowBeginEnd, pos } }: { dragResult: DragResult }) => {
    // With dropOnItems on, resolveDropOnItem owns the insertion index: it reads the live layout
    // and only moves the index when the pointer reaches an item's far edge. Returning null leaves
    // the previous index in place for the resolver to overwrite.
    if (getOptions().dropOnItems) {
      return null;
    }

    if (!shadowBeginEnd) {
      const index = findDraggable(draggables, pos, true);
      return index !== null ? index : draggables.length;
    } else {
      if (shadowBeginEnd.begin + shadowBeginEnd.beginAdjustment <= pos && shadowBeginEnd.end >= pos) {
        // position inside ghost
        return null;
      }
    }

    if (pos < shadowBeginEnd.begin + shadowBeginEnd.beginAdjustment) {
      return findDraggable(draggables, pos);
    } else if (pos > shadowBeginEnd.end) {
      return findDraggable(draggables, pos)! + 1;
    } else {
      return draggables.length;
    }
  };
}

function getDragInsertionIndexForDropZone() {
  return ({ dragResult: { pos } }: DragInfo) => {
    return pos !== null ? { addedIndex: 0 } : { addedIndex: null };
  };
}

function getShadowBeginEndForDropZone({ layout }: ContainerProps) {
  let prevAddedIndex: number | null = null;
  return ({ dragResult: { addedIndex } }: DragInfo) => {
    if (addedIndex !== prevAddedIndex) {
      prevAddedIndex = addedIndex;
      const { begin, end } = layout.getBeginEndOfContainer();
      return {
        shadowBeginEnd: {
          rect: layout.getTopLeftOfElementBegin(begin),
        },
      };
    }

    return null;
  };
}

function drawDropPlaceholder({ layout, element, getOptions }: ContainerProps) {
  let prevAddedIndex: number | null = null;
  return ({ dragResult: { elementSize, shadowBeginEnd, addedIndex, dropPlaceholderContainer, dropFeedback } }: DragInfo) => {
    const options = getOptions();
    if (options.dropPlaceholder && (dropFeedback || 'gap') === 'gap') {
      const { animationDuration, className, showOnTop } = typeof options.dropPlaceholder === 'boolean' ? {} as any as DropPlaceholderOptions : options.dropPlaceholder as DropPlaceholderOptions;
      if (addedIndex !== null) {
        if (!dropPlaceholderContainer) {
          const innerElement = document.createElement('div');
          const flex = document.createElement('div');
          flex.className = dropPlaceholderFlexContainerClass;
          innerElement.className = `${dropPlaceholderInnerClass} ${className || dropPlaceholderDefaultClass}`
          dropPlaceholderContainer = document.createElement('div') as HTMLDivElement;
          dropPlaceholderContainer.className = `${dropPlaceholderWrapperClass}`;
          dropPlaceholderContainer.style.position = 'absolute';

          if (animationDuration !== undefined) {
            dropPlaceholderContainer.style.transition = `all ${animationDuration}ms ease`;
          }

          dropPlaceholderContainer.appendChild(flex);
          flex.appendChild(innerElement);
          layout.setSize(dropPlaceholderContainer.style, elementSize + 'px');

          dropPlaceholderContainer.style.pointerEvents = 'none';

          if (showOnTop) {
            element.appendChild(dropPlaceholderContainer);
          } else {
            element.insertBefore(dropPlaceholderContainer, element.firstElementChild);
          }
        }

        if (prevAddedIndex !== addedIndex && shadowBeginEnd.dropArea) {
           layout.setBegin(dropPlaceholderContainer.style, (shadowBeginEnd.dropArea.begin) - layout.getBeginEndOfContainer().begin + 'px');
        }
        prevAddedIndex = addedIndex;

        return {
          dropPlaceholderContainer
        }
      } else {
        if (dropPlaceholderContainer && prevAddedIndex !== null) {
          element.removeChild(dropPlaceholderContainer!);
        }
        prevAddedIndex = null;

        return {
          dropPlaceholderContainer: undefined
        }
      }
    }

    return null;
  }
}

function invalidateShadowBeginEndIfNeeded(params: ContainerProps) {
  const shadowBoundsGetter = getShadowBeginEnd(params);
  return ({ draggableInfo, dragResult }: DragInfo) => {
    if (draggableInfo.invalidateShadow) {
      return shadowBoundsGetter({ draggableInfo, dragResult });
    }
    return null;
  };
}

function getNextAddedIndex(params: ContainerProps) {
  const getIndexForPos = getDragInsertionIndex(params);
  return ({ dragResult }: DragInfo) => {
    let index = null;
    if (dragResult.pos !== null) {
      index = getIndexForPos({ dragResult });
      if (index === null) {
        index = dragResult.addedIndex;
      }
    }
    return {
      addedIndex: index,
    };
  };
}

function resetShadowAdjustment() {
  let lastAddedIndex: number | null = null;
  return ({ dragResult: { addedIndex, shadowBeginEnd } }: DragInfo) => {
    if (addedIndex !== lastAddedIndex && lastAddedIndex !== null && shadowBeginEnd) {
      shadowBeginEnd.beginAdjustment = 0;
    }
    lastAddedIndex = addedIndex;
  };
}

function handleInsertionSizeChange({ element, draggables, layout, getOptions }: ContainerProps) {
  let strectherElement: HTMLElement | null = null;
  return function ({ dragResult: { addedIndex, removedIndex, elementSize, gapIndex, dropFeedback } }: DragInfo) {
    if ((dropFeedback || 'gap') !== 'gap') {
      return undefined;
    }
    // The stretcher tracks where the list is parted, which during a drop-onto hold differs from
    // the insertion index — see gapIndex.
    const partAt = gapIndex === undefined ? addedIndex : gapIndex;
    if (removedIndex === null) {
      if (partAt !== null) {
        if (!strectherElement) {
          const containerBeginEnd = layout.getBeginEndOfContainer();
          containerBeginEnd.end = containerBeginEnd.begin + layout.getSize(element);
          const hasScrollBar = layout.getScrollSize(element) > layout.getSize(element);
          const containerEnd = hasScrollBar
            ? containerBeginEnd.begin + layout.getScrollSize(element) - layout.getScrollValue(element)
            : containerBeginEnd.end;
          const lastDraggableEnd =
            draggables.length > 0
              ? layout.getBeginEnd(draggables[draggables.length - 1]).end - draggables[draggables.length - 1][translationValue]
              : containerBeginEnd.begin;
          if (lastDraggableEnd + elementSize > containerEnd) {
            strectherElement = window.document.createElement('div') as HTMLElement;
            strectherElement.className = stretcherElementClass + ' ' + getOptions().orientation;
            const stretcherSize = draggables.length > 0 ? elementSize + lastDraggableEnd - containerEnd : elementSize;
            layout.setSize(strectherElement.style, `${stretcherSize}px`);
            element.appendChild(strectherElement);
            element[stretcherElementInstance] = strectherElement;
            return {
              containerBoxChanged: true,
            };
          }
        }
      } else {
        if (strectherElement) {
          layout.setTranslation(strectherElement, 0);
          let toRemove = strectherElement;
          strectherElement = null;
          element.removeChild(toRemove);
          element[stretcherElementInstance] = null;
          return {
            containerBoxChanged: true,
          };
        }
      }
    }

    return undefined;
  };
}

// Exported for tests — see note on findDraggebleAtPos.
export function calculateTranslations({ draggables, layout }: ContainerProps) {
  let prevAddedIndex: number | null = null;
  let prevRemovedIndex: number | null = null;
  return function ({ dragResult: { addedIndex, removedIndex, elementSize, gapIndex, dropFeedback } }: { dragResult: DragResult }) {
    // Movement feedback belongs to gap mode alone. The mediator's drop-animation path calls this
    // with no resolved feedback, which means gap.
    if ((dropFeedback || 'gap') !== 'gap') {
      return null;
    }
    // Where the siblings part, which is not always where the item would land — see `gapIndex`.
    const partAt = gapIndex === undefined ? addedIndex : gapIndex;
    if (partAt !== prevAddedIndex || removedIndex !== prevRemovedIndex) {
      for (let index = 0; index < draggables.length; index++) {
        if (index !== removedIndex) {
          const draggable = draggables[index];
          let translate = 0;
          if (removedIndex !== null && removedIndex < index) {
            translate -= elementSize;
          }
          if (partAt !== null && partAt <= index) {
            translate += elementSize;
          }
          layout.setTranslation(draggable, translate);
        }
      }

      prevAddedIndex = partAt;
      prevRemovedIndex = removedIndex;

      return { removedIndex };
    }

    return undefined;
  };
}

// Exported for tests — see note on findDraggebleAtPos.
export function getShadowBeginEnd(params: ContainerProps) {
  const { draggables, layout } = params;
  let prevAddedIndex: number | null = null;
  return ({ draggableInfo, dragResult }: DragInfo) => {
    const { addedIndex, removedIndex, elementSize, pos, shadowBeginEnd, dropFeedback } = dragResult;

    // With `gap` feedback the siblings slide apart, so the hysteresis band straddles a real gap
    // and the reported drop area is the space being opened, which the placeholder fills. When
    // nothing moves, the band is widened to the neighbours' midpoints instead — it would otherwise
    // collapse to zero width and the index would flicker — and the drop area collapses to a
    // boundary line, since there is no space to describe.
    const stationary = (dropFeedback || 'gap') !== 'gap';
    const boundsOf = (index: number) => layout.getBeginEnd(draggables[index]);

    if (pos !== null) {
      if (addedIndex !== null && (draggableInfo.invalidateShadow || addedIndex !== prevAddedIndex)) {
        // if (prevAddedIndex) prevAddedIndex = addedIndex;
        let beforeIndex = addedIndex - 1;
        let begin = Number.MIN_SAFE_INTEGER;
        let dropAreaBegin = 0;
        let dropAreaEnd = 0;
        let afterBounds = null;
        let beforeBounds = null;
        // Skipping the dragged item is right under `gap`, where it has been translated out of the
        // way and its slot no longer exists. Under the stationary modes it has not moved: the slot
        // is still there, visibly empty, and its two edges are legitimate — and adjacent —
        // insertion boundaries. Skipping it there stretches the hysteresis band across two slots,
        // so the band swallows the whole hole and whichever edge you approach from is the only one
        // you can ever reach.
        if (!stationary && beforeIndex === removedIndex) {
          beforeIndex--;
        }
        if (beforeIndex > -1) {
          const beforeSize = layout.getSize(draggables[beforeIndex]);
          beforeBounds = boundsOf(beforeIndex);
          if (stationary) {
            begin = (beforeBounds.begin + beforeBounds.end) / 2;
          } else if (elementSize < beforeSize) {
            const threshold = (beforeSize - elementSize) / 2;
            begin = beforeBounds.end - threshold;
          } else {
            begin = beforeBounds.end;
          }
          dropAreaBegin = beforeBounds.end;
        } else {
          beforeBounds = { end: layout.getBeginEndOfContainer().begin };
          dropAreaBegin = layout.getBeginEndOfContainer().begin;
        }

        let end = Number.MAX_SAFE_INTEGER;
        let afterIndex = addedIndex;
        if (!stationary && afterIndex === removedIndex) {
          afterIndex++;
        }
        if (afterIndex < draggables.length) {
          const afterSize = layout.getSize(draggables[afterIndex]);
          afterBounds = boundsOf(afterIndex);

          if (stationary) {
            end = (afterBounds.begin + afterBounds.end) / 2;
          } else if (elementSize < afterSize) {
            const threshold = (afterSize - elementSize) / 2;
            end = afterBounds.begin + threshold;
          } else {
            end = afterBounds.begin;
          }
          dropAreaEnd = afterBounds.begin;
        } else {
          // Past the last item, so the drop area runs to the end of the container.
          //
          // This used to read `.end` and `.begin` off getContainerRectangles().rect, which is a raw
          // DOM rect with no such keys — so both were undefined and dropAreaEnd was NaN. It also
          // subtracted one from the other, producing a length where every other branch here assigns
          // a viewport coordinate. getBeginEndOfContainer() is the orientation-mapped accessor, and
          // returns a coordinate.
          const containerEnd = layout.getBeginEndOfContainer().end;
          afterBounds = { begin: containerEnd };
          dropAreaEnd = containerEnd;
        }

        if (stationary) {
          // For an indicator the drop area is a *boundary*, not a gap. Nothing is opening, so
          // reporting a span leaves the caller drawing a line through the middle of something.
          //
          // Most visibly the slot the dragged item just vacated: the neighbour lookup above skips
          // the removed item, so an insertion point either side of it reports the whole hole —
          // a full item tall — and a line drawn down the middle of that lands nowhere meaningful.
          // The same applies past the last item, where the area otherwise runs to the container's
          // end and can be arbitrarily tall.
          //
          // Note this deliberately does *not* skip the removed item: the boundary either side of
          // the hole is exactly where the indicator belongs.
          const boundary = addedIndex > 0
            ? boundsOf(addedIndex - 1).end
            : layout.getBeginEndOfContainer().begin;
          dropAreaBegin = boundary;
          dropAreaEnd = boundary;
        }

        const shadowRectTopLeft = beforeBounds && afterBounds ? layout.getTopLeftOfElementBegin(beforeBounds.end) : null;

        prevAddedIndex = addedIndex;
        return {
          shadowBeginEnd: {
            dropArea: {
              begin: dropAreaBegin,
              end: dropAreaEnd,
            },
            begin,
            end,
            rect: shadowRectTopLeft,
            beginAdjustment: shadowBeginEnd ? shadowBeginEnd.beginAdjustment : 0,
          },
        };

      } else {
        return null;
      }
    } else {
      prevAddedIndex = null;
      return {
        shadowBeginEnd: null,
      };
    }
  };
}

function handleFirstInsertShadowAdjustment() {
  let lastAddedIndex: number | null = null;
  return ({ dragResult: { pos, addedIndex, shadowBeginEnd } }: DragInfo) => {
    if (pos !== null) {
      if (addedIndex != null && lastAddedIndex === null) {
        if (pos < shadowBeginEnd.begin) {
          const beginAdjustment = pos - shadowBeginEnd.begin - 5;
          shadowBeginEnd.beginAdjustment = beginAdjustment;
        }
        lastAddedIndex = addedIndex;
      }
    } else {
      lastAddedIndex = null;
    }
  };
}

function fireDragEnterLeaveEvents({ getOptions }: ContainerProps) {
  let wasDragIn = false;
  const options = getOptions();
  return ({ dragResult: { pos } }: DragInfo) => {
    const isDragIn = !!pos;
    if (isDragIn !== wasDragIn) {
      wasDragIn = isDragIn;
      if (isDragIn) {
        options.onDragEnter && options.onDragEnter();
      } else {
        options.onDragLeave && options.onDragLeave();
      }
    }

    return undefined;
  };
}

/**
 * Resolve what the pointer is aimed at when drops onto items are enabled: an insertion point
 * (`at`) or an item itself (`into`).
 *
 * Everything is measured against the **live layout** — the positions the user can actually see —
 * and an item is only displaced when the pointer reaches its *far* quarter. That combination is
 * what lets `into` coexist with an opening gap, and both halves are load-bearing:
 *
 * - Resolving against any other frame draws the highlight somewhere the pointer visibly is not.
 *   (Resting positions were tried: the highlight appeared an item early whenever a gap was open.)
 * - Displacing at the *near* edge means the item dodges out from under the pointer the moment it
 *   is touched, so a stable hover region never exists and `into` can never trigger. Displacing at
 *   the far edge leaves the near quarter re-selecting the current insertion point (a no-op) and
 *   the middle free for `into` — react-beautiful-dnd's combine mode works the same way.
 *
 * While `into` is active the parting is held exactly where it was (`gapIndex`), so the layout
 * cannot move in response to this decision and feed back into it.
 */
export function resolveDropOnItem(params: ContainerProps) {
  const { draggables, layout, getOptions } = params;
  /**
   * Fraction of an item at each end that still counts as "between", not "onto" — a 35/30/35
   * split, so displacement happens 65% of the way across an item. Much later and sorting feels
   * reluctant next to the classic midpoint; much earlier and the into band is too thin to hit.
   */
  const edgeBand = 0.35;

  // Where the list is currently parted — the resolver's only memory, reset per drag because the
  // drag handler is rebuilt on every drop.
  let prevPartAt: number | null = null;

  return ({ dragResult: { pos, addedIndex, removedIndex } }: DragInfo) => {
    if (!getOptions().dropOnItems) {
      return addedIndex !== null
        ? { gapIndex: undefined, dropTarget: { kind: 'at' as const, index: addedIndex } }
        : { gapIndex: undefined, dropTarget: null };
    }

    if (pos === null) {
      prevPartAt = null;
      return { addedIndex: null, gapIndex: undefined, dropTarget: null };
    }

    const at = (index: number) => {
      prevPartAt = index;
      return { addedIndex: index, gapIndex: undefined, dropTarget: { kind: 'at' as const, index } };
    };

    /**
     * The pointer is between items — in the open gap, the vacated slot, or a margin.
     * `lo`..`hi` are the raw insertion indices whose boundaries fall inside this space.
     */
    const between = (spaceBegin: number, spaceEnd: number, lo: number, hi: number) => {
      // Inside the current parting: hold it. This is the whole of the `at` hysteresis.
      if (prevPartAt !== null && prevPartAt >= lo && prevPartAt <= hi) {
        return at(prevPartAt);
      }
      // Both edges of the space are legitimate boundaries — they differ only when the space is the
      // dragged item's vacated slot — so take the nearer one.
      return at(pos < (spaceBegin + spaceEnd) / 2 ? lo : hi);
    };

    let prevEnd = layout.getBeginEndOfContainer().begin;
    let prevRaw = 0;

    for (let index = 0; index < draggables.length; index++) {
      // The dragged item is hidden and its slot closed up; its stale bounds overlap a neighbour's.
      if (index === removedIndex) {
        continue;
      }

      const { begin, end } = layout.getBeginEnd(draggables[index]);

      if (pos < begin) {
        return between(prevEnd, begin, prevRaw, index);
      }

      if (pos < end) {
        // Over the item itself. The edge quarters resolve to the boundaries either side; because
        // the open gap sits on one side of the item, the quarter facing it re-selects the current
        // parting (no movement) and only the far quarter displaces the item.
        const offset = (pos - begin) / (end - begin);
        if (offset <= edgeBand) {
          return at(index);
        }
        if (offset >= 1 - edgeBand) {
          return at(index + 1);
        }
        // A drop onto the item: hold the parting exactly where it was.
        return { addedIndex: null, gapIndex: prevPartAt, dropTarget: { kind: 'into' as const, index } };
      }

      prevEnd = end;
      prevRaw = index + 1;
    }

    return between(prevEnd, layout.getBeginEndOfContainer().end, prevRaw, draggables.length);
  };
}

/**
 * Turn the insertion point into a rectangle the application can render.
 *
 * The whole point of `dropFeedback: 'indicator'` is that the consumer should not have to do this
 * arithmetic itself — measuring items, bisecting them, and inventing sentinels for the ends of the
 * list. `getShadowBeginEnd` has already worked out the gap along the layout axis; this spans it
 * across the other axis and converts it into both coordinate spaces.
 */
export function computeDropIndicator({ element, draggables, layout, getOptions }: ContainerProps) {
  return ({ dragResult: { addedIndex, shadowBeginEnd, dropTarget, dropFeedback } }: DragInfo) => {
    const intoTarget = !!dropTarget && dropTarget.kind === 'into';

    // An `into` target is reported in every feedback mode, because no mode has a way of showing it
    // otherwise — there is no gap to open, so without bounds the application has nothing to draw.
    if ((dropFeedback || 'gap') !== 'indicator' && !intoTarget) {
      // Gap mode draws no `at` indicator, but a stale `into` outline from the previous frame must
      // still be cleared once the target stops being one.
      return getOptions().dropOnItems ? { dropIndicator: null } : null;
    }

    const rect = layout.getContainerRectangles().rect;

    // Dropping onto an item: outline the item, not a gap between two.
    if (intoTarget && dropTarget && draggables[dropTarget.index]) {
      const bounds = layout.getBeginEnd(draggables[dropTarget.index]);
      return { dropIndicator: buildIndicator(element, rect, bounds.begin, bounds.end - bounds.begin, getOptions()) };
    }

    if (addedIndex === null || !shadowBeginEnd || !shadowBeginEnd.dropArea) {
      return { dropIndicator: null };
    }

    const { begin, end } = shadowBeginEnd.dropArea;
    const size = Math.max(0, end - begin);

    return { dropIndicator: buildIndicator(element, rect, begin, size, getOptions()) };
  };
}

/** Span `begin`..`begin + size` on the layout axis, and the whole container on the other. */
function buildIndicator(element: HTMLElement, rect: any, begin: number, size: number, options: ContainerOptions) {
  const viewport = options.orientation === 'horizontal'
    ? { left: begin, width: size, top: rect.top, height: rect.bottom - rect.top }
    : { top: begin, height: size, left: rect.left, width: rect.right - rect.left };

  return {
    viewport,
    relative: {
      top: viewport.top - rect.top,
      left: viewport.left - rect.left,
      width: viewport.width,
      height: viewport.height,
    },
    container: element,
  };
}

function fireOnDropReady({ getOptions }: ContainerProps) {
  let lastAddedIndex: number | null = null;
  const options = getOptions();
  let lastKey: string | null = null;
  return ({ dragResult: { addedIndex, removedIndex, dropIndicator, dropTarget }, draggableInfo: { payload, element } }: DragInfo) => {
    // An `into` target has no addedIndex, so key off the resolved target as well — otherwise
    // moving between items would go unreported.
    const key = dropTarget ? `${dropTarget.kind}:${dropTarget.index}` : null;
    const changed = key !== lastKey;
    lastKey = key;

    if (options.onDropReady && (addedIndex !== null || (dropTarget && dropTarget.kind === 'into')) && changed) {
      lastAddedIndex = addedIndex;
      let adjustedAddedIndex = addedIndex as number;

      if (addedIndex !== null && removedIndex !== null && addedIndex > removedIndex) {
        adjustedAddedIndex--;
      }

      options.onDropReady({
        addedIndex: adjustedAddedIndex,
        removedIndex,
        payload,
        element: element ? element.firstElementChild as HTMLElement : undefined,
        dropIndicator,
        dropTarget,
      });
    }
  };
}

function getDragHandler(params: ContainerProps) {
  if (params.getOptions().behaviour === 'drop-zone') {
    // sorting is disabled in container, addedIndex will always be 0 if dropped in
    return compose(params)(
      getRemovedItem,
      setRemovedItemVisibilty,
      getPosition,
      getElementSize,
      handleTargetContainer,
      getDragInsertionIndexForDropZone,
      getShadowBeginEndForDropZone,
      fireDragEnterLeaveEvents,
      fireOnDropReady
    );
  }

  // One composition for every feedback mode. The mode is fixed per drag by resolveDropFeedback,
  // and the stages that move things — the stretcher, the translations, the placeholder — gate
  // themselves on it, which is what lets `dropFeedback` be a function of the drag rather than a
  // property of the container.
  return compose(params)(
    resolveDropFeedback,
    getRemovedItem,
    setRemovedItemVisibilty,
    getPosition,
    getElementSize,
    handleTargetContainer,
    invalidateShadowBeginEndIfNeeded,
    getNextAddedIndex,
    resolveDropOnItem,
    resetShadowAdjustment,
    handleInsertionSizeChange,
    calculateTranslations,
    getShadowBeginEnd,
    computeDropIndicator,
    drawDropPlaceholder,
    handleFirstInsertShadowAdjustment,
    fireDragEnterLeaveEvents,
    fireOnDropReady
  );
}

function getDefaultDragResult() {
  return {
    addedIndex: null,
    removedIndex: null,
    elementSize: null,
    pos: null,
    shadowBeginEnd: null,
  };
}

function compose(params: any) {
  return (...functions: any[]) => {
    const hydratedFunctions = functions.map(p => p(params));
    let result: DragResult | null = null;
    return (draggableInfo: DraggableInfo) => {
      result = hydratedFunctions.reduce((dragResult, fn) => {
        return Object.assign(dragResult, fn({ draggableInfo, dragResult }));
      }, result || getDefaultDragResult());
      return result;
    };
  };
}

// Container definition begin
function Container(element: HTMLElement): (options?: ContainerOptions) => IContainer {
  return function (options?: ContainerOptions): IContainer {
    let containerOptions = Object.assign({}, defaultOptions, options);
    let dragResult: DragResult | null = null;
    let lastDraggableInfo: DraggableInfo | null = null;
    const props = getContainerProps(element, getOptions);
    let dragHandler = getDragHandler(props);
    let dropHandler = handleDrop(props);
    let scrollListener = listenScrollParent(element, onScroll);

    function processLastDraggableInfo() {
      if (lastDraggableInfo !== null) {
        lastDraggableInfo.invalidateShadow = true;
        dragResult = dragHandler(lastDraggableInfo!);
        lastDraggableInfo.invalidateShadow = false;
      }
    }

    function setDraggables(draggables: HTMLElement[], element: HTMLElement) {
      const newDraggables = wrapChildren(element);
      for (let i = 0; i < newDraggables.length; i++) {
        draggables[i] = newDraggables[i];
      }

      for (let i = 0; i < draggables.length - newDraggables.length; i++) {
        draggables.pop();
      }
    }

    function prepareDrag(container: IContainer, relevantContainers: IContainer[]) {
      const element = container.element;
      const draggables = props.draggables;
      setDraggables(draggables, element);
      container.layout.invalidateRects();
      draggables.forEach(p => setAnimation(p, true, getOptions().animationDuration));
      scrollListener.start();
    }

    function onScroll() {
      props.layout.invalidateRects();
      processLastDraggableInfo();
    };

    function dispose(container: IContainer) {
      scrollListener.dispose();
      props.layout.dispose();
      unwrapChildren(container.element);

      // Undo everything setup applied to the element. Leaving the container class behind is not
      // cosmetic: getParent() walks ancestors looking for it during mousedown, so a disposed-but-
      // still-mounted element would keep advertising a container that is no longer registered.
      removeClass(container.element, containerClass);
      if (getOptions().orientation) {
        removeClass(container.element, getOptions().orientation!);
      }
      delete (container.element as ElementX)[containerInstance];
    }

    function setOptions(options: ContainerOptions, merge = true) {
      if (merge === false) {
        containerOptions = Object.assign({}, defaultOptions, options);
      } else {
        containerOptions = Object.assign({}, defaultOptions, containerOptions, options);
      }
    }

    function getOptions(): ContainerOptions {
      return containerOptions;
    }

    const container: IContainer = {
      element,
      draggables: props.draggables,
      isDragRelevant: isDragRelevant(props),
      layout: props.layout,
      dispose,
      prepareDrag,
      handleDrag(draggableInfo: DraggableInfo) {
        lastDraggableInfo = draggableInfo;
        dragResult = dragHandler(draggableInfo);
        return dragResult;
      },
      handleDrop(draggableInfo: DraggableInfo) {
        scrollListener.stop();
        if (dragResult && dragResult.dropPlaceholderContainer) {
          element.removeChild(dragResult.dropPlaceholderContainer);
        }
        lastDraggableInfo = null;       
        dragHandler = getDragHandler(props);
        dropHandler(draggableInfo, dragResult!);
        dragResult = null;
      },
      fireRemoveElement() {
        // will be called when container is disposed while dragging so ignore addedIndex
        dropHandler(lastDraggableInfo!, Object.assign({}, dragResult!, { addedIndex: null }), true);
        dragResult = null;
      },
      getDragResult() {
        return dragResult;
      },
      getTranslateCalculator(dragresult: { dragResult: DragResult }) {
        return calculateTranslations(props)(dragresult);
      },
      onTranslated: () => {
        processLastDraggableInfo();
      },
      setDraggables: () => {
        setDraggables(props.draggables, element);
      },
      getScrollMaxSpeed() {
        return smoothDnD.maxScrollSpeed;
      },
      shouldUseTransformForGhost() {
        return smoothDnD.useTransformForGhost === true;
      },
      getOptions,
      setOptions,
    };

    return container;
  };
}

// exported part of container
const smoothDnD: SmoothDnDCreator = function (element: HTMLElement, options?: ContainerOptions): SmoothDnD {
  const containerIniter = Container(element);
  const container = containerIniter(options);
  (element as ElementX)[containerInstance] = container;
  Mediator.register(container);
  return {
    dispose() {
      Mediator.unregister(container);
      container.dispose(container);
    },
    setOptions(options: ContainerOptions, merge?: boolean) {
      container.setOptions(options, merge);
    }
  };
};

// wrap all draggables by default 
// in react,vue,angular this value will be set to false
smoothDnD.wrapChild = true;
smoothDnD.cancelDrag = function () {
  Mediator.cancelDrag();
}

smoothDnD.isDragging = function () {
  return Mediator.isDragging();
}

smoothDnD.onDropComplete = function (handler) {
  return Mediator.onDropComplete(handler);
}

// Accessor rather than a plain property: the flag lives in the mediator, which owns the listener.
Object.defineProperty(smoothDnD, 'cancelOnEscape', {
  get: () => Mediator.getCancelOnEscape(),
  set: (value: boolean) => Mediator.setCancelOnEscape(value),
});

export default smoothDnD;
