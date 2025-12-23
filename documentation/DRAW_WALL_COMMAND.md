# DrawWallCommand Implementation - Atomic Wall Drawing

## Overview

Implemented `DrawWallCommand` - an atomic command that handles the complete wall drawing operation, including creating any necessary points. This replaces the previous approach where points were added separately, creating undesirable intermediate states in the undo history.

## Problem Statement

**Previous Behavior:**
```
User draws a wall (2 clicks):
  Click 1 → ADD_POINT command fires → Point added to history
  Click 2 → ADD_POINT command fires (if new) + ADD_WALL command fires
  
Undo history:
  1. ADD_POINT (start)    ← Undo here leaves orphan point
  2. ADD_POINT (end)      ← Undo here leaves wall without endpoint
  3. ADD_WALL             ← Only this should be in history
```

**Issue:** Pressing undo after drawing a wall would first remove the wall, then remove individual points, requiring multiple undo operations. Additionally, intermediate states with orphan points were not meaningful.

**Desired Behavior:**
```
User draws a wall (2 clicks):
  Click 1 → No command (just temporary visual preview)
  Click 2 → DRAW_WALL command fires (atomic)
  
Undo history:
  1. DRAW_WALL (includes both points + wall) ← Single undo removes everything
```

## Solution

### New Command: DrawWallCommand

A single atomic command that encapsulates:
- Creating start point (if new)
- Creating end point (if new)
- Creating the wall
- Automatic room detection

**Key Features:**
- ✅ Single undo operation removes wall and any points created with it
- ✅ No intermediate orphan points in history
- ✅ Handles all scenarios: new-new, new-existing, existing-existing points
- ✅ Preserves existing points when undoing (only removes newly created ones)

### Implementation

**Command Structure:**
```typescript
export class DrawWallCommand implements Command {
  private startPoint: Point;
  private endPoint: Point;
  private wall: Wall;
  private startPointExisted: boolean;  // Was point already in graph?
  private endPointExisted: boolean;    // Was point already in graph?
  private createdRooms: Room[] = [];   // Rooms created by this wall

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Add start point only if it didn't exist
    if (!this.startPointExisted) {
      newGraph.addPoint(this.startPoint);
    }
    
    // Add end point only if it didn't exist
    if (!this.endPointExisted) {
      newGraph.addPoint(this.endPoint);
    }
    
    // Add wall (with automatic room detection)
    this.createdRooms = newGraph.addWall(this.wall);
    
    return { ...state, graph: newGraph };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Remove wall
    newGraph.removeWall(this.wall.id);
    
    // Remove end point only if we created it
    if (!this.endPointExisted) {
      newGraph.removePoint(this.endPoint.id);
    }
    
    // Remove start point only if we created it
    if (!this.startPointExisted) {
      newGraph.removePoint(this.startPoint.id);
    }
    
    return { ...state, graph: newGraph };
  }
}
```

### Usage in PixiCanvas

**Before (Multiple Commands):**
```typescript
// First click
if (!startPoint) {
  startPoint = { id: generateId(), x, y };
  dispatch({ type: 'ADD_POINT', point: startPoint }); // ❌ Creates history entry
}
setTempStartPoint(startPoint);

// Second click
if (!endPoint) {
  endPoint = { id: generateId(), x, y };
  dispatch({ type: 'ADD_POINT', point: endPoint }); // ❌ Creates history entry
}
const wall = { id: generateId(), startPointId, endPointId, ... };
dispatch({ type: 'ADD_WALL', wall }); // ❌ Creates history entry
```

**After (Single Atomic Command):**
```typescript
// First click
if (!startPoint) {
  startPoint = { id: generateId(), x, y };
  // ✓ No dispatch - just store temporarily
}
setTempStartPoint(startPoint);

// Second click
if (!endPoint) {
  endPoint = { id: generateId(), x, y };
  // ✓ No dispatch - just store temporarily
}
const wall = { id: generateId(), startPointId, endPointId, ... };

// ✓ Single atomic command
dispatch({
  type: 'DRAW_WALL',
  startPoint,
  endPoint,
  wall,
  startPointExists: state.points.has(startPoint.id),
  endPointExists: state.points.has(endPoint.id),
});
```

## Files Modified

### 1. `src/utils/commands.ts`
- Added `DrawWallCommand` class (65 lines)
- Added JSDoc documentation
- Handles all point/wall creation scenarios

### 2. `src/types/floorplan.ts`
- Added `DRAW_WALL` action type to `FloorplanAction` union

### 3. `src/context/FloorplanContext.tsx`
- Imported `DrawWallCommand`
- Added `DRAW_WALL` case to reducer
- Creates `DrawWallCommand` with all necessary information

