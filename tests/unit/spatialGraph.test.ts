import { describe, test, expect, beforeEach } from 'vitest';
import { SpatialGraph } from '../../src/utils/spatialGraph';
import { Vertex, Edge } from '../../src/types/spatial';
import {
  createRectangle,
  createTriangle,
  createTwoAdjacentRooms,
  createFourRoomGrid,
  createLShapedRoom,
  createOpenPath,
  createThreeRoomLShape,
  createRectangleWithFilament,
  createSquareWithDiagonal,
} from '../helpers/mockData';

// Helper to convert Map to Array
function surfacesToArray(surfacesMap: ReturnType<SpatialGraph['getSurfaces']>) {
  return Array.from(surfacesMap.values());
}

describe('SpatialGraph - Core Operations', () => {
  let graph: SpatialGraph;

  beforeEach(() => {
    graph = new SpatialGraph();
  });

  describe('Vertex Operations', () => {
    test('adds vertex with correct ID and coordinates', () => {
      const vertex: Vertex = { id: 'p1', x: 100, y: 200 };
      graph.addVertex(vertex);
      
      expect(graph.getVertex('p1')).toEqual(vertex);
    });

    test('getVertices returns all added vertices', () => {
      const vertex1: Vertex = { id: 'p1', x: 0, y: 0 };
      const vertex2: Vertex = { id: 'p2', x: 100, y: 100 };
      
      graph.addVertex(vertex1);
      graph.addVertex(vertex2);
      
      const verticesMap = graph.getVertices();
      const vertices = Array.from(verticesMap.values());
      expect(vertices).toHaveLength(2);
      expect(vertices).toContainEqual(vertex1);
      expect(vertices).toContainEqual(vertex2);
    });

    test('removes vertex from graph', () => {
      const vertex: Vertex = { id: 'p1', x: 100, y: 200 };
      graph.addVertex(vertex);
      
      graph.removeVertex('p1');
      
      expect(graph.getVertex('p1')).toBeUndefined();
      expect(graph.getVertices().size).toBe(0);
    });

    test('removing vertex cascades to connected edges', () => {
      const p1: Vertex = { id: 'p1', x: 0, y: 0 };
      const p2: Vertex = { id: 'p2', x: 100, y: 0 };
      const edge: Edge = { 
        id: 'w1', 
        startVertexId: 'p1', 
        endVertexId: 'p2'
      };
      
      graph.addVertex(p1);
      graph.addVertex(p2);
      graph.addEdge(edge);
      
      expect(graph.getEdges()).toHaveLength(1);
      
      graph.removeVertex('p1');
      
      expect(graph.getEdges()).toHaveLength(0); // Edge should be removed
    });
  });

  describe('Edge Operations', () => {
    test('adds edge connecting two vertices', () => {
      const p1: Vertex = { id: 'p1', x: 0, y: 0 };
      const p2: Vertex = { id: 'p2', x: 100, y: 0 };
      const edge: Edge = { 
        id: 'w1', 
        startVertexId: 'p1', 
        endVertexId: 'p2'
      };
      
      graph.addVertex(p1);
      graph.addVertex(p2);
      graph.addEdge(edge);
      
      expect(graph.getEdge('w1')).toEqual(edge);
      expect(graph.getEdges()).toHaveLength(1);
    });

    test('removes edge from graph', () => {
      const p1: Vertex = { id: 'p1', x: 0, y: 0 };
      const p2: Vertex = { id: 'p2', x: 100, y: 0 };
      const edge: Edge = { 
        id: 'w1', 
        startVertexId: 'p1', 
        endVertexId: 'p2'
      };
      
      graph.addVertex(p1);
      graph.addVertex(p2);
      graph.addEdge(edge);
      
      graph.removeEdge('w1');
      
      expect(graph.getEdge('w1')).toBeUndefined();
      expect(graph.getEdges()).toHaveLength(0);
    });

    test('getConnectedEdges returns edges connected to a vertex', () => {
      const p1: Vertex = { id: 'p1', x: 0, y: 0 };
      const p2: Vertex = { id: 'p2', x: 100, y: 0 };
      const p3: Vertex = { id: 'p3', x: 0, y: 100 };
      
      const edge1: Edge = { id: 'w1', startVertexId: 'p1', endVertexId: 'p2' };
      const edge2: Edge = { id: 'w2', startVertexId: 'p1', endVertexId: 'p3' };
      
      graph.addVertex(p1);
      graph.addVertex(p2);
      graph.addVertex(p3);
      graph.addEdge(edge1);
      graph.addEdge(edge2);
      
      const connectedEdges = graph.getConnectedEdges('p1');
      expect(connectedEdges).toHaveLength(2);
      expect(connectedEdges).toContainEqual(edge1);
      expect(connectedEdges).toContainEqual(edge2);
      
      const p2Edges = graph.getConnectedEdges('p2');
      expect(p2Edges).toHaveLength(1);
      expect(p2Edges).toContainEqual(edge1);
    });
  });
});

