/**
 * Command Pattern Implementation for Undo/Redo Functionality
 * 
 * This module implements the Command pattern to provide robust undo/redo
 * functionality for all drawing operations. Each command encapsulates an
 * action and its inverse, allowing for reliable state rollback.
 */

import type { Vertex, Edge, Surface } from '../types/spatial';
import { SpatialGraph } from './spatialGraph';

/**
 * Base Command interface
 * All commands must implement execute() and undo() methods
 */
export interface Command {
  /** Execute the command, modifying the state */
  execute(state: CommandState): CommandState;
  
  /** Undo the command, reverting the state */
  undo(state: CommandState): CommandState;
  
  /** Get a description of this command for debugging */
  getDescription(): string;
}

/**
 * State interface that commands operate on
 * Uses SpatialGraph for data operations
 */
export interface CommandState {
  graph: SpatialGraph;
  selectedIds: Set<string>;
}

/**
 * Command to add a vertex to the graph
 */
export class AddVertexCommand implements Command {
  private vertex: Vertex;

  constructor(vertex: Vertex) {
    this.vertex = vertex;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.addVertex(this.vertex);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.removeVertex(this.vertex.id);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Add vertex at (${this.vertex.x}, ${this.vertex.y})`;
  }
}

/**
 * Command to draw an edge with its endpoints
 * This is the atomic command for drawing an edge, which may involve:
 * - Creating 0, 1, or 2 new vertices (if reusing existing vertices)
 * - Creating 1 edge connecting the vertices
 * 
 * This ensures that drawing an edge is a single undoable operation
 */
export class DrawEdgeCommand implements Command {
  private startVertex: Vertex;
  private endVertex: Vertex;
  private edge: Edge;
  private startVertexExisted: boolean;
  private endVertexExisted: boolean;
  private createdSurfaces: Surface[] = [];

  constructor(startVertex: Vertex, endVertex: Vertex, edge: Edge, startVertexExists: boolean, endVertexExists: boolean) {
    this.startVertex = startVertex;
    this.endVertex = endVertex;
    this.edge = edge;
    this.startVertexExisted = startVertexExists;
    this.endVertexExisted = endVertexExists;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Add start vertex if it didn't exist
    if (!this.startVertexExisted) {
      newGraph.addVertex(this.startVertex);
    }
    
    // Add end vertex if it didn't exist
    if (!this.endVertexExisted) {
      newGraph.addVertex(this.endVertex);
    }
    
    // Add edge and track newly created surfaces
    this.createdSurfaces = newGraph.addEdge(this.edge);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Remove the edge
    newGraph.removeEdge(this.edge.id);
    
    // Remove end vertex if it was created by this command
    if (!this.endVertexExisted) {
      newGraph.removeVertex(this.endVertex.id);
    }
    
    // Remove start vertex if it was created by this command
    if (!this.startVertexExisted) {
      newGraph.removeVertex(this.startVertex.id);
    }

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    const startDesc = this.startVertexExisted ? 'existing' : 'new';
    const endDesc = this.endVertexExisted ? 'existing' : 'new';
    const surfacesInfo = this.createdSurfaces.length > 0 ? ` (created ${this.createdSurfaces.length} surface${this.createdSurfaces.length > 1 ? 's' : ''})` : '';
    return `Draw edge from ${startDesc} vertex to ${endDesc} vertex${surfacesInfo}`;
  }
}

/**
 * Command to add an edge to the graph
 * Automatically detects and creates surfaces
 * 
 * Note: For interactive edge drawing, use DrawEdgeCommand instead.
 * This is for programmatic edge addition when vertices already exist.
 */
export class AddEdgeCommand implements Command {
  private createdSurfaces: Surface[] = [];
  private edge: Edge;

  constructor(edge: Edge) {
    this.edge = edge;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Add edge and track newly created surfaces
    this.createdSurfaces = newGraph.addEdge(this.edge);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Remove the edge
    newGraph.removeEdge(this.edge.id);
    
    // Remove surfaces that were created by this edge
    this.createdSurfaces.forEach(surface => {
      newGraph.removeSurface(surface.id);
    });

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Add edge from vertex ${this.edge.startVertexId} to ${this.edge.endVertexId}`;
  }
}

