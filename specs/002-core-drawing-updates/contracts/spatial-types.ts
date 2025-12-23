export interface Edge {
  id: string;
  startVertexId: string;
  endVertexId: string;
  // Removed: thickness, style
}

export interface DrawingSettings {
  resolution: number; // e.g., 1, 10, 100, 1000
}

export interface Room {
  id: string;
  edgeIds: string[];
  area: number;
  name: string;
  centroid: { x: number; y: number };
  fill?: string;
}

export interface SpatialState {
  edges: Record<string, Edge>;
  drawingSettings: DrawingSettings;
  // ... other state
}