describe('SpatialGraph - Surface Detection Algorithm', () => {
  let graph: SpatialGraph;

  beforeEach(() => {
    graph = new SpatialGraph();
  });

  test('detects simple rectangular surface', () => {
    const { vertices, edges } = createRectangle(0, 0, 100, 100);
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].edgeIds).toHaveLength(4);
  });

  test('detects triangular surface', () => {
    const { vertices, edges } = createTriangle(0, 0, 100, 0, 50, 100);
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].edgeIds).toHaveLength(3);
  });

  test('detects two adjacent surfaces sharing an edge', () => {
    const { vertices, edges } = createTwoAdjacentRooms();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(2);
  });

  test('detects four surfaces in a 2x2 grid', () => {
    const { vertices, edges } = createFourRoomGrid();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(4);
  });

  test('detects L-shaped surface (concave polygon)', () => {
    const { vertices, edges } = createLShapedRoom();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].edgeIds).toHaveLength(8);
  });

  test('does not detect surface for open path', () => {
    const { vertices, edges } = createOpenPath();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(0);
  });

  test('detects surfaces in complex L-shape configuration', () => {
    const { vertices, edges } = createThreeRoomLShape();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(3);
  });

  test('ignores filaments (dead-end edges)', () => {
    const { vertices, edges } = createRectangleWithFilament();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(1);
    // The filament edge should not be part of the surface
    expect(surfaces[0].edgeIds).toHaveLength(8);
  });

  test('detects surfaces split by diagonal', () => {
    const { vertices, edges } = createSquareWithDiagonal();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(2);
    // Each triangle has 3 edges
    expect(surfaces[0].edgeIds).toHaveLength(3);
    expect(surfaces[1].edgeIds).toHaveLength(3);
  });
});

describe('SpatialGraph - Edge Cases', () => {
  let graph: SpatialGraph;

  beforeEach(() => {
    graph = new SpatialGraph();
  });

  test('handles removing an edge that breaks a surface', () => {
    const { vertices, edges } = createRectangle(0, 0, 100, 100);
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    expect(graph.getSurfaces().size).toBe(1);
    
    // Remove one edge
    graph.removeEdge(edges[0].id);
    
    expect(graph.getSurfaces().size).toBe(0);
  });

  test('handles removing an edge that merges two surfaces', () => {
    const { vertices, edges } = createTwoAdjacentRooms();
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    expect(graph.getSurfaces().size).toBe(2);
    
    // Find the shared edge (B-E)
    // In createTwoAdjacentRooms, B is (100,0) and E is (100,100)
    // The shared edge connects B and E
    const sharedEdge = edges.find(e => 
      (e.startVertexId === 'B' && e.endVertexId === 'E') || 
      (e.startVertexId === 'E' && e.endVertexId === 'B')
    );
    
    expect(sharedEdge).toBeDefined();
    if (sharedEdge) {
      graph.removeEdge(sharedEdge.id);
      
      // Should now be one large surface
      const surfaces = surfacesToArray(graph.getSurfaces());
      expect(surfaces).toHaveLength(1);
      // The merged surface should have 6 edges (4+4-2 shared)
      expect(surfaces[0].edgeIds).toHaveLength(6);
    }
  });

  test('handles adding an edge that splits a surface', () => {
    const { vertices, edges } = createRectangle(0, 0, 100, 100);
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    expect(graph.getSurfaces().size).toBe(1);
    
    // Add a diagonal edge splitting the rectangle
    // Rectangle points: p1(0,0), p2(100,0), p3(100,100), p4(0,100)
    // Add edge from p1 to p3
    const diagonal: Edge = {
      id: 'diagonal',
      startVertexId: 'p1',
      endVertexId: 'p3'
    };
    
    graph.addEdge(diagonal);
    
    expect(graph.getSurfaces().size).toBe(2);
  });
});

describe('SpatialGraph - Surface Property Calculations', () => {
  let graph: SpatialGraph;

  beforeEach(() => {
    graph = new SpatialGraph();
  });

  test('calculates correct area for rectangle', () => {
    const width = 100;
    const height = 50;
    const { vertices, edges } = createRectangle(0, 0, width, height);
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].area).toBe(width * height);
  });

  test('calculates correct centroid for rectangle', () => {
    const x = 0;
    const y = 0;
    const width = 100;
    const height = 100;
    const { vertices, edges } = createRectangle(x, y, width, height);
    
    vertices.forEach(v => graph.addVertex(v));
    edges.forEach(e => graph.addEdge(e));
    
    const surfaces = surfacesToArray(graph.getSurfaces());
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].centroid).toEqual({
      x: x + width / 2,
      y: y + height / 2
    });
  });
});
