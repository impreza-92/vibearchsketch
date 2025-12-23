# Room Detection System

## Overview

The room detection system automatically identifies enclosed spaces in the floorplan as walls are drawn. It uses a **planar face detection algorithm** based on the right-hand rule to find all faces (rooms) in the planar graph. This ensures accurate detection of all rooms without duplicates or false positives.

## Graph Data Structure

### Core Representation

The floorplan uses a **graph data structure** (managed by `FloorplanGraph` class) where:
- **Vertices (Nodes)** = Points (stored in `Map<string, Point>`)
- **Edges** = Walls connecting two points (stored in `Map<string, Wall>`)

Each wall has:
- `startPointId`: ID of the starting vertex
- `endPointId`: ID of the ending vertex

This creates an **undirected planar graph** where walls represent bidirectional connections between points.

### Planar Graph Property

Floorplans are **planar graphs** (2D, non-crossing edges). In planar graphs:
- Each edge borders at most 2 faces (rooms)
- Faces can be detected by walking around edges
- The number of faces follows Euler's formula: F = E - V + 2 (for connected graphs)

## Room Definition

A **room** is defined as:
1. A **face** in the planar graph (bounded region)
2. Minimum **3 vertices** (triangle is the smallest room)
3. Minimum **area** threshold (100 square pixels) to filter out artifacts
4. **Unique wall set** (no duplicate rooms with same walls)

### Room Properties

```typescript
interface Room {
  id: string;
  name: string;           // Auto-generated: "Room 1", "Room 2", etc.
  wallIds: string[];      // IDs of walls forming the room boundary
  centroid: { x, y };     // Center point for label placement
  area: number;           // Area in square pixels (Shoelace formula)
  fill?: string;          // Optional fill color
}
```

## Detection Algorithm

### Strategy: Planar Face Detection with Right-Hand Rule

The algorithm finds all faces (rooms) by systematically tracing around each directed edge using the **right-hand rule** (always turn right at intersections). This ensures:
- ✅ All faces are found exactly once
- ✅ No duplicate or overlapping cycles
- ✅ Correct handling of complex floorplans
- ✅ Interior edges handled properly (rooms on both sides)
- ✅ Deterministic and predictable results

### Key Insight: Directed Edges

Each wall represents **two directed edges**:
- Forward direction: A → B
- Backward direction: B → A

By treating edges as directed, we ensure each face (room) is traced exactly once.

### Algorithm Steps

#### 1. Process Each Directed Edge

Iterate through all walls in both directions:

```typescript
function findMinimalCycles(): string[][] {
  const processedEdges = new Set<string>(); // Track directed edges
  const cycles: string[][] = [];
  
  for each wall in graph:
    const start = wall.startPointId;
    const end = wall.endPointId;
    
    // Try both directions
    if (!processedEdges.has(getDirectedEdgeKey(start, end))) {
      const face = traceFace(start, end, processedEdges);
      if (face.length >= 3) {
        cycles.push(face);
      }
    }
    
    if (!processedEdges.has(getDirectedEdgeKey(end, start))) {
      const face = traceFace(end, start, processedEdges);
      if (face.length >= 3) {
        cycles.push(face);
      }
    }
  }
  
  return cycles;
}
```

#### 2. Trace Face Using Right-Hand Rule

Follow edges by always taking the "rightmost" turn:

```typescript
function traceFace(startFrom, startTo, processedEdges): string[] {
  const face: string[] = [startFrom];
  let current = startTo;
  let previous = startFrom;
  
  // Mark starting edge as processed
  processedEdges.add(getDirectedEdgeKey(startFrom, startTo));
  
  // Walk around the face until we return to start
  while (current !== startFrom) {
    // Find the next vertex by turning right
    const next = getNextVertexClockwise(previous, current);
    
    if (!next) {
      // Dead end - invalid face
      return [];
    }
    
    // Mark edge as processed
    processedEdges.add(getDirectedEdgeKey(current, next));
    
    // Move to next edge
    face.push(current);
    previous = current;
    current = next;
  }
  
  return face;
}
```

**How it works:**
1. Start from a directed edge (A → B)
2. At each vertex, select the neighbor that makes the smallest clockwise angle
3. Continue until we return to the starting vertex
4. Mark all directed edges in the face as processed
5. Result: One complete face boundary

#### 3. Select Rightmost Neighbor

At each vertex, select the neighbor that makes the smallest clockwise angle from the incoming direction:

