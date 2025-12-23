# FloorplanGraph Architecture

## Overview

The `FloorplanGraph` class provides a clean separation between the graph data structure (points, walls, rooms) and the UI rendering layer. This architecture improves maintainability, testability, and makes it easier to implement new features.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  - PixiCanvas.tsx (rendering)                              │
│  - Toolbar.tsx (user actions)                              │
│  - App.tsx (layout)                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ React Context API
┌──────────────────────▼──────────────────────────────────────┐
│                   State Management Layer                    │
│  - FloorplanContext.tsx (state + actions)                  │
│  - CommandHistory (undo/redo)                              │
│  - Command classes (execute/undo)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ FloorplanGraph API
┌──────────────────────▼──────────────────────────────────────┐
│                    Graph Data Layer                         │
│  - FloorplanGraph class                                    │
│  - Point/Wall/Room storage (Map<id, entity>)               │
│  - Graph algorithms (room detection, validation)           │
│  - Adjacency list management                               │
└─────────────────────────────────────────────────────────────┘
```

## FloorplanGraph Class

### Responsibilities

1. **Data Storage**: Manages Maps of points, walls, and rooms
2. **Graph Operations**: Provides clean APIs for adding/removing entities
3. **Room Detection**: Automatically detects rooms when walls are added
4. **Validation**: Validates graph integrity
5. **State Management**: Handles cloning and restoration for undo/redo

### Key Design Principles

- **Encapsulation**: All graph data is private, accessed only through public methods
- **Immutability**: Commands work with cloned graphs to preserve state for undo
- **Automatic Room Detection**: Adding/removing walls automatically updates affected rooms
- **Type Safety**: Full TypeScript support with proper interfaces

## API Reference

### Point Operations

```typescript
class FloorplanGraph {
  // Add a point to the graph
  addPoint(point: Point): void

  // Remove a point and all connected walls
  removePoint(pointId: string): void

  // Get a point by ID
  getPoint(pointId: string): Point | undefined

  // Check if a point exists
  hasPoint(pointId: string): boolean

  // Find points within a radius
  findNearbyPoints(x: number, y: number, radius: number): Point[]

  // Get all points
  getPoints(): Map<string, Point>
}
```

### Wall Operations

```typescript
class FloorplanGraph {
  // Add a wall and detect affected rooms
  // Returns: Map of created/updated rooms
  addWall(wall: Wall): Map<string, Room>

  // Remove a wall and update affected rooms
  // Returns: Map of rooms that were affected
  removeWall(wallId: string): Map<string, Room>

  // Get a wall by ID
  getWall(wallId: string): Wall | undefined

  // Check if a wall exists
  hasWall(wallId: string): boolean

  // Get walls connected to a point
  getConnectedWalls(pointId: string): Wall[]

  // Get all walls
  getWalls(): Map<string, Wall>
}
```

### Room Operations

```typescript
class FloorplanGraph {
  // Add a room to the graph
  addRoom(room: Room): void

  // Remove a room from the graph
  removeRoom(roomId: string): void

  // Update a room's properties (name, label, fillColor)
  updateRoom(roomId: string, updates: Partial<Room>): void

  // Get a room by ID
  getRoom(roomId: string): Room | undefined

  // Check if a room exists
  hasRoom(roomId: string): boolean

  // Get rooms that contain a specific wall
  getRoomsContainingWall(wallId: string): Room[]

  // Get all rooms
  getRooms(): Map<string, Room>
}
```

### Graph Operations

```typescript
class FloorplanGraph {
  // Detect all rooms using minimal cycle detection
  // Returns newly created rooms
  detectAllRooms(): Room[]

  // Clear all data
  clear(): void

  // Restore graph from saved state
  restore(points: Map<string, Point>, walls: Map<string, Wall>, rooms: Map<string, Room>): void

  // Create a deep clone of the graph
  clone(): FloorplanGraph

  // Validate graph integrity
  validate(): string[]

