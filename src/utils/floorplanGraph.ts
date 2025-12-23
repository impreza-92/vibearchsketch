/**
 * FloorplanGraph - Core graph data structure for floorplan management
 * 
 * This class encapsulates all graph operations and provides a clean API
 * for managing points, walls, and rooms. It separates the data structure
 * concerns from UI rendering and state management.
 */

import type { Point, Wall, Room } from '../types/floorplan';
import { generateId } from './geometry';

/**
 * FloorplanGraph manages the graph data structure
 * - Vertices (Nodes): Points
 * - Edges: Walls connecting points
 * - Cycles: Rooms (closed paths)
 */
export class FloorplanGraph {
  private points: Map<string, Point>;
  private walls: Map<string, Wall>;
  private rooms: Map<string, Room>;

  constructor(
    points?: Map<string, Point>,
    walls?: Map<string, Wall>,
    rooms?: Map<string, Room>
  ) {
    this.points = points ? new Map(points) : new Map();
    this.walls = walls ? new Map(walls) : new Map();
    this.rooms = rooms ? new Map(rooms) : new Map();
  }

  // ==================== Point Operations ====================

  /**
   * Add a point to the graph
   */
  addPoint(point: Point): void {
    this.points.set(point.id, point);
  }

  /**
   * Remove a point and all connected walls
   * Returns the IDs of removed walls for undo purposes
   */
  removePoint(pointId: string): string[] {
    const removedWallIds: string[] = [];
    
    // Find and remove all walls connected to this point
    this.walls.forEach((wall, wallId) => {
      if (wall.startPointId === pointId || wall.endPointId === pointId) {
        this.walls.delete(wallId);
        removedWallIds.push(wallId);
      }
    });

    // Remove the point
    this.points.delete(pointId);

    // Update rooms if any walls were removed
    if (removedWallIds.length > 0) {
      this.updateRoomsAfterWallRemoval(removedWallIds);
    }

    return removedWallIds;
  }

  /**
   * Get a point by ID
   */
  getPoint(pointId: string): Point | undefined {
    return this.points.get(pointId);
  }

  /**
   * Get all points
   */
  getPoints(): Map<string, Point> {
    return new Map(this.points);
  }

  /**
   * Check if a point exists
   */
  hasPoint(pointId: string): boolean {
    return this.points.has(pointId);
  }

