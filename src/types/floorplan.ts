// Core data types for floorplan drawing

export interface Point {
  id: string;
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  startPointId: string;
  endPointId: string;
  thickness: number;
  style: 'solid' | 'dashed';
}

export interface Room {
  id: string;
  name: string;
  wallIds: string[];
  fill?: string;
}

export type DrawingMode = 'draw' | 'select' | 'pan' | 'erase';

export interface FloorplanState {
  points: Map<string, Point>;
  walls: Map<string, Wall>;
  rooms: Map<string, Room>;
  selectedIds: Set<string>;
  mode: DrawingMode;
  gridSize: number;
  snapToGrid: boolean;
  // For undo/redo
  history: FloorplanSnapshot[];
  historyIndex: number;
}

// Snapshot for undo/redo
export interface FloorplanSnapshot {
  points: Map<string, Point>;
  walls: Map<string, Wall>;
  rooms: Map<string, Room>;
  selectedIds: Set<string>;
}

// Action types for reducer
export type FloorplanAction =
  | { type: 'ADD_POINT'; point: Point }
  | { type: 'ADD_WALL'; wall: Wall }
  | { type: 'REMOVE_WALL'; wallId: string }
  | { type: 'SELECT'; ids: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_MODE'; mode: DrawingMode }
  | { type: 'SET_SNAP_TO_GRID'; enabled: boolean }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_ALL' };

// Serializable format for save/load
export interface FloorplanData {
  version: string;
  metadata: {
    name: string;
    created: string;
    modified: string;
  };
  points: Point[];
  walls: Wall[];
  rooms: Room[];
}
