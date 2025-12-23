import { Vertex, Edge } from '../../src/types/spatial';

/**
 * Create a rectangle with given dimensions
 */
export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  idPrefix = ''
): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: `${idPrefix}p1`, x, y },
    { id: `${idPrefix}p2`, x: x + width, y },
    { id: `${idPrefix}p3`, x: x + width, y: y + height },
    { id: `${idPrefix}p4`, x, y: y + height },
  ];

  const edges: Edge[] = [
    { id: `${idPrefix}w1`, startVertexId: `${idPrefix}p1`, endVertexId: `${idPrefix}p2`, thickness: 4 },
    { id: `${idPrefix}w2`, startVertexId: `${idPrefix}p2`, endVertexId: `${idPrefix}p3`, thickness: 4 },
    { id: `${idPrefix}w3`, startVertexId: `${idPrefix}p3`, endVertexId: `${idPrefix}p4`, thickness: 4 },
    { id: `${idPrefix}w4`, startVertexId: `${idPrefix}p4`, endVertexId: `${idPrefix}p1`, thickness: 4 },
  ];

  return { vertices, edges };
}

/**
 * Create a triangle with given vertices
 */
export function createTriangle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  idPrefix = ''
): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: `${idPrefix}p1`, x: x1, y: y1 },
    { id: `${idPrefix}p2`, x: x2, y: y2 },
    { id: `${idPrefix}p3`, x: x3, y: y3 },
  ];

  const edges: Edge[] = [
    { id: `${idPrefix}w1`, startVertexId: `${idPrefix}p1`, endVertexId: `${idPrefix}p2`, thickness: 4 },
    { id: `${idPrefix}w2`, startVertexId: `${idPrefix}p2`, endVertexId: `${idPrefix}p3`, thickness: 4 },
    { id: `${idPrefix}w3`, startVertexId: `${idPrefix}p3`, endVertexId: `${idPrefix}p1`, thickness: 4 },
  ];

  return { vertices, edges };
}

/**
 * Create two adjacent rooms sharing an edge
 * Layout:
 * A--B--C
 * |  |  |
 * D--E--F
 */
export function createTwoAdjacentRooms(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
  ];

  const edges: Edge[] = [
    // Room 1: A-B-E-D
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'E', thickness: 4 },
    { id: 'w3', startVertexId: 'E', endVertexId: 'D', thickness: 4 },
    { id: 'w4', startVertexId: 'D', endVertexId: 'A', thickness: 4 },
    
    // Room 2: B-C-F-E (shares edge B-E with Room 1)
    { id: 'w5', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    { id: 'w6', startVertexId: 'C', endVertexId: 'F', thickness: 4 },
    { id: 'w7', startVertexId: 'F', endVertexId: 'E', thickness: 4 },
    // w2 (B-E) is shared between both rooms
  ];

  return { vertices, edges };
}

/**
 * Create a 2x2 grid of four rooms
 * Layout:
 * A--B--C
 * |  |  |
 * D--E--F
 * |  |  |
 * G--H--I
 */
export function createFourRoomGrid(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
    { id: 'G', x: 0, y: 200 },
    { id: 'H', x: 100, y: 200 },
    { id: 'I', x: 200, y: 200 },
  ];

  const edges: Edge[] = [
    // Horizontal edges
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    { id: 'w3', startVertexId: 'D', endVertexId: 'E', thickness: 4 },
    { id: 'w4', startVertexId: 'E', endVertexId: 'F', thickness: 4 },
    { id: 'w5', startVertexId: 'G', endVertexId: 'H', thickness: 4 },
    { id: 'w6', startVertexId: 'H', endVertexId: 'I', thickness: 4 },
    
    // Vertical edges
    { id: 'w7', startVertexId: 'A', endVertexId: 'D', thickness: 4 },
    { id: 'w8', startVertexId: 'D', endVertexId: 'G', thickness: 4 },
    { id: 'w9', startVertexId: 'B', endVertexId: 'E', thickness: 4 },
    { id: 'w10', startVertexId: 'E', endVertexId: 'H', thickness: 4 },
    { id: 'w11', startVertexId: 'C', endVertexId: 'F', thickness: 4 },
    { id: 'w12', startVertexId: 'F', endVertexId: 'I', thickness: 4 },
  ];

  return { vertices, edges };
}

/**
 * Create an L-shaped room
 * Layout:
 * A--B--C
 * |     |
 * D--E  F
 *    |  |
 *    G--H
 */
export function createLShapedRoom(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
    { id: 'G', x: 100, y: 200 },
    { id: 'H', x: 200, y: 200 },
  ];

  const edges: Edge[] = [
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    { id: 'w3', startVertexId: 'C', endVertexId: 'F', thickness: 4 },
    { id: 'w4', startVertexId: 'F', endVertexId: 'H', thickness: 4 },
    { id: 'w5', startVertexId: 'H', endVertexId: 'G', thickness: 4 },
    { id: 'w6', startVertexId: 'G', endVertexId: 'E', thickness: 4 },
    { id: 'w7', startVertexId: 'E', endVertexId: 'D', thickness: 4 },
    { id: 'w8', startVertexId: 'D', endVertexId: 'A', thickness: 4 },
  ];

  return { vertices, edges };
}

