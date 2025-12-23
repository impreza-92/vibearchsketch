// Geometry utility functions for spatial calculations

import type { Vertex } from '../types/spatial';

/**
 * Calculate distance between two vertices
 */
export const distance = (p1: Vertex, p2: Vertex): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Snap a vertex to the nearest grid intersection
 */
export const snapToGrid = (vertex: Vertex, gridSize: number): Vertex => {
  return {
    ...vertex,
    x: Math.round(vertex.x / gridSize) * gridSize,
    y: Math.round(vertex.y / gridSize) * gridSize,
  };
};

/**
 * Check if a vertex is within tolerance of another vertex
 */
export const isNearVertex = (
  p1: Vertex,
  p2: Vertex,
  tolerance: number
): boolean => {
  return distance(p1, p2) <= tolerance;
};

/**
 * Calculate the midpoint between two vertices
 */
export const midpoint = (p1: Vertex, p2: Vertex): Vertex => {
  return {
    id: '',
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

/**
 * Check if two line segments intersect
 */
export const lineSegmentsIntersect = (
  p1: Vertex,
  p2: Vertex,
  p3: Vertex,
  p4: Vertex
): boolean => {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
  if (det === 0) return false; // Parallel lines

  const lambda =
    ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
  const gamma =
    ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate the perpendicular distance from a vertex to a line segment
 * Returns the distance and the closest vertex on the segment
 */
export const pointToLineSegmentDistance = (
  vertex: Vertex,
  lineStart: Vertex,
  lineEnd: Vertex
): { distance: number; closestVertex: Vertex; t: number } => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // If line segment is actually a point
  if (dx === 0 && dy === 0) {
    return {
      distance: distance(vertex, lineStart),
      closestVertex: lineStart,
      t: 0,
    };
  }

  // Calculate t parameter for closest point on infinite line
  const t = Math.max(
    0,
    Math.min(
      1,
      ((vertex.x - lineStart.x) * dx + (vertex.y - lineStart.y) * dy) / (dx * dx + dy * dy)
    )
  );

  const closestVertex: Vertex = {
    id: '',
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return {
    distance: distance(vertex, closestVertex),
    closestVertex,
    t,
  };
};

/**
 * Check if a vertex is on a line segment (within tolerance)
 * Returns true only if the vertex is ON the segment (not near endpoints)
 */
export const isVertexOnLineSegment = (
  vertex: Vertex,
  lineStart: Vertex,
  lineEnd: Vertex,
  tolerance: number = 5
): boolean => {
  const { distance: dist, t } = pointToLineSegmentDistance(vertex, lineStart, lineEnd);
  
  // Vertex must be close to the line AND not near the endpoints
  // t > 0.1 and t < 0.9 ensures we're not too close to endpoints
  return dist <= tolerance && t > 0.1 && t < 0.9;
};
