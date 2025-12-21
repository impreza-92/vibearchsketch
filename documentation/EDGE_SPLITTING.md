# Edge Splitting System

## Overview

The edge splitting system allows users to click on an existing wall (edge) to create a new connection point. This is essential for creating T-junctions and properly connecting perpendicular walls in architectural drawings.

## Problem Statement

In architectural floorplan drawing, it's common to draw walls that meet existing walls at points other than their endpoints. For example:
- Interior walls connecting to exterior walls
- Perpendicular hallways meeting corridors
- Room dividers connecting to main walls

Without edge splitting, these scenarios would require:
1. Manual calculation of the exact point on the wall
2. Creating a temporary point before drawing
3. Breaking the drawing workflow

With edge splitting, users simply click where they want the connection, and the system handles the rest.

## How It Works

### Detection Algorithm

When a user clicks during the drawing process, the system checks in order:

1. **Is there a nearby point?** (within 10px radius)
   - If yes: Use that point (scenarios 1-4)
   - If no: Continue to step 2

2. **Is the click on an existing wall?** (within 8px of wall, but not near endpoints)
   - If yes: Split the wall (scenario 5)
   - If no: Create a new point in empty space

### Mathematical Foundation

**Point-to-Line-Segment Distance:**

To determine if a point is on a line segment, we calculate:

```typescript
// Given: point P, line segment from A to B
const dx = B.x - A.x;
const dy = B.y - A.y;

// Calculate parameter t (0 = at A, 1 = at B, 0.5 = midpoint)
const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy);

// Clamp t to [0, 1] to stay on segment
const tClamped = Math.max(0, Math.min(1, t));

// Calculate closest point on segment
const closest = {
  x: A.x + tClamped * dx,
  y: A.y + tClamped * dy
};

// Calculate distance
const distance = sqrt((P.x - closest.x)² + (P.y - closest.y)²);
```

**Conditions for splitting:**
- Distance to line segment ≤ 8px (click is close enough)
- `t > 0.1` AND `t < 0.9` (not near endpoints - those are handled by point detection)

### Split Operation

When a wall is split:

**1. Create Split Point**
```typescript
const splitPoint: Point = {
  id: generateId(),
  x: clickX,
  y: clickY
};
```

**2. Remove Original Wall**
```typescript
// Original: A ──────────── B
walls.delete(originalWallId);
```

**3. Create Two New Walls**
```typescript
// New: A ───────┬───────── B
//              Split
const wall1 = { startPointId: A.id, endPointId: splitPoint.id };
const wall2 = { startPointId: splitPoint.id, endPointId: B.id };
```

**4. Update Rooms**
```typescript
// Any room that referenced the original wall
// now references both new walls
room.wallIds = room.wallIds.map(id => 
  id === originalWallId ? [wall1.id, wall2.id] : [id]
).flat();
```

**5. Re-detect Rooms**
```typescript
// Room centroids and areas may have changed
// Re-run cycle detection to update room properties
detectRooms(points, walls, rooms);
```

## Implementation Details

### Geometry Utilities

**src/utils/geometry.ts:**

```typescript
export const pointToLineSegmentDistance = (
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { distance: number; closestPoint: Point; t: number } => {
  // Implementation calculates perpendicular distance
  // Returns distance, closest point on segment, and t parameter
};

export const isPointOnLineSegment = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance: number = 5
): boolean => {
  const { distance, t } = pointToLineSegmentDistance(point, lineStart, lineEnd);
  
  // Must be close to line AND not near endpoints
  return distance <= tolerance && t > 0.1 && t < 0.9;
};
```

### State Management

**src/context/FloorplanContext.tsx:**

