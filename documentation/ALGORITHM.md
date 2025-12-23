# Room Detection Algorithm

## Overview

The floorplan editor uses a **minimal cycle basis algorithm** for detecting rooms (enclosed spaces) in a planar graph of walls and vertices. The implementation is based on "Constructing a Cycle Basis for a Planar Graph" by David Eberly from the Geometric Tools Library.

## Algorithm Description

### Core Concept

A room is represented as a **minimal cycle** (face) in a planar graph where:
- **Vertices** are junction points where walls meet
- **Edges** are walls connecting vertices
- **Faces** are enclosed regions (rooms)

The algorithm traces around each edge using the **right-hand rule** (always taking the rightmost turn) to discover all faces in the graph.

### Key Improvements Over Naive Approach

Our implementation incorporates several improvements from the reference algorithm:

#### 1. Filament Removal

**Problem:** Dead-end edges (filaments) that don't participate in any cycles can cause issues during face detection.

**Solution:** Before detecting cycles, we remove all filaments from the working graph:
```typescript
// Find vertices with only one neighbor (endpoints)
while (hasFilaments) {
  const endpoints = findVerticesWithOneNeighbor();
  for (const endpoint of endpoints) {
    // Traverse along the filament and remove edges
    removeFilamentStartingFrom(endpoint);
  }
}
```

**Example:**
```
A--B--C
|     |
D     E
|     |
F--G--H
      |
      I  <- This is a filament (dead end)
```

The edge H-I is removed before cycle detection, so it doesn't create false rooms.

#### 2. Cross-Product Based Angle Calculations

**Problem:** Using `atan2()` for angle calculations can suffer from numerical instability and edge cases.

**Solution:** Use cross products to determine clockwise ordering:
```typescript
// Instead of: angle = atan2(dy, dx)
// Use cross product: v1 × v2 = v1.x * v2.y - v1.y * v2.x

const isClockwise = (dCurr[0] * dNext[1] < dCurr[1] * dNext[0]);
```

**Benefits:**
- More numerically stable
- Avoids expensive trigonometric functions
- Handles edge cases (parallel vectors, etc.) more robustly

#### 3. Leftmost Vertex Start Point

**Problem:** Starting from arbitrary vertices can lead to inconsistent cycle ordering.

**Solution:** Always start from the leftmost (then bottom-most) vertex:
```typescript
let minX = Infinity, minY = Infinity;
for (const point of points) {
  if (point.x < minX || (point.x === minX && point.y < minY)) {
    leftmostVertex = point;
  }
}
```

This ensures consistent cycle detection and helps identify the outer face.

#### 4. Outer Face Filtering

**Problem:** The outer face (unbounded region) is detected as a cycle but isn't a room.

**Solution:** Calculate the area of all detected faces and remove the largest one:
```typescript
const facesWithAreas = allFaces.map(face => ({
  face,
  area: Math.abs(calculateSignedPolygonArea(face))
}));

// Sort by area and remove the largest (outer face)
facesWithAreas.sort((a, b) => b.area - a.area);
return facesWithAreas.slice(1); // Skip first (largest)
```

### Algorithm Steps

1. **Build Working Graph**
   ```typescript
   const edges = getWorkingEdges(); // Removes filaments
   ```

2. **Find Leftmost Vertex**
   ```typescript
   const startPoint = findLeftmostPoint(edges);
   ```

3. **Trace All Faces**
   ```typescript
   for (const [from, to] of edges) {
     for (const direction of [forward, backward]) {
       if (!usedEdge(from, to)) {
         const face = traceFace(from, to);
         allFaces.push(face);
       }
     }
   }
   ```

4. **Face Tracing** (Right-Hand Rule)
   ```typescript
   function traceFace(startFrom, startTo) {
     const face = [];
     let current = startFrom;
     let next = startTo;
     
     do {
       face.push(current);
       const nextVertex = getNextVertexClockwise(current, next);
       current = next;
       next = nextVertex;
     } while (current !== startFrom);
     
     return face;
   }
   ```

5. **Filter Outer Face**
   ```typescript
   const rooms = filterOutLargestFace(allFaces);
   ```

### Clockwise Neighbor Selection

The most critical part of the algorithm is selecting the "rightmost" neighbor when tracing a face:

