# Data Model: Core Floorplan

## Entities

### Vertex
Represents a point in 2D space.

```typescript
interface Vertex {
  id: string;
  x: number;
  y: number;
}
```

### Edge
Represents a wall connecting two vertices.

```typescript
interface Edge {
  id: string;
  startVertexId: string;
  endVertexId: string;
  thickness: number; // in pixels, default 10
  // Future: height, material, etc.
}
```

### Surface
Represents a detected room (closed loop of edges).

```typescript
interface Surface {
  id: string;
  edgeIds: string[]; // Ordered list of edge IDs forming the perimeter
  area: number;      // in square pixels
  label?: string;    // e.g., "Room 1"
}
```

## Core Logic

### SpatialGraph
The core domain model encapsulating the graph data structure and operations.

```typescript
class SpatialGraph {
  private vertices: Map<string, Vertex>;
  private edges: Map<string, Edge>;
  private surfaces: Map<string, Surface>;

  // Core Operations
  addVertex(vertex: Vertex): void;
  addEdge(edge: Edge): void;
  removeVertex(id: string): void;
  removeEdge(id: string): void;
  
  // Algorithms
  detectSurfaces(): void;
  getSurfaces(): Map<string, Surface>;
}
```

## Command Pattern

### Command Interface
All operations on the SpatialGraph must implement this interface.

```typescript
interface Command {
  execute(graph: SpatialGraph): void;
  undo(graph: SpatialGraph): void;
}
```

### CommandManager
Manages the history stack for undo/redo.

```typescript
class CommandManager {
  private history: Command[];
  private redoStack: Command[];
  
  execute(command: Command, graph: SpatialGraph): void;
  undo(graph: SpatialGraph): void;
  redo(graph: SpatialGraph): void;
}
```

### FloorplanStore
The global state structure managed by Zustand.

```typescript
interface FloorplanState {
  // The single source of truth for the graph
  graph: SpatialGraph;
  
  // Command Manager for history
  commandManager: CommandManager;
  
  // UI State
  activeTool: 'draw' | 'select' | 'erase' | 'pan';
  gridSize: number;
  snapEnabled: boolean;
  
  // Actions (dispatch commands)
  dispatch: (command: Command) => void;
  undo: () => void;
  redo: () => void;
}
```

## Relationships

- **Vertex (1) <-> (0..*) Edge**: A vertex can be the start or end of multiple edges.
- **Edge (1) <-> (2) Vertex**: An edge must have exactly two endpoints.
- **Surface (1) <-> (3..*) Edge**: A surface is bounded by at least 3 edges.
- **Edge (1) <-> (0..2) Surface**: An edge can bound up to two surfaces (one on each side).
