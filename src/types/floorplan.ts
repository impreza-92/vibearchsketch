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

export type UnitSystem = 'metric' | 'imperial';

export interface MeasurementSettings {
  pixelsPerUnit: number; // How many pixels = 1 real-world unit
  unitSystem: UnitSystem; // 'metric' (meters) or 'imperial' (feet)
  showMeasurements: boolean; // Toggle wall length labels
  precision: number; // Decimal places for measurements (0-3)
}

export interface FloorplanState {
  points: Map<string, Point>;
  walls: Map<string, Wall>;
  rooms: Map<string, Room>;
  selectedIds: Set<string>;
  mode: DrawingMode;
  gridSize: number;
  snapToGrid: boolean;
  measurement: MeasurementSettings;
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
  | { type: 'SET_PIXELS_PER_UNIT'; value: number }
  | { type: 'SET_UNIT_SYSTEM'; system: UnitSystem }
  | { type: 'SET_SHOW_MEASUREMENTS'; show: boolean }
  | { type: 'SET_MEASUREMENT_PRECISION'; precision: number }
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
