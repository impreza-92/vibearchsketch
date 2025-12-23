export interface Vertex {
  id: string;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  startVertexId: string;
  endVertexId: string;
}

export interface Surface {
  id: string;
  edgeIds: string[];
  area: number;
  name: string;
  centroid: { x: number; y: number };
}

export interface DrawingSettings {
  resolution: number;
}

export type DrawingMode = 'select' | 'draw' | 'erase';