  // Get neighbor point IDs for a given point
  getNeighbors(pointId: string): string[]
}
```

## Room Detection Algorithm

### Overview

The FloorplanGraph implements an advanced **minimal cycle detection algorithm** that finds the fundamental cycles (cycle basis) in the planar graph. This ensures accurate room detection without duplicates or overlapping cycles.

### Algorithm: Minimal Cycle Detection

**Strategy:** For each edge (wall), find the shortest cycle containing it using BFS.

**Benefits:**
- ✅ Only detects actual rooms (minimal enclosing cycles)
- ✅ No overlapping or redundant cycles
- ✅ O(E * (V + E)) complexity - efficient for typical floorplans
- ✅ Guaranteed shortest cycles through BFS
- ✅ No exponential behavior

### Implementation Details

#### 1. Find Minimal Cycles
```typescript
private findMinimalCycles(): string[][] {
  const cycles: string[][] = [];
  const processedEdges = new Set<string>();

  // For each wall (edge)
  for (const wall of this.walls.values()) {
    const edgeKey = this.getEdgeKey(wall.startPointId, wall.endPointId);
    if (processedEdges.has(edgeKey)) continue;

    // Find shortest cycle containing this edge
    const cycle = this.findShortestCycleContainingEdge(
      wall.startPointId,
      wall.endPointId
    );
    
    if (cycle && cycle.length >= 3) {
      if (!this.isCycleDuplicate(cycle, cycles)) {
        cycles.push(cycle);
        // Mark all edges in cycle as processed
      }
    }
  }

  return cycles;
}
```

#### 2. Find Shortest Cycle Using BFS
```typescript
private findShortestCycleContainingEdge(startId, endId): string[] | null {
  // Find shortest path from endId back to startId
  // WITHOUT using the direct edge (startId, endId)
  
  const queue = [{ node: endId, path: [endId] }];
  const visited = new Set([endId]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    const neighbors = this.getNeighbors(node);

    for (const neighbor of neighbors) {
      // Skip direct edge back
      if (node === endId && neighbor === startId) continue;

      // Found cycle!
      if (neighbor === startId) {
        return [startId, ...path];
      }

      // Continue BFS
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null;
}
```

#### 3. Create Room from Cycle
```typescript
private createRoomFromCycle(cycle: string[]): Room | null {
  if (cycle.length < 3) return null;

  // Get walls for cycle
  const wallIds: string[] = [];
  for (let i = 0; i < cycle.length; i++) {
    const wall = this.findWallBetweenPoints(
      cycle[i],
      cycle[(i + 1) % cycle.length]
    );
    if (!wall) return null;
    wallIds.push(wall.id);
  }

  // Calculate properties
  const points = cycle.map(id => this.points.get(id)!);
  const centroid = this.calculateCentroid(points);
  const area = this.calculatePolygonArea(points);

  // Filter tiny cycles
  if (area < 100) return null;

  return {
    id: generateId(),
    name: `Room ${this.rooms.size + 1}`,
    wallIds,
    centroid,
    area,
  };
}
```

### Key Insights

**Why this approach works:**

1. **Minimal Cycles** = Fundamental building blocks
   - Every room is a minimal cycle
   - Non-minimal cycles are combinations of minimal ones

2. **BFS guarantees shortest path**
   - For edge (A, B), find shortest path B → ... → A
   - This path + edge (A, B) = minimal cycle

3. **Process each edge once**
   - After finding minimal cycle, mark all edges as processed
   - Prevents duplicate detection

4. **Planar graph property**
   - Floorplans are planar (2D, non-crossing walls)
   - Minimal cycles in planar graphs = faces (rooms)

### Complexity Analysis

**Time Complexity:**
- Per Edge: O(V + E) for BFS
- Total: O(E * (V + E))
- Typical floorplan (100 walls, 50 points): ~15,000 operations

**Space Complexity:**
- O(V) for BFS queue and visited set
- O(E) for processed edges
- O(C) for storing C cycles

**Practical Performance:**
- Extremely fast for typical floorplans
- Scales linearly with complexity
- No exponential blowup
```

## Integration with Command Pattern

### CommandState Interface

```typescript
interface CommandState {
  graph: FloorplanGraph;
  selectedIds: Set<string>;
}
```

Each command works with a cloned graph:

```typescript
class AddWallCommand implements Command {
  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    const affectedRooms = newGraph.addWall(this.wall);
    
    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.removeWall(this.wall.id);
    
    return {
      ...state,
      graph: newGraph,
    };
  }
}
```

## Integration with FloorplanContext

### State Conversion

The context maintains both the graph instance and the React state:

```typescript
// Module-level graph instance
let currentGraph: FloorplanGraph = new FloorplanGraph();

// Convert state to command state
const toCommandState = (state: FloorplanState, graph: FloorplanGraph): CommandState => ({
  graph,
  selectedIds: state.selectedIds,
});

// Apply command state changes to React state
const fromCommandState = (
  state: FloorplanState,
  commandState: CommandState
): FloorplanState => ({
  ...state,
  points: commandState.graph.getPoints(),
  walls: commandState.graph.getWalls(),
  rooms: commandState.graph.getRooms(),
  selectedIds: commandState.selectedIds,
});
```

### Command Execution Flow

1. User action triggers a dispatch (e.g., `ADD_WALL`)
2. Reducer creates a Command instance
3. CommandHistory executes the command with current state and graph
4. Command clones the graph and performs operation
5. New graph state is returned
6. `fromCommandState()` updates React state with new graph data
7. UI re-renders with updated state

```typescript
case 'ADD_WALL': {
  const command = new AddWallCommand(action.wall);
  const newCommandState = commandHistory.execute(
    command,
    toCommandState(state, currentGraph)
  );
  currentGraph = newCommandState.graph;
  return fromCommandState(state, newCommandState);
}
```

## Benefits

### 1. Separation of Concerns

- **Graph Logic**: FloorplanGraph handles all graph operations
- **State Management**: Context handles React state and actions
- **UI Rendering**: PixiCanvas only deals with visualization

### 2. Testability

```typescript
// Easy to test graph operations in isolation
describe('FloorplanGraph', () => {
  it('should detect rooms when walls form a cycle', () => {
    const graph = new FloorplanGraph();
    
    graph.addPoint({ id: 'p1', x: 0, y: 0 });
    graph.addPoint({ id: 'p2', x: 100, y: 0 });
    graph.addPoint({ id: 'p3', x: 100, y: 100 });
    graph.addPoint({ id: 'p4', x: 0, y: 100 });
    
    graph.addWall({ id: 'w1', startPointId: 'p1', endPointId: 'p2' });
    graph.addWall({ id: 'w2', startPointId: 'p2', endPointId: 'p3' });
    graph.addWall({ id: 'w3', startPointId: 'p3', endPointId: 'p4' });
    const rooms = graph.addWall({ id: 'w4', startPointId: 'p4', endPointId: 'p1' });
    
    expect(rooms.size).toBe(1);
  });
});
```

### 3. Type Safety

All operations are fully typed, preventing runtime errors:

```typescript
const point: Point = graph.getPoint('p1'); // Type error if point is undefined
const walls: Wall[] = graph.getConnectedWalls('p1'); // Always returns Wall[]
```

### 4. Performance

- Graph operations are optimized with Map data structures (O(1) lookups)
- Room detection only runs when walls change
- Adjacency list caching for pathfinding algorithms

### 5. Maintainability

- Single source of truth for graph operations
- Easy to add new graph algorithms (pathfinding, area calculation, etc.)
- Commands don't need to know about UI rendering

## Room Detection Integration

One of the most powerful features is automatic room detection:

```typescript
// When adding a wall, rooms are automatically detected
const rooms = graph.addWall(wall);
console.log(`Created/updated ${rooms.size} rooms`);

// When removing a wall, affected rooms are returned
const affectedRooms = graph.removeWall(wallId);
console.log(`Affected ${affectedRooms.size} rooms`);
```

This ensures that:
1. Rooms are always up-to-date with the current wall configuration
2. Commands can store affected rooms for proper undo/redo
3. UI always displays current room boundaries

## Future Extensions

The graph architecture makes it easy to add:

### 1. Graph Algorithms
```typescript
class FloorplanGraph {
  findShortestPath(startId: string, endId: string): string[] {
    // Use adjacency list for pathfinding
  }
  
  calculateRoomArea(roomId: string): number {
    // Calculate area from wall coordinates
  }
  
  findConnectedComponents(): string[][] {
    // Find disconnected graph sections
  }
}
```

### 2. Validation Rules
```typescript
class FloorplanGraph {
  validateWallIntersections(): ValidationResult {
    // Check for invalid wall crossings
  }
  
  validateMinimumWallLength(): ValidationResult {
    // Ensure walls meet minimum length requirements
  }
}
```

### 3. Export/Import
```typescript
class FloorplanGraph {
  toJSON(): string {
    // Serialize graph to JSON
  }
  
  static fromJSON(json: string): FloorplanGraph {
    // Deserialize graph from JSON
  }
  
  toSVG(): string {
    // Export as SVG format
  }
}
```

## Migration Guide

If you're working with older code that directly accesses state maps:

### Before (Direct State Access)
```typescript
// DON'T DO THIS
state.walls.set(wallId, wall);
const rooms = detectRooms(state.points, state.walls);
```

### After (Graph API)
```typescript
// DO THIS
const newGraph = state.graph.clone();
const affectedRooms = newGraph.addWall(wall);
```

### Accessing Data in Components

Components should access graph data through the context state, not directly from the graph:

```typescript
function MyComponent() {
  const { state } = useFloorplan();
  
  // ✓ Correct: Access through state
  const walls = Array.from(state.walls.values());
  
  // ✗ Incorrect: Don't access graph directly
  // const walls = currentGraph.getWalls();
}
```

## Summary

The FloorplanGraph architecture provides:
- ✓ Clean separation between data and UI
- ✓ Type-safe graph operations
- ✓ Automatic room detection
- ✓ Easy testing and validation
- ✓ Foundation for future features
- ✓ Improved maintainability

This design follows SOLID principles and makes the codebase more robust and easier to extend.