/**
 * Command to remove an edge from the graph
 */
export class RemoveEdgeCommand implements Command {
  private removedEdge: Edge | null = null;
  private affectedSurfaces: Map<string, Surface> = new Map();
  private edgeId: string;

  constructor(edgeId: string) {
    this.edgeId = edgeId;
  }

  execute(state: CommandState): CommandState {
    const edge = state.graph.getEdge(this.edgeId);
    if (!edge) return state;

    this.removedEdge = edge;

    const newGraph = state.graph.clone();
    
    // Remove edge and store affected surfaces
    this.affectedSurfaces = newGraph.removeEdge(this.edgeId);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.removedEdge) return state;

    const newGraph = state.graph.clone();
    
    // Restore the edge (without auto surface detection)
    newGraph.getEdges().set(this.edgeId, this.removedEdge);
    
    // Restore affected surfaces
    this.affectedSurfaces.forEach((surface) => {
      newGraph.addSurface(surface);
    });

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Remove edge ${this.edgeId}`;
  }
}

/**
 * Command to split an edge at a vertex
 */
export class SplitEdgeCommand implements Command {
  private originalEdge: Edge | null = null;
  private affectedSurfaces: Map<string, Surface> = new Map();
  private edgeId: string;
  private splitVertex: Vertex;
  private edge1: Edge;
  private edge2: Edge;

  constructor(
    edgeId: string,
    splitVertex: Vertex,
    edge1: Edge,
    edge2: Edge
  ) {
    this.edgeId = edgeId;
    this.splitVertex = splitVertex;
    this.edge1 = edge1;
    this.edge2 = edge2;
  }

  execute(state: CommandState): CommandState {
    const edgeToSplit = state.graph.getEdge(this.edgeId);
    if (!edgeToSplit) return state;

    this.originalEdge = edgeToSplit;

    const newGraph = state.graph.clone();

    // Store affected surfaces before modification
    const affectedSurfacesList = newGraph.getSurfacesContainingEdge(this.edgeId);
    affectedSurfacesList.forEach(surface => {
      this.affectedSurfaces.set(surface.id, surface);
    });

    // Add the split vertex
    newGraph.addVertex(this.splitVertex);

    // Remove the original edge
    newGraph.removeEdge(this.edgeId);

    // Add the two new edges with surface detection
    newGraph.addEdge(this.edge1);
    newGraph.addEdge(this.edge2);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.originalEdge) return state;

    const newGraph = state.graph.clone();

    // Remove the split vertex (this also removes connected edges)
    newGraph.removeVertex(this.splitVertex.id);

    // Restore the original edge
    newGraph.getEdges().set(this.edgeId, this.originalEdge);

    // Restore original surfaces
    this.affectedSurfaces.forEach((surface) => {
      newGraph.addSurface(surface);
    });

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Split edge ${this.edgeId} at vertex (${this.splitVertex.x}, ${this.splitVertex.y})`;
  }
}

/**
 * Command to add a surface to the graph
 */
export class AddSurfaceCommand implements Command {
  private surface: Surface;

  constructor(surface: Surface) {
    this.surface = surface;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.addSurface(this.surface);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.removeSurface(this.surface.id);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Add surface "${this.surface.name}"`;
  }
}

/**
 * Command to update a surface's properties
 */
export class UpdateSurfaceCommand implements Command {
  private previousSurface: Surface | null = null;
  private surfaceId: string;
  private updates: Partial<Surface>;

  constructor(
    surfaceId: string,
    updates: Partial<Surface>
  ) {
    this.surfaceId = surfaceId;
    this.updates = updates;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Update surface and store previous state
    this.previousSurface = newGraph.updateSurface(this.surfaceId, this.updates) || null;

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.previousSurface) return state;

    const newGraph = state.graph.clone();
    newGraph.getSurfaces().set(this.surfaceId, this.previousSurface);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Update surface ${this.surfaceId}`;
  }
}

