# Room Detection System

## Overview

The room detection system automatically identifies enclosed spaces in the floorplan as walls are drawn. It uses graph theory algorithms to find cycles (closed paths) in the wall network and creates room objects that are displayed with labels at their center points.

## Graph Data Structure

### Core Representation

The floorplan uses a **graph data structure** where:
- **Vertices (Nodes)** = Points (stored in `Map<string, Point>`)
- **Edges** = Walls connecting two points (stored in `Map<string, Wall>`)

Each wall has:
- `startPointId`: ID of the starting vertex
- `endPointId`: ID of the ending vertex

This creates an **undirected graph** where walls represent bidirectional connections between points.

### Adjacency List

For room detection, we build an **adjacency list** representation:
```typescript
Map<string, Set<string>>
// pointId -> Set of connected pointIds
```

Example:
```
Point A connects to: [B, D]
Point B connects to: [A, C]
Point C connects to: [B, D]
Point D connects to: [A, C]
```

This forms a rectangle, which is detected as a room.

## Room Definition

A **room** is defined as:
1. A **simple cycle** in the graph (closed path with no repeated vertices)
2. Minimum **3 vertices** (triangle is the smallest room)
3. Minimum **area** threshold (default: 1000 square pixels) to filter out artifacts

### Room Properties

```typescript
interface Room {
  id: string;
  name: string;           // Auto-generated: "Room 1", "Room 2", etc.
  wallIds: string[];      // IDs of walls forming the room boundary
  centroid: { x, y };     // Center point for label placement
  area: number;           // Area in square pixels
  fill?: string;          // Optional fill color
}
```

## Detection Algorithm

### 1. Build Adjacency List

Convert the point-wall graph into an adjacency list for efficient traversal:

```typescript
function buildAdjacencyList(points, walls): Map<string, Set<string>> {
  // Initialize empty sets for each point
  // For each wall, add bidirectional connections
  adjacency[wall.startPointId].add(wall.endPointId)
  adjacency[wall.endPointId].add(wall.startPointId)
}
```

### 2. Find Cycles (DFS)

Use **Depth-First Search** to find all simple cycles:

```typescript
function findCycles(adjacency): string[][] {
  // For each point as a starting point:
  //   Use DFS to explore paths
  //   When path returns to start point → cycle found
  //   Track visited nodes to avoid duplicates
  //   Limit depth to prevent infinite loops
}
```

**Key considerations:**
- Only paths with ≥3 vertices are valid rooms
- Detect duplicate cycles (same cycle, different rotation/direction)
- Depth limit prevents infinite loops in complex graphs

### 3. Filter Valid Rooms

Not all cycles are valid rooms:

```typescript
function filterValidRooms(cycles, points): string[][] {
  // Calculate area using Shoelace formula
  // Filter out cycles with area < minimum threshold
  // Ensures we ignore tiny artifacts or overlapping walls
}
```

### 4. Calculate Room Properties

For each valid cycle:

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

**Wall IDs:**
- For each consecutive pair of points in the cycle
- Find the wall connecting them
- Store wall IDs for reference

### 5. Create Room Objects

Generate room objects with:
- Unique ID
- Auto-generated name ("Room 1", "Room 2", etc.)
- Wall IDs forming the boundary
- Centroid for label placement
- Calculated area

## Automatic Detection

### When Detection Occurs

Rooms are **automatically detected** when:
1. A new wall is added (via `ADD_WALL` action)
2. The `DETECT_ROOMS` action is manually dispatched

### Integration with State Management

The `ADD_WALL` action in the reducer automatically triggers room detection:

```typescript
case 'ADD_WALL': {
  const newWalls = new Map(state.walls);
  newWalls.set(action.wall.id, action.wall);

  // Automatically detect new rooms
  const newRooms = new Map(state.rooms);
  const detectedRooms = detectRooms(state.points, newWalls, state.rooms);
  
  detectedRooms.forEach(room => {
    newRooms.set(room.id, room);
  });

  return {
    ...state,
    walls: newWalls,
    rooms: newRooms,
    // ... history management
  };
}
```