```typescript
case 'SPLIT_WALL': {
  const wallToSplit = state.walls.get(action.wallId);
  if (!wallToSplit) return state;

  const newPoints = new Map(state.points);
  const newWalls = new Map(state.walls);
  const newRooms = new Map(state.rooms);

  // Add split point
  newPoints.set(action.splitPoint.id, action.splitPoint);

  // Remove original wall
  newWalls.delete(action.wallId);

  // Create two new walls
  const wall1 = { 
    /* start → split */ 
  };
  const wall2 = { 
    /* split → end */ 
  };
  
  newWalls.set(wall1.id, wall1);
  newWalls.set(wall2.id, wall2);

  // Update rooms
  newRooms.forEach((room) => {
    if (room.wallIds.includes(action.wallId)) {
      room.wallIds = room.wallIds.map(id =>
        id === action.wallId ? [wall1.id, wall2.id] : [id]
      ).flat();
    }
  });

  // Re-detect rooms (centroids may change)
  const detectedRooms = detectRooms(newPoints, newWalls, newRooms);
  
  return { ...state, points: newPoints, walls: newWalls, rooms: newRooms };
}
```

### Drawing Logic

**src/components/PixiCanvas.tsx:**

```typescript
const handleClick = () => {
  let point: Point | undefined;

  // 1. Check for nearby existing point (10px radius)
  for (const [, p] of state.points) {
    if (isNearPoint({ x, y }, p, 10)) {
      point = p;
      break;
    }
  }

  // 2. If no nearby point, check for wall split (8px tolerance)
  if (!point) {
    for (const [wallId, wall] of state.walls) {
      const startPoint = state.points.get(wall.startPointId);
      const endPoint = state.points.get(wall.endPointId);
      
      if (startPoint && endPoint) {
        if (isPointOnLineSegment({ x, y }, startPoint, endPoint, 8)) {
          // Split the wall
          const splitPoint = { id: generateId(), x, y };
          dispatch({ type: 'SPLIT_WALL', wallId, splitPoint });
          point = splitPoint;
          break;
        }
      }
    }
  }

  // 3. If still no point, create new one in empty space
  if (!point) {
    point = { id: generateId(), x, y };
    dispatch({ type: 'ADD_POINT', point });
  }

  // Use the point for drawing
  setTempStartPoint(point);
};
```

## Usage Examples

### Example 1: Simple T-Junction

**Scenario:** Draw an interior wall connecting to an exterior wall

```
Initial state:
  A ─────────────────── B
  (exterior wall)

User action:
  1. Click near middle of wall AB
  2. Click below to create perpendicular wall

Result:
  A ──────┬────────── B
         │
         C
  
Walls created:
  - A → Split (replaces A → B)
  - Split → B (replaces A → B)
  - Split → C (new)
```

### Example 2: Room Division

**Scenario:** Add a dividing wall across an existing room

```
Initial state:
  A ─────── B
  │         │
  │  Room   │
  │         │
  D ─────── C

User action:
  1. Click on wall AB (creates split point S1)
  2. Click on wall CD (creates split point S2)

Result:
  A ──S1──── B
  │   │      │
  │ R1│  R2  │
  │   │      │
  D ──S2──── C

Rooms detected:
  - R1: A, S1, S2, D
  - R2: S1, B, C, S2
```

### Example 3: Multiple Connections

**Scenario:** Create a hallway with multiple room entrances

```
Initial state:
  A ─────────────────── B
  (long hallway wall)

User action:
  1. Click on wall to create entrance 1 (split → E1)
  2. Click on wall to create entrance 2 (split → E2)
  3. Click on wall to create entrance 3 (split → E3)

Result:
  A ──E1──E2──E3─── B
     │   │   │
   Room1 Room2 Room3

Walls on top edge:
  - A → E1
  - E1 → E2
  - E2 → E3
  - E3 → B
```

## Edge Cases

### 1. Click Near Endpoint

**Problem:** User clicks very close to an endpoint (within 10% of wall length)

**Solution:** The `t > 0.1 && t < 0.9` check prevents splitting near endpoints. Instead, the point detection (10px radius) catches these clicks and reuses the endpoint.

```typescript
// t = 0.05 (very close to start)
// isPointOnLineSegment returns false
// Point detection picks up the endpoint instead
```

### 2. Multiple Clicks on Same Wall

**Problem:** User clicks same wall multiple times

**Solution:** Each split creates new walls. Subsequent clicks split one of the new walls.