### 4. `src/components/PixiCanvas.tsx`
- Removed `ADD_POINT` dispatches from wall drawing logic
- Changed to dispatch single `DRAW_WALL` action with all data
- Points are created locally but not added to state until wall is complete

### 5. `documentation/COMMAND_PATTERN.md`
- Updated command list (now 11 commands)
- Added `DrawWallCommand` documentation
- Clarified `AddPointCommand` is rarely used directly
- Added notes about atomic operations

## Behavior Matrix

### All Scenarios Handled

| Scenario | Start Point | End Point | Execute | Undo |
|----------|-------------|-----------|---------|------|
| 1. New → New | Creates new | Creates new | Adds 2 points + wall | Removes wall + 2 points |
| 2. New → Existing | Creates new | Reuses existing | Adds 1 point + wall | Removes wall + 1 point |
| 3. Existing → New | Reuses existing | Creates new | Adds 1 point + wall | Removes wall + 1 point |
| 4. Existing → Existing | Reuses existing | Reuses existing | Adds wall only | Removes wall only |

## Benefits

### User Experience
- ✅ **Single Undo:** One press of Ctrl+Z removes the entire wall operation
- ✅ **Intuitive:** Undo removes what the user just drew, not parts of it
- ✅ **Clean History:** No intermediate orphan point states
- ✅ **Consistent:** Same undo behavior regardless of point reuse

### Code Quality
- ✅ **Atomic Operations:** Drawing a wall is truly atomic now
- ✅ **Clear Intent:** Command name matches user action ("draw wall")
- ✅ **Proper Encapsulation:** Command handles all related changes
- ✅ **Type Safety:** TypeScript ensures all required data is provided

### Maintainability
- ✅ **Single Source of Truth:** Wall drawing logic in one command
- ✅ **Easy to Test:** Command can be unit tested independently
- ✅ **Clear Separation:** UI only coordinates, command does the work
- ✅ **Extensible:** Easy to add features (e.g., wall validation)

## Verification

### Build Status
✅ TypeScript compilation: No errors  
✅ Vite build: Successful (3.15s)  
✅ Bundle size: 456.85 kB (142.88 kB gzipped)

### Testing Checklist
- [ ] Draw wall between two new points → Single undo removes everything
- [ ] Draw wall from new to existing point → Undo removes wall and new point only
- [ ] Draw wall from existing to existing → Undo removes wall only
- [ ] Undo after drawing wall → No orphan points remain
- [ ] Redo after undo → Wall and points restored correctly
- [ ] Multiple walls → Each undo removes one complete wall
- [ ] Wall creates room → Undo removes wall, points, and room

### Expected Undo Behavior

**Example Session:**
```
Actions:
1. Draw wall A (new → new)
2. Draw wall B (from wall A end → new)
3. Draw wall C (closes shape)

Undo stack:
- DRAW_WALL (wall C)
- DRAW_WALL (wall B)  
- DRAW_WALL (wall A)

Undo #1 → Removes wall C + its new endpoint
Undo #2 → Removes wall B + its new endpoint  
Undo #3 → Removes wall A + both its endpoints
```

## Backward Compatibility

### Existing Commands Unchanged
- ✅ `AddPointCommand` still works for programmatic point addition
- ✅ `AddWallCommand` still works when points already exist
- ✅ All other commands unaffected
- ✅ No breaking changes to existing code

### When to Use Each

**Use `DrawWallCommand`:**
- ✓ Interactive wall drawing in UI
- ✓ User clicks to place wall endpoints
- ✓ Points may or may not exist

**Use `AddWallCommand`:**
- ✓ Programmatic wall creation
- ✓ Both endpoints already exist in graph
- ✓ Importing saved floorplans
- ✓ Batch operations

**Use `AddPointCommand`:**
- ✓ Adding standalone points
- ✓ Programmatic point creation without walls
- ✓ Rarely needed in practice

## Future Enhancements

### Short Term
- Add validation in `DrawWallCommand` (e.g., minimum length)
- Show preview of what undo will remove
- Add command description to undo button tooltip

### Medium Term
- Batch command for importing entire floorplans
- Macro commands for common operations (draw room, draw corridor)
- Command groups for multi-step operations

### Long Term
- Transaction support for complex operations
- Command serialization for save/load
- Network sync with operational transformation

## Summary

The `DrawWallCommand` provides a clean, atomic approach to wall drawing that matches user expectations:

- **One action** (draw wall) → **One command** → **One undo**
- No intermediate states in history
- Handles all point reuse scenarios correctly
- Clean separation between UI interaction and data operations
- Maintains full undo/redo functionality
- Improves user experience significantly

This implementation follows the Command Pattern correctly by making the operation truly atomic and reversible as a single unit.