```typescript
function getNextVertexClockwise(from: string, to: string): string | null {
  const fromPoint = points.get(from)!;
  const toPoint = points.get(to)!;
  
  // Calculate incoming angle
  const incomingAngle = Math.atan2(
    toPoint.y - fromPoint.y,
    toPoint.x - fromPoint.x
  );
  
  const neighbors = getNeighbors(to);
  let bestNeighbor: string | null = null;
  let smallestClockwiseAngle = Infinity;
  
  for (const neighborId of neighbors) {
    if (neighborId === from) continue; // Don't go back
    
    const neighborPoint = points.get(neighborId)!;
    
    // Calculate outgoing angle
    const outgoingAngle = Math.atan2(
      neighborPoint.y - toPoint.y,
      neighborPoint.x - toPoint.x
    );
    
    // Calculate clockwise angle from incoming direction
    // Subtract PI to measure from opposite direction
    let clockwiseAngle = outgoingAngle - incomingAngle - Math.PI;
    
    // Normalize to [0, 2π)
    if (clockwiseAngle < 0) clockwiseAngle += 2 * Math.PI;
    if (clockwiseAngle >= 2 * Math.PI) clockwiseAngle -= 2 * Math.PI;
    
    // Select neighbor with smallest clockwise angle (rightmost turn)
    if (clockwiseAngle < smallestClockwiseAngle) {
      smallestClockwiseAngle = clockwiseAngle;
      bestNeighbor = neighborId;
    }
  }
  
  return bestNeighbor;
}
```

**Why this works:**
- At each vertex, we measure the angle to each neighbor
- The angle is measured **clockwise** from the incoming direction
- The neighbor with the **smallest** clockwise angle is the "rightmost" choice
- This implements the classic right-hand rule for maze traversal

#### 4. Directed Edge Tracking

Directed edges are tracked using ordered pairs:

```typescript
function getDirectedEdgeKey(from: string, to: string): string {
  return `${from}->${to}`; // Order matters!
}
```

**Important:** 
- `A->B` is different from `B->A`
- Each represents one side of the wall
- Processing both directions ensures all faces are found

#### 5. Duplicate Detection

Cycles are checked for duplicates considering:
- **Rotations**: [A, B, C, D] same as [B, C, D, A]
- **Reflections**: [A, B, C, D] same as [D, C, B, A] (reverse direction)

```typescript
function isCycleDuplicate(cycle: string[], existingCycles: string[][]): boolean {
  for (const existing of existingCycles) {
    if (existing.length !== cycle.length) continue;
    
    // Check all rotations in both directions
    for (let offset = 0; offset < cycle.length; offset++) {
      // Forward rotation
      let isMatch = true;
      for (let i = 0; i < cycle.length; i++) {
        if (cycle[i] !== existing[(i + offset) % existing.length]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) return true;
      
      // Reverse rotation
      isMatch = true;
      for (let i = 0; i < cycle.length; i++) {
        if (cycle[i] !== existing[(existing.length - i + offset) % existing.length]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) return true;
    }
  }
  
  return false;
}
```

#### 6. Create Room from Cycle

For each valid cycle, create a room object:

```typescript
function createRoomFromCycle(cycle): Room | null {
  // Validate: must have at least 3 points
  if (cycle.length < 3) return null
  
  // Find walls for each edge in the cycle
  wallIds = []
  for i in 0..cycle.length-1:
    wall = findWallBetween(cycle[i], cycle[(i+1) % cycle.length])
    if (!wall) return null  // Invalid if any edge doesn't exist
    wallIds.push(wall.id)
  
  // Calculate properties
  centroid = calculateCentroid(cycle points)
  area = calculatePolygonArea(cycle points)
  
  // Filter tiny artifacts
  if (area < 100) return null
  
  return new Room(wallIds, centroid, area)
}
```

#### 7. Room Property Calculations

**Centroid (Center Point):**
```typescript
centroid.x = sum(all point x coordinates) / point count
centroid.y = sum(all point y coordinates) / point count
```

**Area (Shoelace Formula):**
```typescript
area = 0
for i in 0..n-1:
  area += (x[i] * y[i+1]) - (x[i+1] * y[i])
area = abs(area) / 2
```

**Minimum Area Threshold:** 100 square pixels
- Filters out numerical artifacts
- Prevents detection of tiny overlapping wall segments
- Can be adjusted based on zoom level or requirements

## Visual Examples

### Simple Rectangle

```
    A -------- B
    |          |
    |          |
    |          |
    D -------- C
```