```
First click:  A ───────┬───────── B
                      S1

Second click: A ───┬───┬───────── B
                  S2  S1

Result: 3 segments with proper connectivity
```

### 3. Overlapping Splits

**Problem:** Two splits very close together (< 8px apart)

**Solution:** First split happens, creating two walls. Second click is now within 10px of the split point, so it reuses that point instead of creating another split.

### 4. Room Topology After Split

**Problem:** Splitting a wall that's part of a room boundary

**Solution:** Room's `wallIds` array is updated to replace the old wall ID with both new wall IDs. Room detection re-runs to update centroid and area.

```typescript
Before: room.wallIds = ['wall1', 'wall2', 'wall3', 'wall4']
Split wall2 into wall2a and wall2b
After:  room.wallIds = ['wall1', 'wall2a', 'wall2b', 'wall3', 'wall4']
```

### 5. Undo/Redo with Splits

**Problem:** Undoing a split should restore the original wall

**Solution:** The entire state (points, walls, rooms) is saved in history before the split. Undo restores the complete previous state, removing the split point and new walls, and restoring the original wall.

## Performance Considerations

### Optimization: Early Exit

The wall detection loop exits as soon as a split is detected:

```typescript
for (const [wallId, wall] of state.walls) {
  if (isPointOnLineSegment(...)) {
    // Found it, exit immediately
    break;
  }
}
```

### Optimization: Distance Calculation

The perpendicular distance calculation is optimized:
- Uses dot product instead of trigonometry
- Caches intermediate calculations
- Early clamps `t` to avoid unnecessary calculations

### Scalability

For large floorplans with 100+ walls:
- Wall iteration is O(n) where n = number of walls
- Point-to-segment calculation is O(1)
- Total: O(n) per click, which is acceptable

Future optimization (if needed):
- Spatial indexing (quadtree) for wall lookup
- Only check walls near click point
- Reduces to O(log n) or O(1) with proper data structure

## Visual Feedback

### Hover Effect (Future Enhancement)

When mouse hovers over a wall:
```typescript
// Highlight the wall segment
graphics.lineStyle(4, 0x00ff00, 0.5); // Green highlight
graphics.moveTo(start.x, start.y).lineTo(end.x, end.y);

// Show preview of where split would occur
const closestPoint = calculateClosestPoint(mousePos, wall);
graphics.circle(closestPoint.x, closestPoint.y, 6)
  .fill(0x00ff00, 0.5);
```

### Split Point Indicator

After splitting, the new point is rendered like any other vertex:
```typescript
graphics.circle(splitPoint.x, splitPoint.y, 4).fill(0xffffff);
```

## Testing Recommendations

### Unit Tests

```typescript
describe('Edge Splitting', () => {
  test('splits wall at midpoint', () => {
    const wall = createWall(pointA, pointB);
    const splitPoint = { x: (pointA.x + pointB.x) / 2, y: (pointA.y + pointB.y) / 2 };
    
    dispatch({ type: 'SPLIT_WALL', wallId: wall.id, splitPoint });
    
    expect(state.walls.size).toBe(2); // Original wall replaced by 2
    expect(state.points.size).toBe(3); // A, B, Split
  });

  test('does not split near endpoints', () => {
    const wall = createWall(pointA, pointB);
    const nearStart = { x: pointA.x + 1, y: pointA.y };
    
    const result = isPointOnLineSegment(nearStart, pointA, pointB, 8);
    
    expect(result).toBe(false); // t < 0.1, rejected
  });

  test('updates room after split', () => {
    const room = createRoom([wall1.id, wall2.id]);
    
    dispatch({ type: 'SPLIT_WALL', wallId: wall1.id, splitPoint });
    
    const updatedRoom = state.rooms.get(room.id);
    expect(updatedRoom.wallIds).toHaveLength(3); // wall1 split into 2
  });
});
```

### Integration Tests

