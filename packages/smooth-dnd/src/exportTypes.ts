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
};

type Callback<T> = (params: T) => void;

export interface DropResult {
	removedIndex: number | null;
	addedIndex: number | null;
	payload?: any;
	element?: HTMLElement;
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
