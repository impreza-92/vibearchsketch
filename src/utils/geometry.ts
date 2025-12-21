// Geometry utility functions for floorplan calculations

import type { Point } from '../types/floorplan';

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Snap a point to the nearest grid intersection
 */
export const snapToGrid = (point: Point, gridSize: number): Point => {
  return {
    ...point,
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};

/**
 * Check if a point is within tolerance of another point
 */
export const isNearPoint = (
  p1: Point,
  p2: Point,
  tolerance: number
): boolean => {
  return distance(p1, p2) <= tolerance;
};

/**
 * Calculate the midpoint between two points
 */
export const midpoint = (p1: Point, p2: Point): Point => {
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
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
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
 * Calculate the perpendicular distance from a point to a line segment
 * Returns the distance and the closest point on the segment
 */
export const pointToLineSegmentDistance = (
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { distance: number; closestPoint: Point; t: number } => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // If line segment is actually a point
  if (dx === 0 && dy === 0) {
    return {
      distance: distance(point, lineStart),
      closestPoint: lineStart,
      t: 0,
    };
  }

  // Calculate t parameter for closest point on infinite line
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
    )
  );

  // Calculate closest point on line segment
  const closestPoint: Point = {
    id: '',
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return {
    distance: distance(point, closestPoint),
    closestPoint,
    t, // 0 = at start, 1 = at end, 0.5 = at middle
  };
};

/**
 * Check if a point is on a line segment (within tolerance)
 * Returns true only if the point is ON the segment (not near endpoints)
 */
export const isPointOnLineSegment = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance: number = 5
): boolean => {
  const { distance: dist, t } = pointToLineSegmentDistance(point, lineStart, lineEnd);
  
  // Point must be close to the line AND not near the endpoints
  // t > 0.1 and t < 0.9 ensures we're not too close to endpoints
  return dist <= tolerance && t > 0.1 && t < 0.9;
};