**Directed edges:**
- A→B, B→A
- B→C, C→B
- C→D, D→C
- D→A, A→D

**Face tracing (starting from A→B):**
1. Start: A→B
2. At B, turn right: B→C (outgoing angle from A→B→C is smallest)
3. At C, turn right: C→D
4. At D, turn right: D→A
5. Back at A: Face complete

**Result:** One room with points [A, B, C, D]

### Two Adjacent Rooms

```
    A -------- B -------- C
    |          |          |
    |  Room 1  |  Room 2  |
    |          |          |
    D -------- E -------- F
```

**Two faces will be traced:**

**Face 1 (starting from A→B):**
- A→B→E→D→A
- Forms Room 1

**Face 2 (starting from B→C):**
- B→C→F→E→B
- Forms Room 2

**Note:** Edge B-E is processed in both directions:
- B→E is part of Face 2
- E→B is part of Face 1

This is why treating edges as **directed** is critical!

### Interior Edge Example

```
        A
       / \
      /   \
     B --- C
      \   /
       \ /
        D
```

**Multiple faces:**
- Face 1: A→B→C→A (top triangle)
- Face 2: B→D→C→B (bottom triangle)

Each edge is processed in both directions, ensuring all faces are found.

## Algorithm Complexity

### Time Complexity
- **Per face:** O(F) where F is the number of vertices in the face
- **Total faces:** At most O(E) faces in a planar graph
- **Neighbor lookup:** O(degree) per vertex (typically 2-4 in floorplans)
- **Overall:** O(E × D) where:
  - E = number of edges (walls)
  - D = average vertex degree (typically 3-4)
  - In practice: **O(E)** for typical floorplans

### Space Complexity
- **Processed edges set:** O(E) directed edges
- **Cycle storage:** O(F × V) where F = faces, V = vertices per face
- **Neighbor maps:** O(E) edges stored in adjacency structure
- **Overall:** O(E + F × V)

### Comparison with BFS Approach

| Aspect | BFS Shortest Cycle | Planar Face Detection |
|--------|-------------------|----------------------|
| **Correctness** | ❌ Only finds one cycle per edge | ✅ Finds all faces exactly once |
| **Duplicates** | ⚠️ Can miss or duplicate cycles | ✅ No duplicates by design |
| **Interior Edges** | ❌ May not detect both sides | ✅ Handles both sides correctly |
| **Complexity** | O(E × (V + E)) per edge | O(E × D) overall |
| **Performance** | Slower (many BFS calls) | Faster (direct traversal) |

### Performance Characteristics
- ✅ Scales well with complex floorplans
- ✅ Minimal memory footprint
- ✅ Linear performance for typical floorplans
- ✅ No exponential behavior (unlike naive cycle enumeration)
- ✅ Efficient face tracing with angular calculations

## Automatic Detection

### When Detection Occurs

Rooms are **automatically detected** when:
1. A new wall is added (via `addWall()` method)
2. The `detectAllRooms()` method is called explicitly

### Integration with FloorplanGraph

The detection occurs automatically within the `FloorplanGraph` class:

```typescript
addWall(wall: Wall): void {
  // 1. Add wall to graph
  this.walls.set(wall.id, wall);
  
  // 2. Automatically detect rooms
  this.detectRooms();
}

detectRooms(): void {
  // 1. Find all faces using planar face detection
  const cycles = this.findMinimalCycles();
  
  // 2. Convert faces to rooms
  this.rooms = new Map();
  let roomNumber = 1;
  
  for (const cycle of cycles) {
    const room = this.createRoomFromCycle(cycle);
    if (room) {
      room.name = `Room ${roomNumber++}`;
      this.rooms.set(room.id, room);
    }
  }
}
```

### State Updates

When rooms change:
1. `FloorplanGraph` updates internal `rooms` Map
2. Context state is updated with new rooms array
3. React re-renders affected components
4. Pixi.js canvas redraws room fills and labels

## Visual Feedback

### Room Labels

When a room is detected, a label appears at its centroid showing:
## Edge Cases and Handling

### Successfully Handled Cases

✅ **Simple rectangles** - Four walls forming a closed loop
✅ **Complex polygons** - Any shape with 3+ sides  
✅ **Multiple rooms** - Detects all separate enclosed spaces
✅ **Adjacent rooms** - Correctly identifies rooms sharing walls (both sides of interior walls)
✅ **Interior edges** - Handles edges with rooms on both sides
✅ **L-shapes and complex geometries** - Right-hand rule handles any planar shape
✅ **Duplicate prevention** - Directed edge tracking prevents duplicate faces

