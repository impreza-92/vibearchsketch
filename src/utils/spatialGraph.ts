/**
 * SpatialGraph - Core graph data structure for spatial management
 * 
 * This class encapsulates all graph operations and provides a clean API
 * for managing vertices, edges, and surfaces. It separates the data structure
 * concerns from UI rendering and state management.
 */

import type { Vertex, Edge, Surface } from '../types/spatial';
import { generateId } from './geometry';

/**
 * SpatialGraph manages the graph data structure
 * - Vertices (Nodes): Points
 * - Edges: Walls connecting points
 * - Cycles: Surfaces (closed paths)
 */
export class SpatialGraph {
  private vertices: Map<string, Vertex>;
  private edges: Map<string, Edge>;
  private surfaces: Map<string, Surface>;

  constructor(
    vertices?: Map<string, Vertex>,
    edges?: Map<string, Edge>,
    surfaces?: Map<string, Surface>
  ) {
    this.vertices = vertices ? new Map(vertices) : new Map();
    this.edges = edges ? new Map(edges) : new Map();
    this.surfaces = surfaces ? new Map(surfaces) : new Map();
  }

  // ==================== Vertex Operations ====================

  /**
   * Add a vertex to the graph
   */
  addVertex(vertex: Vertex): void {
    this.vertices.set(vertex.id, vertex);
  }

  /**
   * Remove a vertex and all connected edges
   * Returns the IDs of removed edges for undo purposes
   */
  removeVertex(vertexId: string): string[] {
    const removedEdgeIds: string[] = [];
    
    // Find and remove all edges connected to this vertex
    this.edges.forEach((edge, edgeId) => {
      if (edge.startVertexId === vertexId || edge.endVertexId === vertexId) {
        this.edges.delete(edgeId);
        removedEdgeIds.push(edgeId);
      }
    });

    // Remove the vertex
    this.vertices.delete(vertexId);

    // Update surfaces if any edges were removed
    if (removedEdgeIds.length > 0) {
      this.updateSurfacesAfterEdgeRemoval(removedEdgeIds);
    }

    return removedEdgeIds;
  }

  /**
   * Get a vertex by ID
   */
  getVertex(vertexId: string): Vertex | undefined {
    return this.vertices.get(vertexId);
  }

  /**
   * Get all vertices
   */
  getVertices(): Map<string, Vertex> {
    return new Map(this.vertices);
  }

  /**
   * Check if a vertex exists
   */
  hasVertex(vertexId: string): boolean {
    return this.vertices.has(vertexId);
  }

