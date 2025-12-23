import { Point, Wall } from '../../src/types/floorplan';

/**
 * Create a rectangle with given dimensions
 */
export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  idPrefix = ''
): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: `${idPrefix}p1`, x, y },
    { id: `${idPrefix}p2`, x: x + width, y },
    { id: `${idPrefix}p3`, x: x + width, y: y + height },
    { id: `${idPrefix}p4`, x, y: y + height },
  ];

  const walls: Wall[] = [
    { id: `${idPrefix}w1`, startPointId: `${idPrefix}p1`, endPointId: `${idPrefix}p2`, thickness: 4, style: 'solid' },
    { id: `${idPrefix}w2`, startPointId: `${idPrefix}p2`, endPointId: `${idPrefix}p3`, thickness: 4, style: 'solid' },
    { id: `${idPrefix}w3`, startPointId: `${idPrefix}p3`, endPointId: `${idPrefix}p4`, thickness: 4, style: 'solid' },
    { id: `${idPrefix}w4`, startPointId: `${idPrefix}p4`, endPointId: `${idPrefix}p1`, thickness: 4, style: 'solid' },
  ];

  return { points, walls };
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
): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: `${idPrefix}p1`, x: x1, y: y1 },
    { id: `${idPrefix}p2`, x: x2, y: y2 },
    { id: `${idPrefix}p3`, x: x3, y: y3 },
  ];

  const walls: Wall[] = [
    { id: `${idPrefix}w1`, startPointId: `${idPrefix}p1`, endPointId: `${idPrefix}p2`, thickness: 4, style: 'solid' },
    { id: `${idPrefix}w2`, startPointId: `${idPrefix}p2`, endPointId: `${idPrefix}p3`, thickness: 4, style: 'solid' },
    { id: `${idPrefix}w3`, startPointId: `${idPrefix}p3`, endPointId: `${idPrefix}p1`, thickness: 4, style: 'solid' },
  ];

  return { points, walls };
}

/**
 * Create two adjacent rooms sharing a wall
 * Layout:
 * A--B--C
 * |  |  |
 * D--E--F
 */
