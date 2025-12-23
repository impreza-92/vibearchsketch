import { SpatialGraph } from './spatialGraph';

export const generateJSON = (graph: SpatialGraph): string => {
  const data = {
    vertices: Array.from(graph.getVertices().values()),
    edges: Array.from(graph.getEdges().values()),
    surfaces: Array.from(graph.getSurfaces().values()),
  };
  return JSON.stringify(data, null, 2);
};

export const generateCSV = (graph: SpatialGraph, pixelsPerMm: number = 0.1): { walls: string; rooms: string } => {
  // Walls CSV
  const wallsHeader = 'ID,Start X,Start Y,End X,End Y,Length (mm)\n';
  const wallsRows = Array.from(graph.getEdges().values())
    .map((edge) => {
      const start = graph.getVertex(edge.startVertexId);
      const end = graph.getVertex(edge.endVertexId);
      if (!start || !end) return '';
      
      const lengthPx = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      const lengthMm = lengthPx / pixelsPerMm;
      
      return `${edge.id},${start.x},${start.y},${end.x},${end.y},${lengthMm.toFixed(2)}`;
    })
    .filter((row) => row !== '')
    .join('\n');

  // Rooms CSV
  const roomsHeader = 'ID,Name,Area (m²)\n';
  const roomsRows = Array.from(graph.getSurfaces().values())
    .map((surface) => {
      const areaMm2 = surface.area / (pixelsPerMm * pixelsPerMm);
      const areaM2 = areaMm2 / 1000000;
      return `${surface.id},${surface.name},${areaM2.toFixed(2)}`;
    })
    .join('\n');

  return {
    walls: wallsHeader + wallsRows,
    rooms: roomsHeader + roomsRows,
  };
};