/**
 * Create an open path (incomplete loop)
 */
export function createOpenPath(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 100, y: 100 },
    { id: 'D', x: 0, y: 100 },
  ];

  const edges: Edge[] = [
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    { id: 'w3', startVertexId: 'A', endVertexId: 'D', thickness: 4 },
    // Missing edge: D to C (loop not closed)
  ];

  return { vertices, edges };
}

/**
 * Create three rooms in L-shape: 2x2 grid with bottom-right room missing
 * Layout:
 * A--B--C
 * |  |  |
 * D--E--F
 * |  |
 * G--H
 * 
 * Room 1 (top-left): A-B-E-D
 * Room 2 (top-right): B-C-F-E
 * Room 3 (bottom-left): D-E-H-G
 */
export function createThreeRoomLShape(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
    { id: 'G', x: 0, y: 200 },
    { id: 'H', x: 100, y: 200 },
  ];

  const edges: Edge[] = [
    // Top row
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    // Middle row
    { id: 'w3', startVertexId: 'D', endVertexId: 'E', thickness: 4 },
    { id: 'w4', startVertexId: 'E', endVertexId: 'F', thickness: 4 },
    // Bottom row
    { id: 'w5', startVertexId: 'G', endVertexId: 'H', thickness: 4 },
    // Left column
    { id: 'w6', startVertexId: 'A', endVertexId: 'D', thickness: 4 },
    { id: 'w7', startVertexId: 'D', endVertexId: 'G', thickness: 4 },
    // Middle column
    { id: 'w8', startVertexId: 'B', endVertexId: 'E', thickness: 4 },
    { id: 'w9', startVertexId: 'E', endVertexId: 'H', thickness: 4 },
    // Right column (only top section)
    { id: 'w10', startVertexId: 'C', endVertexId: 'F', thickness: 4 },
  ];

  return { vertices, edges };
}

/**
 * Create a rectangle with a filament (dead-end edge)
 * Layout:
 * A--B--C
 * |     |
 * D     E
 * |     |
 * F--G--H
 *       |
 *       I (filament extends down from H)
 * 
 * The edge H-I is a filament (dead end) and should not create a false room
 */
export function createRectangleWithFilament(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 50, y: 0 },
    { id: 'C', x: 100, y: 0 },
    { id: 'D', x: 0, y: 50 },
    { id: 'E', x: 100, y: 50 },
    { id: 'F', x: 0, y: 100 },
    { id: 'G', x: 50, y: 100 },
    { id: 'H', x: 100, y: 100 },
    { id: 'I', x: 100, y: 150 }, // Filament vertex
  ];

  const edges: Edge[] = [
    // Top
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    // Right side
    { id: 'w3', startVertexId: 'C', endVertexId: 'E', thickness: 4 },
    { id: 'w4', startVertexId: 'E', endVertexId: 'H', thickness: 4 },
    // Bottom
    { id: 'w5', startVertexId: 'H', endVertexId: 'G', thickness: 4 },
    { id: 'w6', startVertexId: 'G', endVertexId: 'F', thickness: 4 },
    // Left side
    { id: 'w7', startVertexId: 'F', endVertexId: 'D', thickness: 4 },
    { id: 'w8', startVertexId: 'D', endVertexId: 'A', thickness: 4 },
    // Filament (dead-end edge)
    { id: 'w9', startVertexId: 'H', endVertexId: 'I', thickness: 4 },
  ];

  return { vertices, edges };
}

/**
 * Create a square with a diagonal splitting it into two triangular rooms
 * Layout:
 * A-----B
 * |\    |
 * | \   |
 * |  \  |
 * |   \ |
 * D-----C
 * 
 * Edges: A-B, B-C, C-D, D-A (square perimeter)
 *        A-C (diagonal)
 * 
 * Should detect 2 rooms:
 * - Triangle ABC
 * - Triangle ACD
 */
export function createSquareWithDiagonal(): { vertices: Vertex[]; edges: Edge[] } {
  const vertices: Vertex[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 100, y: 100 },
    { id: 'D', x: 0, y: 100 },
  ];

  const edges: Edge[] = [
    // Square perimeter
    { id: 'w1', startVertexId: 'A', endVertexId: 'B', thickness: 4 },
    { id: 'w2', startVertexId: 'B', endVertexId: 'C', thickness: 4 },
    { id: 'w3', startVertexId: 'C', endVertexId: 'D', thickness: 4 },
    { id: 'w4', startVertexId: 'D', endVertexId: 'A', thickness: 4 },
    // Diagonal
    { id: 'w5', startVertexId: 'A', endVertexId: 'C', thickness: 4 },
  ];

  return { vertices, edges };
}
