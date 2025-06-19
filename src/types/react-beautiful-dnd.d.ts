declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  // DraggableId is a string
  export type DraggableId = string;
  // DroppableId is a string
  export type DroppableId = string;

  export interface DraggableLocation {
    droppableId: DroppableId;
    index: number;
  }

  export type MovementMode = 'FLUID' | 'SNAP';

  export interface DragStart {
    draggableId: DraggableId;
    type: TypeId;
    source: DraggableLocation;
    mode: MovementMode;
  }

  export interface DropResult {
    draggableId: DraggableId;
    type: TypeId;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    reason: 'DROP' | 'CANCEL';
    mode: MovementMode;
  }

  export type TypeId = string;

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    placeholder: React.ReactElement | null;
    droppableProps: {
      [key: string]: any;
    };
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith: DraggableId | null;
    draggingFromThisWith: DraggableId | null;
    isUsingPlaceholder: boolean;
  }

  export interface DroppableProps {
    droppableId: DroppableId;
    type?: TypeId;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    renderClone?: DraggableChildrenFn;
    getContainerForClone?: () => HTMLElement;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
  }

  export class Droppable extends React.Component<DroppableProps> {}

  export interface DraggableProvided {
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps: {
      [key: string]: any;
    } | null;
    innerRef: (element: HTMLElement | null) => void;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    dropAnimation: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
      opacity: number;
      scale: number;
    } | null;
    draggingOver: DroppableId | null;
    combineWith: DraggableId | null;
    combineTargetFor: DraggableId | null;
    mode: MovementMode | null;
  }

  export type DraggableChildrenFn = (
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot,
    rubric: DraggableRubric,
  ) => React.ReactElement;

  export interface DraggableProps {
    draggableId: DraggableId;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    children: DraggableChildrenFn;
  }

  export interface DraggableRubric {
    draggableId: DraggableId;
    type: TypeId;
    source: DraggableLocation;
  }

  export class Draggable extends React.Component<DraggableProps> {}

  export interface DragDropContextProps {
    onBeforeDragStart?(initial: DragStart): void;
    onDragStart?(initial: DragStart, provided: ResponderProvided): void;
    onDragUpdate?(initial: DragUpdate, provided: ResponderProvided): void;
    onDragEnd(result: DropResult, provided: ResponderProvided): void;
    children: React.ReactNode;
    dragHandleUsageInstructions?: string;
    nonce?: string;
    enableDefaultSensors?: boolean;
    sensors?: Sensor[];
  }

  export interface DragUpdate extends DragStart {
    destination: DraggableLocation | null;
    combine: Combine | null;
  }

  export interface Combine {
    draggableId: DraggableId;
    droppableId: DroppableId;
  }

  export interface ResponderProvided {
    announce: Announce;
  }

  export type Announce = (message: string) => void;

  export interface Sensor {
    // Unique identifier for the sensor
    sensor: string;

    // Lifecycle
    onBeforeCapture?: () => void;
    onBeforeDragStart?: (start: DragStart) => void;
    onDragStart?: (start: DragStart) => void;
    onDragUpdate?: (update: DragUpdate) => void;
    onDragEnd?: (result: DropResult) => void;
  }

  export class DragDropContext extends React.Component<DragDropContextProps> {}
}
