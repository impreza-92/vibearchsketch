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
  style?: string;
}

export interface Surface {
  id: string;
  edgeIds: string[];
  area: number;
  name: string;
  centroid: { x: number; y: number };
  fill?: string;
}

export type DrawingMode = 'select' | 'draw' | 'erase';
