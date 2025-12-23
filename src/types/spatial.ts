// Core data types for spatial graph structure

export interface Vertex {
  id: string;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  startVertexId: string;
  endVertexId: string;
  thickness: number;
  style: 'solid' | 'dashed';
}

export interface Surface {
  id: string;
  name: string;
  edgeIds: string[];
  centroid: { x: number; y: number }; // Center point for label
  area: number; // Area in square pixels
  fill?: string;
}

export type DrawingMode = 'draw' | 'select' | 'pan' | 'erase';

export interface MeasurementSettings {
  pixelsPerMm: number; // How many pixels = 1 millimeter
  showMeasurements: boolean; // Toggle edge length labels
}

export interface SpatialState {
  vertices: Map<string, Vertex>;
  edges: Map<string, Edge>;
  surfaces: Map<string, Surface>;
  selectedIds: Set<string>;
  mode: DrawingMode;
  gridSize: number;
  snapToGrid: boolean;
  measurement: MeasurementSettings;
}

// Action types for reducer
export type SpatialAction =
  | { type: 'ADD_VERTEX'; vertex: Vertex }
  | { type: 'DRAW_EDGE'; startVertex: Vertex; endVertex: Vertex; edge: Edge; startVertexExists: boolean; endVertexExists: boolean }
  | { type: 'ADD_EDGE'; edge: Edge }
  | { type: 'REMOVE_EDGE'; edgeId: string }
  | { type: 'SPLIT_EDGE'; edgeId: string; splitVertex: Vertex }
  | { type: 'ADD_SURFACE'; surface: Surface }
  | { type: 'UPDATE_SURFACE'; surfaceId: string; updates: Partial<Surface> }
  | { type: 'REMOVE_SURFACE'; surfaceId: string }
  | { type: 'DETECT_SURFACES' }
  | { type: 'SELECT'; ids: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_MODE'; mode: DrawingMode }
  | { type: 'SET_SNAP_TO_GRID'; enabled: boolean }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'SET_PIXELS_PER_MM'; value: number }
  | { type: 'SET_SHOW_MEASUREMENTS'; show: boolean }
  | { type: 'CLEAR_ALL' }
  | { type: 'UNDO' }
  | { type: 'REDO' };