export function createTwoAdjacentRooms(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
  ];

  const walls: Wall[] = [
    // Room 1: A-B-E-D
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w3', startPointId: 'E', endPointId: 'D', thickness: 4, style: 'solid' },
    { id: 'w4', startPointId: 'D', endPointId: 'A', thickness: 4, style: 'solid' },
    
    // Room 2: B-C-F-E (shares wall B-E with Room 1)
    { id: 'w5', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    { id: 'w6', startPointId: 'C', endPointId: 'F', thickness: 4, style: 'solid' },
    { id: 'w7', startPointId: 'F', endPointId: 'E', thickness: 4, style: 'solid' },
    // w2 (B-E) is shared between both rooms
  ];

  return { points, walls };
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
export function createFourRoomGrid(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
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

  const walls: Wall[] = [
    // Horizontal walls
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    { id: 'w3', startPointId: 'D', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w4', startPointId: 'E', endPointId: 'F', thickness: 4, style: 'solid' },
    { id: 'w5', startPointId: 'G', endPointId: 'H', thickness: 4, style: 'solid' },
    { id: 'w6', startPointId: 'H', endPointId: 'I', thickness: 4, style: 'solid' },
    
    // Vertical walls
    { id: 'w7', startPointId: 'A', endPointId: 'D', thickness: 4, style: 'solid' },
    { id: 'w8', startPointId: 'D', endPointId: 'G', thickness: 4, style: 'solid' },
    { id: 'w9', startPointId: 'B', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w10', startPointId: 'E', endPointId: 'H', thickness: 4, style: 'solid' },
    { id: 'w11', startPointId: 'C', endPointId: 'F', thickness: 4, style: 'solid' },
    { id: 'w12', startPointId: 'F', endPointId: 'I', thickness: 4, style: 'solid' },
  ];

  return { points, walls };
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
export function createLShapedRoom(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
    { id: 'G', x: 100, y: 200 },
    { id: 'H', x: 200, y: 200 },
  ];

  const walls: Wall[] = [
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    { id: 'w3', startPointId: 'C', endPointId: 'F', thickness: 4, style: 'solid' },
    { id: 'w4', startPointId: 'F', endPointId: 'H', thickness: 4, style: 'solid' },
    { id: 'w5', startPointId: 'H', endPointId: 'G', thickness: 4, style: 'solid' },
    { id: 'w6', startPointId: 'G', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w7', startPointId: 'E', endPointId: 'D', thickness: 4, style: 'solid' },
    { id: 'w8', startPointId: 'D', endPointId: 'A', thickness: 4, style: 'solid' },
  ];

  return { points, walls };
}

/**
 * Create an open path (incomplete loop)
 */
export function createOpenPath(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 100, y: 100 },
    { id: 'D', x: 0, y: 100 },
  ];

  const walls: Wall[] = [
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    { id: 'w3', startPointId: 'A', endPointId: 'D', thickness: 4, style: 'solid' },
    // Missing wall: D to C (loop not closed)
  ];

  return { points, walls };
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
export function createThreeRoomLShape(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 200, y: 0 },
    { id: 'D', x: 0, y: 100 },
    { id: 'E', x: 100, y: 100 },
    { id: 'F', x: 200, y: 100 },
    { id: 'G', x: 0, y: 200 },
    { id: 'H', x: 100, y: 200 },
  ];

  const walls: Wall[] = [
    // Top row
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    // Middle row
    { id: 'w3', startPointId: 'D', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w4', startPointId: 'E', endPointId: 'F', thickness: 4, style: 'solid' },
    // Bottom row
    { id: 'w5', startPointId: 'G', endPointId: 'H', thickness: 4, style: 'solid' },
    // Left column
    { id: 'w6', startPointId: 'A', endPointId: 'D', thickness: 4, style: 'solid' },
    { id: 'w7', startPointId: 'D', endPointId: 'G', thickness: 4, style: 'solid' },
    // Middle column
    { id: 'w8', startPointId: 'B', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w9', startPointId: 'E', endPointId: 'H', thickness: 4, style: 'solid' },
    // Right column (only top section)
    { id: 'w10', startPointId: 'C', endPointId: 'F', thickness: 4, style: 'solid' },
  ];

  return { points, walls };
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
export function createRectangleWithFilament(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 50, y: 0 },
    { id: 'C', x: 100, y: 0 },
    { id: 'D', x: 0, y: 50 },
    { id: 'E', x: 100, y: 50 },
    { id: 'F', x: 0, y: 100 },
    { id: 'G', x: 50, y: 100 },
    { id: 'H', x: 100, y: 100 },
    { id: 'I', x: 100, y: 150 }, // Filament point
  ];

  const walls: Wall[] = [
    // Top
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    // Right side
    { id: 'w3', startPointId: 'C', endPointId: 'E', thickness: 4, style: 'solid' },
    { id: 'w4', startPointId: 'E', endPointId: 'H', thickness: 4, style: 'solid' },
    // Bottom
    { id: 'w5', startPointId: 'H', endPointId: 'G', thickness: 4, style: 'solid' },
    { id: 'w6', startPointId: 'G', endPointId: 'F', thickness: 4, style: 'solid' },
    // Left side
    { id: 'w7', startPointId: 'F', endPointId: 'D', thickness: 4, style: 'solid' },
    { id: 'w8', startPointId: 'D', endPointId: 'A', thickness: 4, style: 'solid' },
    // Filament (dead-end edge)
    { id: 'w9', startPointId: 'H', endPointId: 'I', thickness: 4, style: 'solid' },
  ];

  return { points, walls };
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
 * Walls: A-B, B-C, C-D, D-A (square perimeter)
 *        A-C (diagonal)
 * 
 * Should detect 2 rooms:
 * - Triangle ABC
 * - Triangle ACD
 */
export function createSquareWithDiagonal(): { points: Point[]; walls: Wall[] } {
  const points: Point[] = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: 0 },
    { id: 'C', x: 100, y: 100 },
    { id: 'D', x: 0, y: 100 },
  ];

  const walls: Wall[] = [
    // Square perimeter
    { id: 'w1', startPointId: 'A', endPointId: 'B', thickness: 4, style: 'solid' },
    { id: 'w2', startPointId: 'B', endPointId: 'C', thickness: 4, style: 'solid' },
    { id: 'w3', startPointId: 'C', endPointId: 'D', thickness: 4, style: 'solid' },
    { id: 'w4', startPointId: 'D', endPointId: 'A', thickness: 4, style: 'solid' },
    // Diagonal
    { id: 'w5', startPointId: 'A', endPointId: 'C', thickness: 4, style: 'solid' },
  ];

  return { points, walls };
}