/**
 * Command to remove a surface from the graph
 */
export class RemoveSurfaceCommand implements Command {
  private removedSurface: Surface | null = null;
  private surfaceId: string;

  constructor(surfaceId: string) {
    this.surfaceId = surfaceId;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    this.removedSurface = newGraph.removeSurface(this.surfaceId) || null;

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.removedSurface) return state;

    const newGraph = state.graph.clone();
    newGraph.addSurface(this.removedSurface);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Remove surface ${this.surfaceId}`;
  }
}

/**
 * Command to detect all surfaces in the graph
 */
export class DetectSurfacesCommand implements Command {
  private previousSurfaces: Map<string, Surface> = new Map();
  private detectedSurfaces: Surface[] = [];

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Store previous surfaces for undo
    this.previousSurfaces = newGraph.getSurfaces();

    // Detect all surfaces in the current graph
    this.detectedSurfaces = newGraph.detectAllSurfaces();
    
    if (this.detectedSurfaces.length === 0) return state;

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Restore previous surfaces
    newGraph.restore(
      newGraph.getVertices(),
      newGraph.getEdges(),
      this.previousSurfaces
    );

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Detect surfaces (found ${this.detectedSurfaces.length} surfaces)`;
  }
}

/**
 * Command to clear all elements from the graph
 */
export class ClearAllCommand implements Command {
  private previousState: CommandState | null = null;

  execute(state: CommandState): CommandState {
    // Store entire state for undo
    this.previousState = {
      graph: state.graph.clone(),
      selectedIds: new Set(state.selectedIds),
    };

    // Create a new empty graph
    const clearedGraph = state.graph.clone();
    clearedGraph.clear();

    return {
      graph: clearedGraph,
      selectedIds: new Set(),
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.previousState) return state;

    return {
      graph: this.previousState.graph.clone(),
      selectedIds: new Set(this.previousState.selectedIds),
    };
  }

  getDescription(): string {
    return 'Clear all';
  }
}

/**
 * Composite command that executes multiple commands as a single action
 * Useful for operations that need to be undone together
 */
export class CompositeCommand implements Command {
  private commands: Command[];
  private description: string;

  constructor(
    commands: Command[],
    description: string
  ) {
    this.commands = commands;
    this.description = description;
  }

  execute(state: CommandState): CommandState {
    let currentState = state;
    for (const command of this.commands) {
      currentState = command.execute(currentState);
    }
    return currentState;
  }

  undo(state: CommandState): CommandState {
    let currentState = state;
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      currentState = this.commands[i].undo(currentState);
    }
    return currentState;
  }

  getDescription(): string {
    return this.description;
  }
}

/**
 * Command History Manager
 * Manages the undo/redo stack and command execution
 */
export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;

  /**
   * Execute a command and add it to history
   */
  execute(command: Command, state: CommandState): CommandState {
    // Remove any commands after current index (when executing after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Execute the command
    const newState = command.execute(state);

    // Add to history
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    console.log(`Executed: ${command.getDescription()}`);
    return newState;
  }

  /**
   * Undo the last command
   */
  undo(state: CommandState): CommandState | null {
    if (!this.canUndo()) return null;

    const command = this.history[this.currentIndex];
    const newState = command.undo(state);
    this.currentIndex--;

    console.log(`Undone: ${command.getDescription()}`);
    return newState;
  }

  /**
   * Redo the next command
   */
  redo(state: CommandState): CommandState | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    const newState = command.execute(state);

    console.log(`Redone: ${command.getDescription()}`);
    return newState;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get the current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get a description of the command that would be undone
   */
  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].getDescription();
  }

  /**
   * Get a description of the command that would be redone
   */
  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].getDescription();
  }
}
