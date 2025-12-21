// Room detection utilities for finding enclosed spaces in the floorplan graph

import type { Point, Wall, Room } from '../types/floorplan';
import { generateId } from './geometry';

/**
 * Build adjacency list from points and walls (graph representation)
 */
function buildAdjacencyList(
  points: Map<string, Point>,
  walls: Map<string, Wall>
): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  // Initialize adjacency list for all points
  points.forEach((_, pointId) => {
    adjacency.set(pointId, new Set<string>());
  });

  // Add edges (walls) to adjacency list
  walls.forEach((wall) => {
    const neighbors1 = adjacency.get(wall.startPointId);
    const neighbors2 = adjacency.get(wall.endPointId);

    if (neighbors1 && neighbors2) {
      neighbors1.add(wall.endPointId);
      neighbors2.add(wall.startPointId);
    }
  });

  return adjacency;
}

/**
 * Find all simple cycles (potential rooms) in the graph using DFS
 */
function findCycles(
  adjacency: Map<string, Set<string>>
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();

  // Try starting from each point
  adjacency.forEach((_, startPoint) => {
    if (visited.has(startPoint)) return;

    // DFS to find cycles starting from this point
    const stack: { current: string; path: string[]; visited: Set<string> }[] = [
      { current: startPoint, path: [startPoint], visited: new Set([startPoint]) },
    ];

    while (stack.length > 0) {
      const { current, path, visited: pathVisited } = stack.pop()!;
      const neighbors = adjacency.get(current);

      if (!neighbors) continue;

      neighbors.forEach((neighbor) => {
        // Found a cycle back to start
        if (neighbor === startPoint && path.length >= 3) {
          const cycle = [...path];
          // Only add if this cycle hasn't been found yet (check all rotations)
          if (!isCycleDuplicate(cycle, cycles)) {
            cycles.push(cycle);
          }
        }
        // Continue exploring
        else if (!pathVisited.has(neighbor) && path.length < 20) {
          // Limit depth to avoid infinite loops
          const newVisited = new Set(pathVisited);
          newVisited.add(neighbor);
          stack.push({
            current: neighbor,
            path: [...path, neighbor],
            visited: newVisited,
          });
        }
      });
    }

    visited.add(startPoint);
  });

  return cycles;
}

/**
 * Check if a cycle is a duplicate (same cycle, different rotation)
 */
function isCycleDuplicate(cycle: string[], existingCycles: string[][]): boolean {
  return existingCycles.some((existing) => {
    if (existing.length !== cycle.length) return false;

    // Check all rotations and reverse
    for (let i = 0; i < existing.length; i++) {
      const rotated = [...existing.slice(i), ...existing.slice(0, i)];
      if (arraysEqual(rotated, cycle)) return true;

      // Check reverse
      const reversed = [...rotated].reverse();
      if (arraysEqual(reversed, cycle)) return true;
    }

    return false;
  });
}

/**
 * Compare two arrays for equality
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Calculate the centroid (center point) of a polygon
 */
function calculateCentroid(pointIds: string[], points: Map<string, Point>): Point {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  pointIds.forEach((pointId) => {
    const point = points.get(pointId);
    if (point) {
      sumX += point.x;
      sumY += point.y;
      count++;
    }
  });

  return {
    id: generateId(),
    x: count > 0 ? sumX / count : 0,
    y: count > 0 ? sumY / count : 0,
  };
}

/**
 * Calculate the area of a polygon using the Shoelace formula
 */
function calculatePolygonArea(pointIds: string[], points: Map<string, Point>): number {
  if (pointIds.length < 3) return 0;

  let area = 0;
  const n = pointIds.length;

  for (let i = 0; i < n; i++) {
    const point1 = points.get(pointIds[i]);
    const point2 = points.get(pointIds[(i + 1) % n]);

    if (point1 && point2) {
      area += point1.x * point2.y - point2.x * point1.y;
    }
  }

  return Math.abs(area) / 2;
}

/**
 * Get the walls that form a room
 */