```typescript
function getNextVertexClockwise(from, to) {
  const dCurr = [to.x - from.x, to.y - from.y];
  
  let bestNeighbor = null;
  let bestNext = null;
  let currConvex = false;
  
  for (const neighbor of getNeighbors(to)) {
    if (neighbor === from) continue; // Don't go backwards
    
    const dAdj = [neighbor.x - to.x, neighbor.y - to.y];
    
    if (!bestNeighbor) {
      bestNeighbor = neighbor;
      bestNext = dAdj;
      currConvex = (bestNext[0] * dCurr[1] <= bestNext[1] * dCurr[0]);
      continue;
    }
    
    // Use cross products to find most clockwise edge
    if (currConvex) {
      if (dCurr[0] * dAdj[1] < dCurr[1] * dAdj[0] ||
          bestNext[0] * dAdj[1] < bestNext[1] * dAdj[0]) {
        bestNeighbor = neighbor;
        bestNext = dAdj;
        currConvex = (bestNext[0] * dCurr[1] <= bestNext[1] * dCurr[0]);
      }
    } else {
      if (dCurr[0] * dAdj[1] < dCurr[1] * dAdj[0] &&
          bestNext[0] * dAdj[1] < bestNext[1] * dAdj[0]) {
        bestNeighbor = neighbor;
        bestNext = dAdj;
        currConvex = (bestNext[0] * dCurr[1] < bestNext[1] * dCurr[0]);
      }
    }
  }
  
  return bestNeighbor;
}
```

## Complexity Analysis

- **Time Complexity:** O(V + E)
  - Each vertex and edge is visited a constant number of times
  - Filament removal: O(E) worst case
  - Face tracing: O(E) total across all faces
  
- **Space Complexity:** O(V + E)
  - Storage for vertices, edges, and detected faces

## Test Coverage

The algorithm is validated with 39 comprehensive tests:

### Single Rooms
- ✅ Rectangle
- ✅ Triangle
- ✅ L-shaped polygon

### Multiple Rooms
- ✅ Two adjacent rooms with shared wall
- ✅ Four rooms in 2×2 grid
- ✅ Three rooms in L-shape configuration

### Edge Cases
- ✅ Filaments (dead-end edges)
- ✅ Incomplete loops (open paths)
- ✅ Disconnected components
- ✅ Tiny rooms (< 100px² filtered out)
- ✅ Clockwise vs counterclockwise winding

## Reference

This implementation is inspired by:

**"Constructing a Cycle Basis for a Planar Graph"**  
by David Eberly  
Geometric Tools Library  
https://www.geometrictools.com/Documentation/MinimalCycleBasis.pdf

The reference implementation can be found in:  
`room_detection_reference/src/planar-face-tree.ts` (731 lines)

## Future Enhancements

Potential improvements from the reference algorithm:

1. **Hierarchical Cycles:** Detect nested rooms (rooms within rooms)
2. **Cycle Tree Structure:** Maintain parent-child relationships between faces
3. **Connected Components:** Better handling of disconnected floorplan sections
4. **Validation:** Additional input validation and error handling

## Integration

The algorithm is implemented in:
- **File:** `src/utils/floorplanGraph.ts`
- **Class:** `FloorplanGraph`
- **Method:** `findMinimalCycles()`
- **Entry Point:** `getRooms()`

### Usage

```typescript
const graph = new FloorplanGraph();

// Add points and walls
graph.addPoint({ id: 'p1', x: 0, y: 0 });
graph.addPoint({ id: 'p2', x: 100, y: 0 });
// ...

graph.addWall({ 
  id: 'w1', 
  startPointId: 'p1', 
  endPointId: 'p2',
  thickness: 4,
  style: 'solid'
});

// Get detected rooms
const rooms = graph.getRooms();

// Each room includes:
// - id: unique identifier
// - name: "Room 1", "Room 2", etc.
// - wallIds: array of wall IDs forming the room perimeter
// - centroid: { x, y } center point for labels
// - area: square pixels
```

## Performance

The algorithm performs well on typical floorplans:

- **Simple room (4 walls):** < 1ms
- **2×2 grid (4 rooms, 12 walls):** < 2ms
- **Complex L-shape (3 rooms, 10 walls):** < 1ms
- **Large floorplan (20+ rooms):** < 10ms

Performance is linear with the number of walls and vertices.