### Known Limitations

⚠️ **Self-intersecting walls** - May create unexpected room boundaries (planar graph assumption)
⚠️ **Overlapping walls** - Multiple walls between same points can cause issues
⚠️ **Very small rooms** - Filtered out below 100 square pixels
⚠️ **Non-planar graphs** - Algorithm assumes 2D planar graph

### Minimum Area Threshold

**Default: 100 square pixels**

This filters out:
- Tiny accidental enclosures
- Numerical artifacts from floating-point calculations
- Invalid micro-cycles from overlapping wall segments

Can be adjusted in `createRoomFromCycle()` method if needed.

## Algorithm Advantages

### Why Planar Face Detection?

**Previous BFS Shortest-Cycle Approach Issues:**
- ❌ Only found ONE cycle per edge
- ❌ Interior edges belong to TWO faces (one on each side)
- ❌ Could miss rooms or detect overlapping cycles
- ❌ Complex floorplans had incorrect results

**Current Planar Face Detection Approach:**
- ✅ Treats each edge as TWO directed edges
- ✅ Finds all faces (rooms) exactly once
- ✅ Right-hand rule ensures complete face traversal
- ✅ No duplicates by design (directed edge tracking)
- ✅ Handles interior edges correctly (both sides)
- ✅ Linear complexity: O(E × D) for typical floorplans
- ✅ Based on proven planar graph theory

### Real-World Benefits

1. **Correctness:** All actual rooms detected, no false positives or duplicates
2. **Interior Walls:** Properly handles walls with rooms on both sides
3. **Performance:** Scales to complex floorplans with many rooms
4. **Predictability:** Consistent results regardless of drawing order
5. **Maintainability:** Clear algorithm with well-defined behavior
6. **Robustness:** Based on classical planar graph face detection

## Usage Examples

### Example 1: Simple Rectangle

```
Drawing sequence:
1. Point A (0, 0) → Point B (100, 0)
2. Point B (100, 0) → Point C (100, 100)
3. Point C (100, 100) → Point D (0, 100)
4. Point D (0, 100) → Point A (0, 0) ← Room detected!

Result:
- Room 1 created
- Centroid at (50, 50)
- Area: 10,000 px²
- WallIds: [w1, w2, w3, w4]
```

### Example 2: Two Adjacent Rooms

```
  A ----w1---- B ----w2---- C
  |            |            |
 w6    Room 1 w5   Room 2  w3
  |            |            |
  F ----w7---- E ----w4---- D

Detection:
- Room 1: walls [w1, w5, w7, w6]
- Room 2: walls [w2, w3, w4, w5]
- w5 is shared between both rooms
```

### Example 3: Complex Floorplan

```
Multi-room apartment:
- Algorithm processes each wall once
- Finds minimal cycle for each
- Avoids detecting "whole apartment" as one giant room
- Correctly identifies each individual room
```

## Implementation Files

### Core Implementation

**`src/utils/floorplanGraph.ts`** - FloorplanGraph class
- `findMinimalCycles()` - Main minimal cycle detection algorithm
- `findShortestCycleContainingEdge()` - BFS shortest path finder
- `createRoomFromCycle()` - Convert cycle to room object
- `detectAllRooms()` - Public API for room detection
- `roomExists()` - Duplicate checking
- `isCycleDuplicate()` - Rotation/reflection comparison

**`src/utils/commands.ts`** - Command Pattern integration
- Commands use `graph.addWall()` which auto-detects rooms
- `DetectRoomsCommand` calls `graph.detectAllRooms()`

**`src/context/FloorplanContext.tsx`** - State management
- Room action handlers (`ADD_ROOM`, `UPDATE_ROOM`, `REMOVE_ROOM`)
- Automatic detection through `addWall()` graph method

**`src/components/PixiCanvas.tsx`** - Rendering
- Room label rendering at centroids
- Visual feedback for detected rooms

## Future Enhancements

### Potential Improvements

1. **Manual room editing**
   - Click to rename rooms
   - Drag labels to reposition
   - Edit room properties (fill color, etc.)

2. **Room properties panel**
   - Display area in real measurements (m², ft²)
   - Calculate perimeter
   - List all walls forming the room

3. **Advanced detection**
   - Detect interior vs. exterior rooms
   - Handle complex nested room structures
   - Identify room connectivity (doors/openings)

