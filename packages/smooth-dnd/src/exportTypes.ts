export interface SmoothDnD {
	dispose: () => void;
	setOptions: (options: ContainerOptions, merge?: boolean) => void;	
}

export type SmoothDnDCreator = ((element: HTMLElement, options?: ContainerOptions) => SmoothDnD) & {
	dropHandler?: any;
	wrapChild?: boolean;
	maxScrollSpeed?: number;
	useTransformForGhost?: boolean;
	cancelDrag: () => void;
	isDragging: () => boolean;
	/**
	 * Subscribe to the end of every drag, reported once.
	 *
	 * Returns an unsubscribe function. This is deliberately global rather than a container option:
	 * a drag spans containers, and no single one of them owns the outcome.
	 */
	onDropComplete: (handler: DropCompleteCallback) => () => void;
	/**
	 * Whether pressing Escape cancels an in-progress drag. Defaults to true.
	 *
	 * Set false to own the key yourself — the listener runs in the capture phase, so it would
	 * otherwise take precedence over an application's own Escape handling.
	 */
	cancelOnEscape?: boolean;
};

type Callback<T> = (params: T) => void;

export interface DropResult {
	removedIndex: number | null;
	addedIndex: number | null;
	payload?: any;
	element?: HTMLElement;
	/**
	 * Where a drop indicator should be drawn, when the container is in `dropFeedback: 'indicator'`
	 * mode. Null while the pointer is not over the container.
	 */
	dropIndicator?: DropIndicator | null;
	/** How and where the item would land. Present once the pointer is over a container. */
	dropTarget?: DropTarget | null;
}

/**
 * How an item lands.
 *
 * - `at` — between items, at `index`
 * - `into` — onto the item at `index`, which is what trees and folders need
 */
export type DropKind = 'at' | 'into';

export interface DropTarget {
	kind: DropKind;
	/** The insertion point for `at`, or the index of the item being dropped onto for `into`. */
	index: number;
}

/** A rectangle in the CSS sense — an origin and a size, ready to position an element with. */
export interface Box {
	top: number;
	left: number;
	width: number;
	height: number;
}

/**
 * Where the item would land, as a rectangle rather than an index.
 *
 * Spans the gap the item would occupy: along the layout axis it runs from the end of the preceding
 * item to the start of the following one, and across the other axis it spans the container. Draw a
 * line down the middle of it, or fill it — the shape is deliberately not opinionated.
 *
 * At the ends of a list, and in an empty container, it runs to the container's own bounds.
 */
export interface DropIndicator {
	/** Viewport coordinates, as `getBoundingClientRect` would report them. */
	viewport: Box;
	/**
	 * Relative to the container's border box. This is what an absolutely-positioned overlay inside
	 * the container wants, and saves the caller doing the subtraction.
	 */
	relative: Box;
	/** The container the indicator belongs to. */
	container: HTMLElement;
}

export interface DropPlaceholderOptions {
	className?: string;
	animationDuration?: number;
	showOnTop?: boolean;
}

/** One end of a completed drag — where the item came from, or where it landed. */
export interface DropEndpoint {
	/** The container element. */
	element: HTMLElement;
	/** Whatever `containerId` the container was configured with, if any. */
	containerId?: string | number;
	options: ContainerOptions;
	/** Index within that container. */
	index: number;
	/**
	 * How the item landed here. `at` means it was inserted at `index`; `into` means it was dropped
	 * onto the item at `index`. Always `at` for the `from` end.
	 */
	kind: DropKind;
}

/**
 * What the drag actually did.
 *
 * `none` covers every drag that changed nothing: cancelled, dropped back where it started, or
 * dropped outside a container that wasn't configured to remove on drop out.
 */
export type DropAction = 'reorder' | 'move' | 'copy' | 'remove' | 'none';

/**
 * The result of a whole drag, reported once.
 *
 * Distinct from `DropResult`, which is per-container and therefore arrives two or more times for a
 * single cross-container move.
 */
export interface DropCompleteResult {
	action: DropAction;
	/** Where the item came from. Null only if its container was unregistered mid-drag. */
	from: DropEndpoint | null;
	/** Where it landed. Null if it was dropped outside every relevant container. */
	to: DropEndpoint | null;
	payload?: any;
	/** True when the pointer was released outside every relevant container. */
	droppedOutside: boolean;
	/** True when the drag was cancelled rather than dropped. */
	cancelled: boolean;
}

export type DropCompleteCallback = Callback<DropCompleteResult>;

export interface DragStartParams { isSource: boolean; payload: any; willAcceptDrop: boolean }
export interface DragEndParams { isSource: boolean; payload: any; willAcceptDrop: boolean }

export type DragStartCallback = Callback<DragStartParams>;
export type DragEndCallback = Callback<DragEndParams>;
export type OnDropCallback = Callback<DropResult>;
export type OnDropReadyCallback = Callback<DropResult>;


export interface ContainerOptions {
	behaviour?: 'move' | 'copy' | 'drop-zone' | 'contain';
	/**
	 * Opaque identifier echoed back on drop results, so a handler can tell containers apart without
	 * closing over them at the call site. Not used by the engine for anything else.
	 */
	containerId?: string | number;
	/**
	 * How a pending drop is shown.
	 *
	 * - `gap` (default) — slide the siblings apart to open a space, the historical behaviour
	 * - `indicator` — leave the siblings alone and report where the drop would land, as bounds on
	 *   `onDropReady`, so the application can draw its own indicator
	 * - `none` — leave the siblings alone and draw nothing
	 *
	 * Orthogonal to `behaviour`, which describes what a drop *means* rather than how it looks.
	 */
	dropFeedback?: 'gap' | 'indicator' | 'none';
	/**
	 * Allow dropping *onto* an item as well as between items — what trees and folders need.
	 *
	 * The middle half of each item resolves to `into`; the quarter at either end still resolves to
	 * an insertion point, so reordering keeps working.
	 *
	 * **Requires `dropFeedback` to be `indicator` or `none`**, and is ignored under `gap`. Once a gap
	 * opens the layout has already moved to accommodate an insertion, so there is no longer an item
	 * under the pointer to drop into, and the two kinds of feedback would fight each other.
	 */
	dropOnItems?: boolean;
	groupName?: string; // if not defined => container will not interfere with other containers
	orientation?: 'vertical' | 'horizontal';
	dragHandleSelector?: string;
	nonDragAreaSelector?: string;
	dragBeginDelay?: number;
	animationDuration?: number;
	autoScrollEnabled?: boolean;
	lockAxis?: 'x' | 'y';
	dragClass?: string;
	dropClass?: string;
	onDragStart?: DragStartCallback;
	onDrop?: OnDropCallback;
	getChildPayload?: (index: number) => any;
	shouldAnimateDrop?: (sourceContainerOptions: ContainerOptions, payload: any) => boolean;
	shouldAcceptDrop?: (sourceContainerOptions: ContainerOptions, payload: any) => boolean;
	onDragEnter?: () => void;
	onDragLeave?: () => void;
	onDropReady?: OnDropReadyCallback;
	removeOnDropOut?: boolean;
	getGhostParent?: () => HTMLElement;
	onDragEnd?: DragEndCallback;
	dropPlaceholder?: DropPlaceholderOptions | boolean;	
}
