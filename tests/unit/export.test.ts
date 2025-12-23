import { describe, it, expect } from 'vitest';
import { SpatialGraph } from '../../src/utils/spatialGraph';
import { generateJSON, generateCSV } from '../../src/utils/export';
import { createRectangle } from '../helpers/mockData';

describe('Export Utils', () => {
  const createMockGraph = () => {
    const graph = new SpatialGraph();
    const { vertices, edges } = createRectangle(0, 0, 100, 100);
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    return graph;
  };

  it('should generate valid JSON', () => {
    const graph = createMockGraph();
    const json = generateJSON(graph);
    const data = JSON.parse(json);

    expect(data).toHaveProperty('vertices');
    expect(data).toHaveProperty('edges');
    expect(data).toHaveProperty('surfaces');
    expect(data.vertices.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);
  });

  it('should generate valid CSV for walls and rooms', () => {
    const graph = createMockGraph();
    // Ensure surfaces are detected for the mock graph
    // addEdge already calls detectAllSurfaces, but let's be sure
    graph.detectAllSurfaces();
    
    const { walls, rooms } = generateCSV(graph, 0.1);

    // Check Walls CSV
    const wallLines = walls.split('\n');
    expect(wallLines[0]).toBe('ID,Start X,Start Y,End X,End Y,Length (mm)');
    // Header + at least one row
    expect(wallLines.length).toBeGreaterThan(1);
    
    // Check Rooms CSV
    const roomLines = rooms.split('\n');
    expect(roomLines[0]).toBe('ID,Name,Area (m²)');
    
    expect(roomLines.length).toBeGreaterThan(1); // Header + 1 room
    const roomData = roomLines[1].split(',');
    expect(roomData.length).toBe(3); // ID, Name, Area
    
    // Area check: 100px * 100px = 10000px^2
    // pixelsPerMm = 0.1 => 1px = 10mm
    // 100px = 1000mm = 1m
    // Area = 1m * 1m = 1m^2
    expect(parseFloat(roomData[2])).toBeCloseTo(1.0, 2);
  });
});