### Duplicate Prevention

The detection algorithm prevents duplicate rooms by:
1. Checking if a room with the same wall IDs already exists
2. Comparing cycles in all rotations and reverse directions
3. Only adding genuinely new rooms

## Visual Feedback

### Room Labels

When a room is detected, a label appears at its centroid showing:
- Room name (e.g., "Room 1")
- Centered in the enclosed space
- Light blue text (`0x88ccff`)
- Semi-transparent black background for readability

### Rendering Order

Pixi.js layers (bottom to top):
1. Grid
2. Walls
3. Measurement labels (wall lengths)
4. **Room labels** (on top)

## Edge Cases and Limitations

### Handled Cases

✅ **Simple rectangles** - Four walls forming a closed loop
✅ **Complex polygons** - Any shape with 3+ sides
✅ **Multiple rooms** - Detects all separate enclosed spaces
✅ **Nested structures** - Can handle rooms within rooms
✅ **Existing points** - Works with smart vertex reuse

### Known Limitations

⚠️ **Self-intersecting walls** - May create unexpected room boundaries
⚠️ **Overlapping walls** - Multiple walls between same points can cause issues
⚠️ **Very small rooms** - Filtered out below minimum area threshold
⚠️ **Performance** - Complex graphs with many cycles may be slow

### Minimum Area Threshold

Default: **1000 square pixels**

This filters out:
- Tiny accidental enclosures
- Artifacts from overlapping walls
- Invalid cycles from graph anomalies

Adjust in `filterValidRooms()` if needed for your use case.

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
- Label at (50, 50)
- Area: 10,000 px²
```

### Example 2: L-Shaped Space

```
Drawing an L-shape creates two potential rooms:
- The entire L (if you close it)
- Any sub-spaces within the L

The algorithm detects all valid cycles.
```

### Example 3: Multiple Rooms

```
Drawing walls that create separate enclosed spaces:
- Room 1: First enclosed area
- Room 2: Second enclosed area
- Each labeled independently at their centroids
```

## Implementation Files

### Core Files

1. **`src/utils/roomDetection.ts`**
   - `buildAdjacencyList()` - Convert graph to adjacency list
   - `findCycles()` - DFS cycle detection
   - `filterValidRooms()` - Area-based filtering
   - `calculateCentroid()` - Centroid calculation
   - `calculatePolygonArea()` - Shoelace formula
   - `detectRooms()` - Main detection function
   - `checkForNewRoom()` - Single room detection

2. **`src/context/FloorplanContext.tsx`**
   - Room action handlers (`ADD_ROOM`, `UPDATE_ROOM`, `REMOVE_ROOM`, `DETECT_ROOMS`)
   - Automatic detection in `ADD_WALL` action

3. **`src/components/PixiCanvas.tsx`**
   - Room label rendering
   - Visual feedback for detected rooms

4. **`src/types/floorplan.ts`**
   - Room interface definition
   - Action type definitions

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
   - Rooms sharing walls
   - L-shaped and T-shaped spaces

3. **Edge cases**
   - Very small rooms (below threshold)
   - Very large rooms (1000+ pixels)
   - Rooms with many vertices (20+ sides)

4. **Invalid scenarios**
   - Open paths (no closure)
   - Self-intersecting walls
   - Overlapping wall segments

### Manual Testing

1. Draw a simple rectangle → verify room appears
2. Draw multiple separate rectangles → verify all detected
3. Draw complex shape → verify single room detected
4. Delete wall from closed room → verify room removed (future)
5. Undo wall addition → verify room detection reverts

## Mathematical Background

### Graph Theory Concepts

- **Simple Cycle:** A closed path with no repeated vertices (except start/end)
- **DFS (Depth-First Search):** Graph traversal algorithm for finding paths
- **Adjacency List:** Efficient graph representation for sparse graphs

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

The room detection system provides automatic identification of enclosed spaces using graph cycle detection. It integrates seamlessly with the drawing workflow, providing immediate visual feedback when rooms are created. The underlying graph structure (vertices and edges) makes it efficient to detect rooms as simple cycles in the wall network.
