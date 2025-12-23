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
  centroid: { x: number; y: number }; // Center point for label
  area: number; // Area in square pixels
  fill?: string;
}

export type DrawingMode = 'draw' | 'select' | 'pan' | 'erase';

export interface MeasurementSettings {
  pixelsPerMm: number; // How many pixels = 1 millimeter
  showMeasurements: boolean; // Toggle wall length labels
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
}

// Action types for reducer
export type FloorplanAction =
  | { type: 'ADD_POINT'; point: Point }
  | { type: 'DRAW_WALL'; startPoint: Point; endPoint: Point; wall: Wall; startPointExists: boolean; endPointExists: boolean }
  | { type: 'ADD_WALL'; wall: Wall }
  | { type: 'REMOVE_WALL'; wallId: string }
  | { type: 'SPLIT_WALL'; wallId: string; splitPoint: Point } // Split wall at point
  | { type: 'ADD_ROOM'; room: Room }
  | { type: 'UPDATE_ROOM'; roomId: string; updates: Partial<Room> }
  | { type: 'REMOVE_ROOM'; roomId: string }
  | { type: 'DETECT_ROOMS' } // Detect all rooms in the current floorplan
  | { type: 'SELECT'; ids: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_MODE'; mode: DrawingMode }
  | { type: 'SET_SNAP_TO_GRID'; enabled: boolean }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'SET_PIXELS_PER_MM'; value: number }
  | { type: 'SET_SHOW_MEASUREMENTS'; show: boolean }
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