  /**
   * Find vertices near a given position
   */
  findNearbyVertices(x: number, y: number, radius: number): Vertex[] {
    const nearby: Vertex[] = [];
    this.vertices.forEach(vertex => {
      const dx = vertex.x - x;
      const dy = vertex.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        nearby.push(vertex);
      }
    });
    return nearby;
  }

  // ==================== Edge Operations ====================

  /**
   * Add an edge to the graph
   * Automatically detects and updates surfaces
   */
  addEdge(edge: Edge): Surface[] {
    this.edges.set(edge.id, edge);
    
    // Detect new surfaces after adding the edge using our internal algorithm
    return this.detectAllSurfaces();
  }

  /**
   * Remove an edge from the graph
   * Returns affected surfaces for undo purposes
   */
  removeEdge(edgeId: string): Map<string, Surface> {
    const affectedSurfaces = new Map<string, Surface>();

    // Find surfaces that use this edge
    this.surfaces.forEach((surface, surfaceId) => {
      if (surface.edgeIds.includes(edgeId)) {
        affectedSurfaces.set(surfaceId, surface);
        // We don't need to delete here, detectAllSurfaces will replace the map
      }
    });

    // Remove the edge
    this.edges.delete(edgeId);

    // Re-detect all surfaces to handle merges/changes
    this.detectAllSurfaces();

    return affectedSurfaces;
  }

  /**
   * Get an edge by ID
   */
  getEdge(edgeId: string): Edge | undefined {
    return this.edges.get(edgeId);
  }

  /**
   * Get all edges
   */
  getEdges(): Map<string, Edge> {
    return new Map(this.edges);
  }

  /**
   * Check if an edge exists
   */
  hasEdge(edgeId: string): boolean {
    return this.edges.has(edgeId);
  }

  /**
   * Get all edges connected to a vertex
   */
  getConnectedEdges(vertexId: string): Edge[] {
    const connected: Edge[] = [];
    this.edges.forEach(edge => {
      if (edge.startVertexId === vertexId || edge.endVertexId === vertexId) {
        connected.push(edge);
      }
    });
    return connected;
  }

  /**
   * Check if two vertices are connected by an edge
   */
  areVerticesConnected(vertexId1: string, vertexId2: string): boolean {
    for (const edge of this.edges.values()) {
      if (
        (edge.startVertexId === vertexId1 && edge.endVertexId === vertexId2) ||
        (edge.startVertexId === vertexId2 && edge.endVertexId === vertexId1)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find edge between two vertices
   */
  findEdgeBetweenVertices(vertexId1: string, vertexId2: string): Edge | undefined {
    for (const edge of this.edges.values()) {
      if (
        (edge.startVertexId === vertexId1 && edge.endVertexId === vertexId2) ||
        (edge.startVertexId === vertexId2 && edge.endVertexId === vertexId1)
      ) {
        return edge;
      }
    }
    return undefined;
  }

  // ==================== Surface Operations ====================

  /**
   * Add a surface to the graph
   */
  addSurface(surface: Surface): void {
    this.surfaces.set(surface.id, surface);
  }

  /**
   * Remove a surface from the graph
   */
  removeSurface(surfaceId: string): Surface | undefined {
    const surface = this.surfaces.get(surfaceId);
    this.surfaces.delete(surfaceId);
    return surface;
  }

  /**
   * Update a surface's properties
   */
  updateSurface(surfaceId: string, updates: Partial<Surface>): Surface | undefined {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return undefined;

    const updatedSurface = { ...surface, ...updates };
    this.surfaces.set(surfaceId, updatedSurface);
    return surface; // Return old surface for undo
  }

  /**
   * Get a surface by ID
   */
  getSurface(surfaceId: string): Surface | undefined {
    return this.surfaces.get(surfaceId);
  }

  /**
   * Get all surfaces
   */
  getSurfaces(): Map<string, Surface> {
    return new Map(this.surfaces);
  }

  /**
   * Check if a surface exists
   */
  hasSurface(surfaceId: string): boolean {
    return this.surfaces.has(surfaceId);
  }

  /**
   * Create a surface from a cycle of vertex IDs
   */
  private createSurfaceFromCycle(cycle: string[]): Surface | null {
    if (cycle.length < 3) return null;

    // Get edges for this cycle
    const edgeIds: string[] = [];
    for (let i = 0; i < cycle.length; i++) {
      const startId = cycle[i];
      const endId = cycle[(i + 1) % cycle.length];
      
      const edge = this.findEdgeBetweenVertices(startId, endId);
      if (!edge) return null; // Cycle is invalid if any edge doesn't exist
      edgeIds.push(edge.id);
    }

    // Calculate centroid and area
    const vertices = cycle.map(id => this.vertices.get(id)!);
    const centroid = this.calculateCentroid(vertices);
    const area = this.calculatePolygonArea(vertices);

    // Filter out very small cycles (likely numerical artifacts)
    if (area < 100) return null; // Minimum area threshold

    return {
      id: generateId(),
      name: `Surface ${this.surfaces.size + 1}`,
      edgeIds,
      centroid,
      area,
    };
  }

  /**
   * Calculate centroid of a set of vertices
   */
  private calculateCentroid(vertices: Vertex[]): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    vertices.forEach(p => {
      sumX += p.x;
      sumY += p.y;
    });
    return {
      x: sumX / vertices.length,
      y: sumY / vertices.length,
    };
  }

  /**
   * Calculate polygon area using Shoelace formula
   * Returns signed area (positive for counter-clockwise, negative for clockwise)
   */
  private calculatePolygonArea(vertices: Vertex[]): number {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
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
    
    for (const edge of this.edges.values()) {
      if (!adjacency.has(edge.startVertexId)) {
        adjacency.set(edge.startVertexId, new Set());
      }
      if (!adjacency.has(edge.endVertexId)) {
        adjacency.set(edge.endVertexId, new Set());
      }
      adjacency.get(edge.startVertexId)!.add(edge.endVertexId);
      adjacency.get(edge.endVertexId)!.add(edge.startVertexId);
    }

    // Find and remove filaments
    let hasFilaments = true;
    while (hasFilaments) {
      hasFilaments = false;
      
      // Find endpoints (vertices with only one neighbor)
      const endpoints: string[] = [];
      for (const [vertexId, neighbors] of adjacency.entries()) {
        if (neighbors.size === 1) {
          endpoints.push(vertexId);
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
   * Find the leftmost vertex for consistent cycle orientation
   */
  private findLeftmostVertex(edges: Array<[string, string]>): string | null {
    if (edges.length === 0) return null;
    
    // Get all vertices involved in edges
    const verticesInEdges = new Set<string>();
    for (const [from, to] of edges) {
      verticesInEdges.add(from);
      verticesInEdges.add(to);
    }

    let leftmost: string | null = null;
    let minX = Infinity;
    let minY = Infinity;

    for (const vertexId of verticesInEdges) {
      const vertex = this.vertices.get(vertexId);
      if (!vertex) continue;
      
      // Leftmost, then bottommost for ties
      if (vertex.x < minX || (vertex.x === minX && vertex.y < minY)) {
        minX = vertex.x;
        minY = vertex.y;
        leftmost = vertexId;
      }
    }

    return leftmost;
  }

  /**
   * Calculate signed polygon area using Shoelace formula
   * Positive for counter-clockwise winding, negative for clockwise winding
   */
  private calculateSignedPolygonArea(vertices: Vertex[]): number {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
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

    // Start from leftmost vertex for consistent ordering
    const startVertex = this.findLeftmostVertex(workingEdges);
    if (!startVertex) return [];

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
      const vertices = face.map(id => this.vertices.get(id)!).filter(p => p !== undefined);
      const area = Math.abs(this.calculateSignedPolygonArea(vertices));
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
    const maxSteps = this.vertices.size * 2;
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
    const toPoint = this.vertices.get(toVertex);
    const fromPoint = this.vertices.get(fromVertex);
    
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
      const neighborPoint = this.vertices.get(neighborId);
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
   * Get neighboring vertex IDs from edge list
   */
  private getNeighborsFromEdges(
    vertexId: string,
    edges: Array<[string, string]>
  ): string[] {
    const neighbors: string[] = [];
    for (const [from, to] of edges) {
      if (from === vertexId) {
        neighbors.push(to);
      } else if (to === vertexId) {
        neighbors.push(from);
      }
    }
    return neighbors;
  }

  /**
   * Create a directed edge key (order matters)
   */
  private getDirectedEdgeKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

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
   * Detect all surfaces in the current graph using minimal cycle detection
   * Rebuilds the surfaces map to ensure consistency
   * Returns all detected surfaces
   */
  detectAllSurfaces(): Surface[] {
    // Use the new minimal cycle detection algorithm
    const detectedCycles = this.findMinimalCycles();
    const nextSurfaces = new Map<string, Surface>();
    const newSurfacesList: Surface[] = [];
    
    detectedCycles.forEach(cycle => {
      const candidateSurface = this.createSurfaceFromCycle(cycle);
      if (candidateSurface) {
        // Check if this surface already exists in the OLD surfaces map (same edge set)
        // We want to preserve IDs and names for existing surfaces
        let matchedSurface: Surface | undefined;
        
        for (const existingSurface of this.surfaces.values()) {
          if (existingSurface.edgeIds.length === candidateSurface.edgeIds.length) {
            const existingEdgeSet = new Set(existingSurface.edgeIds);
            if (candidateSurface.edgeIds.every(id => existingEdgeSet.has(id))) {
              matchedSurface = existingSurface;
              break;
            }
          }
        }

        if (matchedSurface) {
          // Reuse ID and Name from the matching existing surface
          candidateSurface.id = matchedSurface.id;
          candidateSurface.name = matchedSurface.name;
          // Preserve other properties if needed (e.g. fill color)
          if (matchedSurface.fill) {
            candidateSurface.fill = matchedSurface.fill;
          }
        } else {
          // This is a new surface
          newSurfacesList.push(candidateSurface);
        }

        // Add to the new surfaces map
        nextSurfaces.set(candidateSurface.id, candidateSurface);
      }
    });

    // Replace the old surfaces map with the new one
    // This ensures that surfaces that are no longer valid (e.g. split by a new edge) are removed
    this.surfaces = nextSurfaces;

    return Array.from(nextSurfaces.values());
  }

  /**
   * Get surfaces that contain a specific edge
   */
  getSurfacesContainingEdge(edgeId: string): Surface[] {
    const containingSurfaces: Surface[] = [];
    this.surfaces.forEach(surface => {
      if (surface.edgeIds.includes(edgeId)) {
        containingSurfaces.push(surface);
      }
    });
    return containingSurfaces;
  }

  // ==================== Graph-Wide Operations ====================

  /**
   * Clear all data from the graph
   * Returns the previous state for undo
   */
  clear(): { vertices: Map<string, Vertex>; edges: Map<string, Edge>; surfaces: Map<string, Surface> } {
    const previousState = {
      vertices: new Map(this.vertices),
      edges: new Map(this.edges),
      surfaces: new Map(this.surfaces),
    };

    this.vertices.clear();
    this.edges.clear();
    this.surfaces.clear();

    return previousState;
  }

  /**
   * Restore a previous state
   */
  restore(
    vertices: Map<string, Vertex>,
    edges: Map<string, Edge>,
    surfaces: Map<string, Surface>
  ): void {
    this.vertices = new Map(vertices);
    this.edges = new Map(edges);
    this.surfaces = new Map(surfaces);
  }

  /**
   * Get the total count of elements
   */
  getCounts(): { vertices: number; edges: number; surfaces: number } {
    return {
      vertices: this.vertices.size,
      edges: this.edges.size,
      surfaces: this.surfaces.size,
    };
  }

  /**
   * Create a deep copy of this graph
   */
  clone(): SpatialGraph {
    return new SpatialGraph(
      new Map(this.vertices),
      new Map(this.edges),
      new Map(this.surfaces)
    );
  }

  /**
   * Export graph data for serialization
   */
  toJSON(): {
    vertices: Vertex[];
    edges: Edge[];
    surfaces: Surface[];
  } {
    return {
      vertices: Array.from(this.vertices.values()),
      edges: Array.from(this.edges.values()),
      surfaces: Array.from(this.surfaces.values()),
    };
  }

  /**
   * Import graph data from serialized format
   */
  static fromJSON(data: {
    vertices: Vertex[];
    edges: Edge[];
    surfaces: Surface[];
  }): SpatialGraph {
    const vertices = new Map(data.vertices.map(p => [p.id, p]));
    const edges = new Map(data.edges.map(w => [w.id, w]));
    const surfaces = new Map(data.surfaces.map(r => [r.id, r]));
    return new SpatialGraph(vertices, edges, surfaces);
  }

  // ==================== Advanced Graph Operations ====================

  /**
   * Build adjacency list for graph algorithms
   */
  buildAdjacencyList(): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    // Initialize with all vertices
    this.vertices.forEach((_, vertexId) => {
      adjacencyList.set(vertexId, []);
    });

    // Add edges from edges
    this.edges.forEach(edge => {
      const neighbors1 = adjacencyList.get(edge.startVertexId) || [];
      const neighbors2 = adjacencyList.get(edge.endVertexId) || [];
      
      neighbors1.push(edge.endVertexId);
      neighbors2.push(edge.startVertexId);
      
      adjacencyList.set(edge.startVertexId, neighbors1);
      adjacencyList.set(edge.endVertexId, neighbors2);
    });

    return adjacencyList;
  }

  /**
   * Get the degree (number of connections) of a vertex
   */
  getVertexDegree(vertexId: string): number {
    return this.getConnectedEdges(vertexId).length;
  }

  /**
   * Find isolated vertices (degree 0)
   */
  findIsolatedVertices(): Vertex[] {
    const isolated: Vertex[] = [];
    this.vertices.forEach(vertex => {
      if (this.getVertexDegree(vertex.id) === 0) {
        isolated.push(vertex);
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

    // Check that all edge endpoints exist
    this.edges.forEach((edge, edgeId) => {
      if (!this.vertices.has(edge.startVertexId)) {
        issues.push(`Edge ${edgeId} references missing start vertex ${edge.startVertexId}`);
      }
      if (!this.vertices.has(edge.endVertexId)) {
        issues.push(`Edge ${edgeId} references missing end vertex ${edge.endVertexId}`);
      }
    });

    // Check that all surface edges exist
    this.surfaces.forEach((surface, surfaceId) => {
      surface.edgeIds.forEach(edgeId => {
        if (!this.edges.has(edgeId)) {
          issues.push(`Surface ${surfaceId} references missing edge ${edgeId}`);
        }
      });
    });

    return issues;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Update surfaces after edges are removed
   */
  private updateSurfacesAfterEdgeRemoval(removedEdgeIds: string[]): void {
    const surfacesToRemove: string[] = [];

    this.surfaces.forEach((surface, surfaceId) => {
      const hasRemovedEdge = surface.edgeIds.some(edgeId => removedEdgeIds.includes(edgeId));
      if (hasRemovedEdge) {
        surfacesToRemove.push(surfaceId);
      }
    });

    surfacesToRemove.forEach(surfaceId => this.surfaces.delete(surfaceId));
  }
}

/**
 * Helper function to create an empty graph
 */
export function createEmptyGraph(): SpatialGraph {
  return new SpatialGraph();
}

/**
 * Helper function to create a graph from existing data
 */
export function createGraphFromData(
  vertices: Map<string, Vertex>,
  edges: Map<string, Edge>,
  surfaces: Map<string, Surface>
): SpatialGraph {
  return new SpatialGraph(vertices, edges, surfaces);
}