function getWallIdsForRoom(
  pointIds: string[],
  walls: Map<string, Wall>
): string[] {
  const wallIds: string[] = [];

  for (let i = 0; i < pointIds.length; i++) {
    const start = pointIds[i];
    const end = pointIds[(i + 1) % pointIds.length];

    // Find wall connecting these two points
    walls.forEach((wall, wallId) => {
      if (
        (wall.startPointId === start && wall.endPointId === end) ||
        (wall.startPointId === end && wall.endPointId === start)
      ) {
        wallIds.push(wallId);
      }
    });
  }

  return wallIds;
}

/**
 * Filter cycles to only include valid rooms (not too small, properly formed)
 */
function filterValidRooms(
  cycles: string[][],
  points: Map<string, Point>,
  minArea: number = 1000 // Minimum area in square pixels
): string[][] {
  return cycles.filter((cycle) => {
    // Must have at least 3 points
    if (cycle.length < 3) return false;

    // Calculate area
    const area = calculatePolygonArea(cycle, points);

    // Filter out tiny cycles (likely artifacts)
    return area >= minArea;
  });
}

/**
 * Detect all rooms in the current floorplan
 */
export function detectRooms(
  points: Map<string, Point>,
  walls: Map<string, Wall>,
  existingRooms: Map<string, Room> = new Map()
): Room[] {
  // Build graph representation
  const adjacency = buildAdjacencyList(points, walls);

  // Find all cycles
  const cycles = findCycles(adjacency);

  // Filter to valid rooms
  const validCycles = filterValidRooms(cycles, points);

  // Convert cycles to Room objects
  const newRooms: Room[] = [];
  let roomCounter = existingRooms.size + 1;

  validCycles.forEach((cycle) => {
    const wallIds = getWallIdsForRoom(cycle, walls);

    // Check if this room already exists (same walls)
    const exists = Array.from(existingRooms.values()).some((room) => {
      if (room.wallIds.length !== wallIds.length) return false;
      return wallIds.every((id) => room.wallIds.includes(id));
    });

    if (!exists && wallIds.length === cycle.length) {
      // Only create room if all walls exist
      const centroid = calculateCentroid(cycle, points);
      const area = calculatePolygonArea(cycle, points);

      newRooms.push({
        id: generateId(),
        name: `Room ${roomCounter}`,
        wallIds,
        centroid: { x: centroid.x, y: centroid.y },
        area,
      });

      roomCounter++;
    }
  });

  return newRooms;
}

/**
 * Check if adding a wall creates a new room
 */
export function checkForNewRoom(
  points: Map<string, Point>,
  walls: Map<string, Wall>,
  existingRooms: Map<string, Room>
): Room | null {
  const detectedRooms = detectRooms(points, walls, existingRooms);

  // Return the first new room found (if any)
  return detectedRooms.length > 0 ? detectedRooms[0] : null;
}

/**
 * Update room properties (centroid and area) based on current wall positions
 * Does NOT create new rooms, only updates existing ones
 */
export function updateRoomProperties(
  room: Room,
  points: Map<string, Point>,
  walls: Map<string, Wall>
): Room {
  // Get all points in the room by following the walls
  const pointIds: string[] = [];
  const visitedWalls = new Set<string>();
  
  // Start with the first wall
  if (room.wallIds.length === 0) return room;
  
  let currentPointId: string | undefined;
  
  // Find the starting point from the first wall
  const firstWall = walls.get(room.wallIds[0]);
  if (!firstWall) return room;
  
  currentPointId = firstWall.startPointId;
  pointIds.push(currentPointId);
  
  // Follow the walls around the room
  for (let i = 0; i < room.wallIds.length; i++) {
    const wallId = room.wallIds[i];
    if (visitedWalls.has(wallId)) continue;
    
    const wall = walls.get(wallId);
    if (!wall) continue;
    
    visitedWalls.add(wallId);
    
    // Determine next point
    if (wall.startPointId === currentPointId) {
      currentPointId = wall.endPointId;
      if (i < room.wallIds.length - 1) {
        pointIds.push(currentPointId);
      }
    } else if (wall.endPointId === currentPointId) {
      currentPointId = wall.startPointId;
      if (i < room.wallIds.length - 1) {
        pointIds.push(currentPointId);
      }
    }
  }
  
  // Calculate new centroid and area
  const centroid = calculateCentroid(pointIds, points);
  const area = calculatePolygonArea(pointIds, points);
  
  return {
    ...room,
    centroid: { x: centroid.x, y: centroid.y },
    area,
  };
}
