export interface FloorplanExport {
  version: string;
  timestamp: string;
  data: {
    vertices: Record<string, { x: number; y: number }>;
    edges: Record<string, { startId: string; endId: string; thickness: number }>;
    surfaces: Record<string, { edgeIds: string[]; area: number; label?: string }>;
  };
  metadata: {
    totalArea: number;
    roomCount: number;
    wallCount: number;
  };
}