4. **Performance optimization**
   - Cache cycle detection results
   - Incremental updates instead of full re-detection
   - Optimize for large floorplans (100+ rooms)

5. **Visual enhancements**
   - Fill rooms with semi-transparent colors
   - Highlight room on hover
   - Show room boundaries when selected

## Troubleshooting

### Room Not Detected

**Problem:** Drew walls but no room label appears

**Possible causes:**
1. Room not fully enclosed (missing wall)
2. Area below minimum threshold (too small)
3. Self-intersecting walls creating invalid geometry

**Solutions:**
- Verify all walls are connected
- Check for gaps in the wall network
- Ensure room area > 1000 px²
- Use `DETECT_ROOMS` action to force re-detection

### Duplicate Rooms

**Problem:** Same room detected multiple times

**Possible causes:**
1. Cycle comparison logic failing
2. Wall IDs not matching correctly
3. Overlapping wall geometries

**Solutions:**
- Check cycle deduplication in `isCycleDuplicate()`
- Verify wall ID consistency
- Remove overlapping or duplicate walls

### Wrong Label Position

**Problem:** Room label appears outside the room

**Possible causes:**
1. Complex concave polygon
2. Centroid calculation for non-convex shapes

**Solutions:**
- Centroid of concave polygons may fall outside
- Future: Use visual center or largest inscribed circle
- Manual label repositioning (future feature)

## Testing Recommendations

### Test Cases

1. **Simple shapes**
   - Triangle (3 walls)
   - Rectangle (4 walls)
   - Pentagon, hexagon (5, 6 walls)

2. **Complex layouts**
   - Multiple separate rooms
   - Rooms sharing walls (interior edges)
   - L-shaped and T-shaped spaces
   - Nested rooms

3. **Edge cases**
   - Very small rooms (below threshold)
   - Very large rooms (1000+ pixels)
   - Rooms with many vertices (20+ sides)

4. **Invalid scenarios**
   - Open paths (no closure)
   - Self-intersecting walls (non-planar)
   - Overlapping wall segments

5. **Interior Edge Tests**
   - Two adjacent rooms with shared wall
   - Multiple rooms sharing multiple walls
   - Verify each room detected exactly once

### Manual Testing

1. Draw a simple rectangle → verify one room appears
2. Draw two adjacent rectangles → verify two rooms (not one, not three)
3. Draw complex shape → verify single room detected
4. Draw L-shape → verify correct room count
5. Undo wall addition → verify room detection reverts

## Mathematical Background

### Planar Graph Theory

- **Planar Graph:** A graph that can be drawn in 2D without edge crossings
- **Face:** A bounded region in a planar graph
- **Euler's Formula:** For connected planar graphs: V - E + F = 2 (where V=vertices, E=edges, F=faces)
- **Right-Hand Rule:** Navigation strategy that always turns right (clockwise) at intersections
- **Directed Edge:** An edge with a specified direction (A→B different from B→A)
- **Adjacency List:** Efficient graph representation for sparse graphs

### Angular Calculations

**Angle from Incoming to Outgoing Edge:**
```
incomingAngle = atan2(to.y - from.y, to.x - from.x)
outgoingAngle = atan2(next.y - to.y, next.x - to.x)
clockwiseAngle = outgoingAngle - incomingAngle - π
```

The angle is normalized to [0, 2π) to determine the "rightmost" (smallest clockwise) turn.

### Geometric Calculations

**Shoelace Formula (Gauss's Area Formula):**
```
Area = ½ |Σ(x[i] * y[i+1] - x[i+1] * y[i])|
```

**Centroid of Polygon:**
```
Cx = (Σx[i]) / n
Cy = (Σy[i]) / n
```

Where n = number of vertices

## Conclusion

The room detection system provides automatic identification of enclosed spaces using **planar face detection with the right-hand rule**. This approach ensures all rooms are found exactly once, correctly handles interior edges with rooms on both sides, and avoids duplicates through directed edge tracking.

Key improvements over the previous BFS shortest-cycle approach:
- ✅ Finds all faces in a planar graph exactly once
- ✅ Handles interior walls correctly (rooms on both sides)
- ✅ No duplicate detection or overlapping cycles
- ✅ More efficient for typical floorplans (O(E) vs O(E × (V + E)))
- ✅ Based on classical planar graph theory

The system integrates seamlessly with the Command Pattern, maintaining undo/redo capability while providing immediate visual feedback as users draw walls.