```typescript
describe('Drawing with Edge Splitting', () => {
  test('creates T-junction', () => {
    // Draw horizontal wall
    click(100, 100);
    click(300, 100);
    
    // Click on middle of wall
    click(200, 100); // Should split
    
    // Draw perpendicular wall
    click(200, 200);
    
    expect(state.walls.size).toBe(3);
    expect(state.points.size).toBe(4);
  });

  test('multiple splits on same wall', () => {
    // Draw wall
    click(0, 100);
    click(400, 100);
    
    // Split at 100, 200, 300
    click(100, 100);
    click(100, 200);
    
    click(200, 100);
    click(200, 200);
    
    click(300, 100);
    click(300, 200);
    
    // Should have 4 segments on horizontal wall
    // Plus 3 perpendicular walls
    expect(state.walls.size).toBe(7);
  });
});
```

### Manual Testing Checklist

- [ ] Click on horizontal wall middle - creates split
- [ ] Click on vertical wall middle - creates split
- [ ] Click on diagonal wall middle - creates split
- [ ] Click near wall endpoint - uses endpoint, not split
- [ ] Click on wall, then draw perpendicular - creates T-junction
- [ ] Split wall that's part of room - room updates correctly
- [ ] Undo split - original wall restored
- [ ] Multiple splits on same wall - all segments correct
- [ ] Grid snapping with split - split point snaps correctly
- [ ] Room centroid updates after split

## Troubleshooting

### Split Not Detected

**Symptoms:** Clicking on wall creates new point in space instead of splitting

**Possible causes:**
1. Click too far from wall (> 8px tolerance)
2. Click too close to endpoint (t < 0.1 or t > 0.9)
3. Wall endpoints not properly connected (missing points)
4. Z-index issue: Preview layer blocking clicks

**Solutions:**
- Increase tolerance to 10px temporarily for testing
- Check console logs for point detection vs wall detection
- Verify wall endpoints exist in state.points
- Ensure stage.eventMode is 'static' for proper hit detection

### Room Detection After Split

**Symptoms:** Room disappears or shows incorrect boundary after splitting wall

**Possible causes:**
1. Room wallIds not updated correctly
2. Cycle detection not finding the updated cycle
3. New wall IDs not matching room boundary

**Solutions:**
- Add console.log to SPLIT_WALL action to verify wallIds update
- Check that detectRooms is called after split
- Verify room.wallIds contains both new wall IDs

### Performance Degradation

**Symptoms:** Lag when clicking with many walls present

**Possible causes:**
1. Checking every wall on every click
2. Distance calculation too slow
3. Room re-detection too expensive

**Solutions:**
- Profile with React DevTools
- Add early exit after first match
- Consider spatial indexing for 100+ walls
- Cache wall geometries if performance critical

## Future Enhancements

### 1. Smart Snapping During Split

Instead of creating split point at exact click location, snap to common positions:
- Midpoint of wall
- Quarter points (25%, 75%)
- Grid intersections along the wall

### 2. Visual Split Preview

Show where the split would occur before clicking:
- Highlight wall segment on hover
- Show ghost point at split location
- Display distance from endpoints

### 3. Multi-Wall Split

Select multiple walls and split them all at aligned positions:
- Useful for creating aligned doorways
- Maintains architectural alignment
- Batch operation for efficiency

### 4. Smart Room Division

When splitting a wall that forms a room boundary:
- Automatically suggest completing the division
- Preview how room would be split
- One-click to create dividing wall

### 5. Parametric Splits

Allow specifying split position:
- Input field: "Split at 50% of wall length"
- Input field: "Split 2000mm from start"
- Precise architectural measurements

## Conclusion

The edge splitting system is a critical feature for professional floorplan drawing. It enables natural workflows for creating T-junctions and complex architectural layouts without requiring manual calculations or workflow interruptions.

Key benefits:
- **Natural workflow**: Click where you want to connect
- **Data integrity**: Proper graph topology with no duplicates
- **Room awareness**: Automatically updates room boundaries
- **Undo support**: Full history integration
- **Performance**: Efficient O(n) detection

The implementation balances simplicity with power, providing a robust foundation for architectural drawing workflows.
