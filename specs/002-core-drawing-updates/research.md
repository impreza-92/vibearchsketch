# Research: Core Drawing Updates

**Feature**: Core Drawing Updates (002)
**Date**: 2025-12-23

## 1. Variable Resolution Snapping

### Decision
Implement a two-stage snapping mechanism:
1.  **Vertex Snapping (Priority)**: If the cursor is within a small threshold (e.g., 10px screen distance) of an existing vertex, snap to that vertex. This ensures connectivity.
2.  **Grid Snapping (Fallback)**: If no vertex is close, snap the cursor coordinates to the nearest multiple of the selected resolution (e.g., 100mm).

### Rationale
- **Connectivity**: Vertex snapping is critical for closing loops (rooms). Without it, users might draw walls that *look* connected but are mathematically disjoint.
- **Precision**: Grid snapping ensures walls are drawn at precise lengths (e.g., exactly 3.5m) without needing manual input.
- **UX**: Implicit snapping removes the need for a visual grid, which the user requested to remove.

### Logic
```typescript
function getSnappedPoint(cursor, resolution, vertices, scale) {
  const SNAP_RADIUS_PX = 10;
  const worldRadius = SNAP_RADIUS_PX / scale;

  // 1. Check for existing vertices
  const closest = findClosestVertex(cursor, vertices);
  if (closest && distance(cursor, closest) < worldRadius) {
    return closest;
  }

  // 2. Fallback to grid
  return {
    x: Math.round(cursor.x / resolution) * resolution,
    y: Math.round(cursor.y / resolution) * resolution
  };
}
```

## 2. Room Splitting & ID Generation

### Decision
Use a "Signature Matching" strategy for room detection and ID assignment.
- **Signature**: A sorted list of Edge IDs that form the room's boundary.
- **Process**:
    1.  Before update, map existing rooms to their signatures.
    2.  After update (wall added/removed), detect all cycles (potential rooms).
    3.  For each detected cycle, generate its signature.
    4.  If signature exists in old map -> Reuse ID.
    5.  If signature is new -> Assign `MaxID + 1`.

### Rationale
- **Robustness**: This handles splitting (1 room -> 2 new rooms), merging (2 rooms -> 1 new room), and modification (1 room -> 1 modified room) consistently.
- **Sequential IDs**: By tracking the global `MaxID`, we ensure new IDs are always unique and sequential, preventing collisions with deleted rooms.
- **Data Integrity**: IDs remain stable for rooms that haven't structurally changed.

## 3. Visual Style

### Decision
- **Background**: Off-white (`#F9F9F9`).
- **Walls**: Dark Grey (`#2C2C2C`).
- **Grid**: Hidden.

### Rationale
- Matches user request for a "modern" look.
- High contrast between walls and background improves readability.