  /**
   * Find points near a given position
   */
  findNearbyPoints(x: number, y: number, radius: number): Point[] {
    const nearby: Point[] = [];
    this.points.forEach(point => {
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        nearby.push(point);
      }
    });
    return nearby;
  }

  // ==================== Wall Operations ====================

  /**
   * Add a wall to the graph
   * Automatically detects and updates rooms
   */
  addWall(wall: Wall): Room[] {
    this.walls.set(wall.id, wall);
    
    // Detect new rooms after adding the wall using our internal algorithm
    return this.detectAllRooms();
  }

  /**
   * Remove a wall from the graph
   * Returns affected rooms for undo purposes
   */
  removeWall(wallId: string): Map<string, Room> {
    const affectedRooms = new Map<string, Room>();

    // Find rooms that use this wall
    this.rooms.forEach((room, roomId) => {
      if (room.wallIds.includes(wallId)) {
        affectedRooms.set(roomId, room);
        // We don't need to delete here, detectAllRooms will replace the map
      }
    });

    // Remove the wall
    this.walls.delete(wallId);

    // Re-detect all rooms to handle merges/changes
    this.detectAllRooms();

    return affectedRooms;
  }

  /**
   * Get a wall by ID
   */
  getWall(wallId: string): Wall | undefined {
    return this.walls.get(wallId);
  }

  /**
   * Get all walls
   */
  getWalls(): Map<string, Wall> {
    return new Map(this.walls);
  }

  /**
   * Check if a wall exists
   */
  hasWall(wallId: string): boolean {
    return this.walls.has(wallId);
  }

  /**
   * Get all walls connected to a point
   */
  getConnectedWalls(pointId: string): Wall[] {
    const connected: Wall[] = [];
    this.walls.forEach(wall => {
      if (wall.startPointId === pointId || wall.endPointId === pointId) {
        connected.push(wall);
      }
    });
    return connected;
  }

  /**
   * Check if two points are connected by a wall
   */
  arePointsConnected(pointId1: string, pointId2: string): boolean {
    for (const wall of this.walls.values()) {
      if (
        (wall.startPointId === pointId1 && wall.endPointId === pointId2) ||
        (wall.startPointId === pointId2 && wall.endPointId === pointId1)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find wall between two points
   */
  findWallBetweenPoints(pointId1: string, pointId2: string): Wall | undefined {
    for (const wall of this.walls.values()) {
      if (
        (wall.startPointId === pointId1 && wall.endPointId === pointId2) ||
        (wall.startPointId === pointId2 && wall.endPointId === pointId1)
      ) {
        return wall;
      }
    }
    return undefined;
  }

  // ==================== Room Operations ====================

  /**
   * Add a room to the graph
   */
  addRoom(room: Room): void {
    this.rooms.set(room.id, room);
  }

  /**
   * Remove a room from the graph
   */
  removeRoom(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    this.rooms.delete(roomId);
    return room;
  }

  /**
   * Update a room's properties
   */
  updateRoom(roomId: string, updates: Partial<Room>): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(roomId, updatedRoom);
    return room; // Return old room for undo
  }

  /**
   * Get a room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms
   */
  getRooms(): Map<string, Room> {
    return new Map(this.rooms);
  }

  /**
   * Check if a room exists
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Create a room from a cycle of point IDs
   */
  private createRoomFromCycle(cycle: string[]): Room | null {
    if (cycle.length < 3) return null;

    // Get walls for this cycle
    const wallIds: string[] = [];
    for (let i = 0; i < cycle.length; i++) {
      const startId = cycle[i];
      const endId = cycle[(i + 1) % cycle.length];
      
      const wall = this.findWallBetweenPoints(startId, endId);
      if (!wall) return null; // Cycle is invalid if any edge doesn't exist
      wallIds.push(wall.id);
    }

    // Calculate centroid and area
    const points = cycle.map(id => this.points.get(id)!);
    const centroid = this.calculateCentroid(points);
    const area = this.calculatePolygonArea(points);

    // Filter out very small cycles (likely numerical artifacts)
    if (area < 100) return null; // Minimum area threshold

    return {
      id: generateId(),
      name: `Room ${this.rooms.size + 1}`,
      wallIds,
      centroid,
      area,
    };
  }

  /**
   * Calculate centroid of a set of points
   */
  private calculateCentroid(points: Point[]): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
    });
    return {
      x: sumX / points.length,
      y: sumY / points.length,
    };
  }

  /**
   * Calculate polygon area using Shoelace formula
   * Returns signed area (positive for counter-clockwise, negative for clockwise)
   */
  private calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Get working edges by removing filaments (dead-end edges)
   * Filaments are edges that don't participate in any cycles
   * Based on Geometric Tools Library algorithm
   */
  private getWorkingEdges(): Array<[string, string]> {
    // Build adjacency information
    const adjacency = new Map<string, Set<string>>();
    
    for (const wall of this.walls.values()) {
      if (!adjacency.has(wall.startPointId)) {
        adjacency.set(wall.startPointId, new Set());
      }
      if (!adjacency.has(wall.endPointId)) {
        adjacency.set(wall.endPointId, new Set());
      }
      adjacency.get(wall.startPointId)!.add(wall.endPointId);
      adjacency.get(wall.endPointId)!.add(wall.startPointId);
    }

    // Find and remove filaments
    let hasFilaments = true;
    while (hasFilaments) {
      hasFilaments = false;
      
      // Find endpoints (vertices with only one neighbor)
      const endpoints: string[] = [];
      for (const [pointId, neighbors] of adjacency.entries()) {
        if (neighbors.size === 1) {
          endpoints.push(pointId);
        }
      }

      // Remove filaments starting from endpoints
      for (const endpoint of endpoints) {
        const neighbors = adjacency.get(endpoint);
        if (!neighbors || neighbors.size !== 1) continue;

        hasFilaments = true;
        let current = endpoint;
        
        // Traverse along the filament
        while (adjacency.has(current) && adjacency.get(current)!.size === 1) {
          const next = Array.from(adjacency.get(current)!)[0];
          
          // Remove the edge in both directions
          adjacency.get(current)!.delete(next);
          adjacency.get(next)!.delete(current);
          
          // Clean up empty entries
          if (adjacency.get(current)!.size === 0) {
            adjacency.delete(current);
          }
          
          current = next;
        }
      }
    }

    // Build edge list from remaining adjacency
    const edges: Array<[string, string]> = [];
    const processedEdges = new Set<string>();
    
    for (const [from, neighbors] of adjacency.entries()) {
      for (const to of neighbors) {
        const edgeKey1 = `${from}:${to}`;
        const edgeKey2 = `${to}:${from}`;
        
        if (!processedEdges.has(edgeKey1) && !processedEdges.has(edgeKey2)) {
          edges.push([from, to]);
          processedEdges.add(edgeKey1);
          processedEdges.add(edgeKey2);
        }
      }
    }

    return edges;
  }

  /**
   * Find the leftmost point for consistent cycle orientation
   */
  private findLeftmostPoint(edges: Array<[string, string]>): string | null {
    if (edges.length === 0) return null;
    
    // Get all points involved in edges
    const pointsInEdges = new Set<string>();
    for (const [from, to] of edges) {
      pointsInEdges.add(from);
      pointsInEdges.add(to);
    }

    let leftmost: string | null = null;
    let minX = Infinity;
    let minY = Infinity;

    for (const pointId of pointsInEdges) {
      const point = this.points.get(pointId);
      if (!point) continue;
      
      // Leftmost, then bottommost for ties
      if (point.x < minX || (point.x === minX && point.y < minY)) {
        minX = point.x;
        minY = point.y;
        leftmost = pointId;
      }
    }

    return leftmost;
  }

  /**
   * Calculate signed polygon area using Shoelace formula
   * Positive for counter-clockwise winding, negative for clockwise winding
   */
  private calculateSignedPolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return area / 2;
  }

  /**
   * Find minimal cycles in the graph using planar face detection
   * Implements algorithm based on "Constructing a Cycle Basis for a Planar Graph"
   * by David Eberly (Geometric Tools Library)
   * 
   * Key improvements:
   * 1. Remove filaments (dead-end edges) before cycle detection
   * 2. Start from leftmost vertex for consistent orientation
   * 3. Use robust cross-product based angle calculations
   * 4. Filter outer face by area
   */
  private findMinimalCycles(): string[][] {
    // Step 1: Remove filaments (dead-end paths that don't form cycles)
    const workingEdges = this.getWorkingEdges();
    
    // Step 2: Find all faces using the working edges
    const allFaces: string[][] = [];
    const usedDirectedEdges = new Set<string>();

    // Start from leftmost point for consistent ordering
    const startPoint = this.findLeftmostPoint(workingEdges);
    if (!startPoint) return [];

    // Process each edge as two directed edges
    for (const [from, to] of workingEdges) {
      // Try both directions for this edge
      for (const [dirFrom, dirTo] of [[from, to], [to, from]]) {
        const edgeKey = this.getDirectedEdgeKey(dirFrom, dirTo);
        if (usedDirectedEdges.has(edgeKey)) continue;

        // Trace the face starting from this directed edge
        const face = this.traceFaceImproved(dirFrom, dirTo, workingEdges);
        
        if (face && face.length >= 3) {
          // Mark all directed edges in this face as used
          for (let i = 0; i < face.length; i++) {
            const fromVertex = face[i];
            const toVertex = face[(i + 1) % face.length];
            usedDirectedEdges.add(this.getDirectedEdgeKey(fromVertex, toVertex));
          }
          
          // Check if this face is not a duplicate
          if (!this.isCycleDuplicate(face, allFaces)) {
            allFaces.push(face);
          }
        }
      }
    }

    // Step 3: Filter out redundant composite faces
    // A face is redundant if it can be composed from other smaller faces
    // (i.e., all its edges are covered by edges from smaller faces)
    if (allFaces.length === 0) return [];
    if (allFaces.length === 1) return allFaces;

    // Calculate areas and sort faces by size (smallest first)
    const facesWithAreas = allFaces.map(face => {
      const points = face.map(id => this.points.get(id)!).filter(p => p !== undefined);
      const area = Math.abs(this.calculateSignedPolygonArea(points));
      const edges = new Set<string>();
      for (let i = 0; i < face.length; i++) {
        const from = face[i];
        const to = face[(i + 1) % face.length];
        const edgeKey = [from, to].sort().join('-');
        edges.add(edgeKey);
      }
      return { face, area, edges };
    });

    // Sort by area ascending (smallest faces first)
    facesWithAreas.sort((a, b) => a.area - b.area);

    // Keep faces that are minimal (not composed of other faces)
    const minimalFaces: string[][] = [];
    const usedEdges = new Set<string>();

    for (const faceData of facesWithAreas) {
      // Check if all edges of this face are already covered by smaller faces
      const allEdgesCovered = Array.from(faceData.edges).every(edge => usedEdges.has(edge));
      
      if (!allEdgesCovered) {
        // This face has at least one new edge, so it's minimal
        minimalFaces.push(faceData.face);
        // Add its edges to the used set
        faceData.edges.forEach(edge => usedEdges.add(edge));
      }
    }

    return minimalFaces;
  }

  /**
   * Trace a face (cycle) by following edges using the "right-hand rule"
   * This walks around the perimeter of a face by always taking the rightmost available edge
   * Uses improved cross-product based angle calculations for robustness
   */
  private traceFaceImproved(
    startFrom: string,
    startTo: string,
    edges: Array<[string, string]>
  ): string[] | null {
    const face: string[] = [];
    let currentFrom = startFrom;
    let currentTo = startTo;
    const maxSteps = this.points.size * 2;
    let steps = 0;

    do {
      face.push(currentFrom);
      
      // Find next edge using improved angle calculation
      const nextVertex = this.getNextVertexClockwiseImproved(
        currentFrom,
        currentTo,
        edges
      );
      
      if (!nextVertex) {
        return null;
      }

      currentFrom = currentTo;
      currentTo = nextVertex;
      
      steps++;
      if (steps > maxSteps) {
        console.warn('Face tracing exceeded max steps');
        return null;
      }
    } while (currentFrom !== startFrom);

    return face.length >= 3 ? face : null;
  }

  /**
   * Get the next vertex when following edges clockwise (right-hand rule)
   * Uses cross products for robust angle comparison (Geometric Tools approach)
   */
  private getNextVertexClockwiseImproved(
    fromVertex: string,
    toVertex: string,
    edges: Array<[string, string]>
  ): string | null {
    const toPoint = this.points.get(toVertex);
    const fromPoint = this.points.get(fromVertex);
    
    if (!toPoint || !fromPoint) return null;

    // Get neighbors from edges
    const neighbors = this.getNeighborsFromEdges(toVertex, edges)
      .filter(n => n !== fromVertex);
    
    if (neighbors.length === 0) return null;
    if (neighbors.length === 1) return neighbors[0];

    // Incoming direction vector (normalized concept, not actual normalization)
    const dCurr: [number, number] = [
      toPoint.x - fromPoint.x,
      toPoint.y - fromPoint.y
    ];

    let bestNeighbor: string | null = null;
    let bestNext: [number, number] | null = null;
    let currConvex = false;

    for (const neighborId of neighbors) {
      const neighborPoint = this.points.get(neighborId);
      if (!neighborPoint) continue;

      const dAdj: [number, number] = [
        neighborPoint.x - toPoint.x,
        neighborPoint.y - toPoint.y
      ];

      if (!bestNeighbor) {
        bestNeighbor = neighborId;
        bestNext = dAdj;
        // Cross product: dNext × dCurr
        currConvex = bestNext[0] * dCurr[1] <= bestNext[1] * dCurr[0];
        continue;
      }

      // Use cross products to determine clockwise ordering
      // This is more robust than angle calculations
      if (currConvex) {
        // If current vertex is convex, take any edge that's more clockwise
        if (
          dCurr[0] * dAdj[1] < dCurr[1] * dAdj[0] ||
          bestNext![0] * dAdj[1] < bestNext![1] * dAdj[0]
        ) {
          bestNeighbor = neighborId;
          bestNext = dAdj;
          currConvex = bestNext[0] * dCurr[1] <= bestNext[1] * dCurr[0];
        }
      } else {
        // If current vertex is reflex, be more selective
        if (
          dCurr[0] * dAdj[1] < dCurr[1] * dAdj[0] &&
          bestNext![0] * dAdj[1] < bestNext![1] * dAdj[0]
        ) {
          bestNeighbor = neighborId;
          bestNext = dAdj;
          currConvex = bestNext[0] * dCurr[1] < bestNext[1] * dCurr[0];
        }
      }
    }

    return bestNeighbor;
  }

  /**
   * Get neighboring point IDs from edge list
   */
  private getNeighborsFromEdges(
    pointId: string,
    edges: Array<[string, string]>
  ): string[] {
    const neighbors: string[] = [];
    for (const [from, to] of edges) {
      if (from === pointId) {
        neighbors.push(to);
      } else if (to === pointId) {
        neighbors.push(from);
      }
    }
    return neighbors;
  }

  /**
  /**
   * Create a directed edge key (order matters)
   */
  private getDirectedEdgeKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  /**
  /**
   * Check if a cycle is a duplicate (considering rotations and reflections)
   */
  private isCycleDuplicate(cycle: string[], existingCycles: string[][]): boolean {
    return existingCycles.some(existing => {
      if (existing.length !== cycle.length) return false;

      // Check all rotations
      for (let i = 0; i < existing.length; i++) {
        // Forward rotation
        let matches = true;
        for (let j = 0; j < cycle.length; j++) {
          if (existing[(i + j) % existing.length] !== cycle[j]) {
            matches = false;
            break;
          }
        }
        if (matches) return true;

        // Reverse rotation
        matches = true;
        for (let j = 0; j < cycle.length; j++) {
          if (existing[(i + j) % existing.length] !== cycle[cycle.length - 1 - j]) {
            matches = false;
            break;
          }
        }
        if (matches) return true;
      }

      return false;
    });
  }

  /**
   * Detect all rooms in the current graph using minimal cycle detection
   * Rebuilds the rooms map to ensure consistency
   * Returns all detected rooms
   */
  detectAllRooms(): Room[] {
    // Use the new minimal cycle detection algorithm
    const detectedCycles = this.findMinimalCycles();
    const nextRooms = new Map<string, Room>();
    const newRoomsList: Room[] = [];
    
    detectedCycles.forEach(cycle => {
      const candidateRoom = this.createRoomFromCycle(cycle);
      if (candidateRoom) {
        // Check if this room already exists in the OLD rooms map (same wall set)
        // We want to preserve IDs and names for existing rooms
        let matchedRoom: Room | undefined;
        
        for (const existingRoom of this.rooms.values()) {
          if (existingRoom.wallIds.length === candidateRoom.wallIds.length) {
            const existingWallSet = new Set(existingRoom.wallIds);
            if (candidateRoom.wallIds.every(id => existingWallSet.has(id))) {
              matchedRoom = existingRoom;
              break;
            }
          }
        }

        if (matchedRoom) {
          // Reuse ID and Name from the matching existing room
          candidateRoom.id = matchedRoom.id;
          candidateRoom.name = matchedRoom.name;
          // Preserve other properties if needed (e.g. fill color)
          if (matchedRoom.fill) {
            candidateRoom.fill = matchedRoom.fill;
          }
        } else {
          // This is a new room
          newRoomsList.push(candidateRoom);
        }

        // Add to the new rooms map
        nextRooms.set(candidateRoom.id, candidateRoom);
      }
    });

    // Replace the old rooms map with the new one
    // This ensures that rooms that are no longer valid (e.g. split by a new wall) are removed
    this.rooms = nextRooms;

    return Array.from(nextRooms.values());
  }

  /**
   * Get rooms that contain a specific wall
   */
  getRoomsContainingWall(wallId: string): Room[] {
    const containingRooms: Room[] = [];
    this.rooms.forEach(room => {
      if (room.wallIds.includes(wallId)) {
        containingRooms.push(room);
      }
    });
    return containingRooms;
  }

  // ==================== Graph-Wide Operations ====================

  /**
   * Clear all data from the graph
   * Returns the previous state for undo
   */
  clear(): { points: Map<string, Point>; walls: Map<string, Wall>; rooms: Map<string, Room> } {
    const previousState = {
      points: new Map(this.points),
      walls: new Map(this.walls),
      rooms: new Map(this.rooms),
    };

    this.points.clear();
    this.walls.clear();
    this.rooms.clear();

    return previousState;
  }

  /**
   * Restore a previous state
   */
  restore(
    points: Map<string, Point>,
    walls: Map<string, Wall>,
    rooms: Map<string, Room>
  ): void {
    this.points = new Map(points);
    this.walls = new Map(walls);
    this.rooms = new Map(rooms);
  }

  /**
   * Get the total count of elements
   */
  getCounts(): { points: number; walls: number; rooms: number } {
    return {
      points: this.points.size,
      walls: this.walls.size,
      rooms: this.rooms.size,
    };
  }

  /**
   * Create a deep copy of this graph
   */
  clone(): FloorplanGraph {
    return new FloorplanGraph(
      new Map(this.points),
      new Map(this.walls),
      new Map(this.rooms)
    );
  }

  /**
   * Export graph data for serialization
   */
  toJSON(): {
    points: Point[];
    walls: Wall[];
    rooms: Room[];
  } {
    return {
      points: Array.from(this.points.values()),
      walls: Array.from(this.walls.values()),
      rooms: Array.from(this.rooms.values()),
    };
  }

  /**
   * Import graph data from serialized format
   */
  static fromJSON(data: {
    points: Point[];
    walls: Wall[];
    rooms: Room[];
  }): FloorplanGraph {
    const points = new Map(data.points.map(p => [p.id, p]));
    const walls = new Map(data.walls.map(w => [w.id, w]));
    const rooms = new Map(data.rooms.map(r => [r.id, r]));
    return new FloorplanGraph(points, walls, rooms);
  }

  // ==================== Advanced Graph Operations ====================

  /**
   * Build adjacency list for graph algorithms
   */
  buildAdjacencyList(): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    // Initialize with all points
    this.points.forEach((_, pointId) => {
      adjacencyList.set(pointId, []);
    });

    // Add edges from walls
    this.walls.forEach(wall => {
      const neighbors1 = adjacencyList.get(wall.startPointId) || [];
      const neighbors2 = adjacencyList.get(wall.endPointId) || [];
      
      neighbors1.push(wall.endPointId);
      neighbors2.push(wall.startPointId);
      
      adjacencyList.set(wall.startPointId, neighbors1);
      adjacencyList.set(wall.endPointId, neighbors2);
    });

    return adjacencyList;
  }

  /**
   * Get the degree (number of connections) of a point
   */
  getPointDegree(pointId: string): number {
    return this.getConnectedWalls(pointId).length;
  }

  /**
   * Find isolated points (degree 0)
   */
  findIsolatedPoints(): Point[] {
    const isolated: Point[] = [];
    this.points.forEach(point => {
      if (this.getPointDegree(point.id) === 0) {
        isolated.push(point);
      }
    });
    return isolated;
  }

  /**
   * Validate graph integrity
   * Returns list of issues found
   */
  validate(): string[] {
    const issues: string[] = [];

    // Check that all wall endpoints exist
    this.walls.forEach((wall, wallId) => {
      if (!this.points.has(wall.startPointId)) {
        issues.push(`Wall ${wallId} references missing start point ${wall.startPointId}`);
      }
      if (!this.points.has(wall.endPointId)) {
        issues.push(`Wall ${wallId} references missing end point ${wall.endPointId}`);
      }
    });

    // Check that all room walls exist
    this.rooms.forEach((room, roomId) => {
      room.wallIds.forEach(wallId => {
        if (!this.walls.has(wallId)) {
          issues.push(`Room ${roomId} references missing wall ${wallId}`);
        }
      });
    });

    return issues;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Update rooms after walls are removed
   */
  private updateRoomsAfterWallRemoval(removedWallIds: string[]): void {
    const roomsToRemove: string[] = [];

    this.rooms.forEach((room, roomId) => {
      const hasRemovedWall = room.wallIds.some(wallId => removedWallIds.includes(wallId));
      if (hasRemovedWall) {
        roomsToRemove.push(roomId);
      }
    });

    roomsToRemove.forEach(roomId => this.rooms.delete(roomId));
  }
}

/**
 * Helper function to create an empty graph
 */
export function createEmptyGraph(): FloorplanGraph {
  return new FloorplanGraph();
}

/**
 * Helper function to create a graph from existing data
 */
export function createGraphFromData(
  points: Map<string, Point>,
  walls: Map<string, Wall>,
  rooms: Map<string, Room>
): FloorplanGraph {
  return new FloorplanGraph(points, walls, rooms);
}
