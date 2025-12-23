# Command Pattern Implementation

## Overview

The application implements a robust **Command Pattern** for handling all drawing operations and providing reliable undo/redo functionality. This pattern works in conjunction with the **FloorplanGraph** class to provide clean separation between graph operations and UI state management.

## Architecture

### Core Components

1. **Command Interface** (`src/utils/commands.ts`)
   - Base interface that all commands implement
   - Requires `execute()` and `undo()` methods
   - Includes `getDescription()` for debugging and UI hints
   - Works with `CommandState` containing a `FloorplanGraph` instance

2. **Command Classes**
   - Each drawing operation has its own command class
   - Commands work with cloned `FloorplanGraph` instances for immutability
   - Commands use the graph API (not direct map manipulation)
   - Store all necessary state for both execution and undo

3. **CommandHistory Manager**
   - Manages the undo/redo stack (max 100 commands)
   - Handles command execution with history tracking
   - Provides `canUndo()`, `canRedo()`, and description methods

4. **FloorplanContext Integration**
   - Reducer uses commands for state mutations
   - CommandHistory instance stored in a ref
   - Module-level `currentGraph` tracks the active graph instance
   - Context provides undo/redo status to components

5. **FloorplanGraph Integration**
   - Commands operate on cloned graphs for immutability
   - Graph handles room detection automatically
   - Clean API separation between data and UI

## CommandState Interface

```typescript
interface CommandState {
  graph: FloorplanGraph;  // The graph data structure
  selectedIds: Set<string>;  // Currently selected entities
}
```

Commands receive and return `CommandState`, ensuring immutability through graph cloning.

## Command Classes

The system provides **11 command classes** for all drawing operations:

1. **AddPointCommand** - Add a standalone point
2. **DrawWallCommand** - Draw a wall with its endpoints (atomic operation)
3. **AddWallCommand** - Add a wall between existing points
4. **RemoveWallCommand** - Remove a wall and affected rooms
5. **SplitWallCommand** - Split a wall at a point
6. **AddRoomCommand** - Add a room
7. **UpdateRoomCommand** - Update room properties
8. **RemoveRoomCommand** - Remove a room
9. **DetectRoomsCommand** - Detect all rooms in the graph
10. **SelectCommand** - Select entities
11. **ClearAllCommand** - Clear the entire floorplan

### AddPointCommand
Adds a new point to the floorplan graph.

**Execute:** Calls `graph.addPoint()` on a cloned graph  
**Undo:** Calls `graph.removePoint()` on a cloned graph

```typescript
const command = new AddPointCommand(point);
```

**Note:** This is rarely used directly. For interactive drawing, use `DrawWallCommand` which handles points automatically.

### DrawWallCommand (Primary Drawing Command)
**Atomic command for interactive wall drawing.** This is the main command used when users draw walls through the UI. It handles the entire wall drawing operation atomically, including creating any necessary points.

**Execute:** 
- Clones the graph
- Adds start point if it didn't exist (checks `startPointExists` flag)
- Adds end point if it didn't exist (checks `endPointExists` flag)
- Calls `graph.addWall()` which returns created rooms
- Stores created rooms for undo

**Undo:** 
- Removes the wall
- Removes end point if it was created by this command
- Removes start point if it was created by this command
- Graph automatically removes affected rooms when wall is removed

**Usage:**
```typescript
const command = new DrawWallCommand(
  startPoint,
  endPoint,
  wall,
  startPointExists,  // true if reusing existing point
  endPointExists     // true if reusing existing point
);
```

**Benefits:**
- ✅ Single undo operation for drawing a wall
- ✅ No intermediate "orphan point" state in history
- ✅ Handles all scenarios: new-new, new-existing, existing-existing points
- ✅ Clean undo that removes everything created by the operation

### AddWallCommand (Programmatic Wall Addition)
Adds a wall when both endpoints already exist in the graph. Used for programmatic operations.

**Execute:** 
- Clones the graph
- Calls `graph.addWall()` which returns affected rooms
- Stores affected rooms for undo

**Undo:** 
- Removes the wall
- Graph automatically removes affected rooms

**Usage:**
```typescript
const command = new AddWallCommand(wall);
```

**Note:** For interactive drawing, use `DrawWallCommand` instead.

### RemoveWallCommand
Removes a wall and any rooms that depend on it.

**Execute:** 
- Stores the wall for undo
- Removes the wall from the walls map
- Identifies and removes affected rooms
- Stores affected rooms for undo

**Undo:** 
- Restores the wall
- Restores all affected rooms

```typescript
const command = new RemoveWallCommand(wallId);
```

### SplitWallCommand
Splits a wall at a point, creating two new walls.

**Execute:** 
- Adds the split point
- Removes the original wall
- Creates and adds two new walls
- Updates rooms that reference the split wall
- Re-detects rooms to update centroids and areas

**Undo:** 
- Removes the split point
- Removes the two new walls
- Restores the original wall
- Restores original room references

```typescript
const command = new SplitWallCommand(wallId, splitPoint, wall1, wall2);
```

### AddRoomCommand
Adds a new room to the floorplan.

**Execute:** Adds the room to the rooms map  
**Undo:** Removes the room from the rooms map

```typescript
const command = new AddRoomCommand(room);
```

### UpdateRoomCommand
Updates properties of an existing room.

**Execute:** 
- Stores previous room state
- Updates room with new properties

**Undo:** 
- Restores previous room state

```typescript
const command = new UpdateRoomCommand(roomId, updates);
```

### RemoveRoomCommand
Removes a room from the floorplan.

**Execute:** 
- Stores the room for undo
- Removes the room from the rooms map

**Undo:** 
- Restores the room

```typescript
const command = new RemoveRoomCommand(roomId);
```

### DetectRoomsCommand
Detects all rooms in the current floorplan.

**Execute:** 
- Stores previous rooms for undo
- Detects all rooms based on current walls
- Updates rooms map with detected rooms

**Undo:** 
- Restores previous rooms state

```typescript
const command = new DetectRoomsCommand();
```

### ClearAllCommand
Clears all elements from the floorplan.

**Execute:** 
- Stores entire state for undo
- Clears all points, walls, rooms, and selections

**Undo:** 
- Restores entire previous state

```typescript
const command = new ClearAllCommand();
```

### CompositeCommand
Executes multiple commands as a single undoable action.

**Execute:** Executes all commands in order  
**Undo:** Undoes all commands in reverse order

```typescript
const command = new CompositeCommand([command1, command2], "Description");
```

## CommandHistory Manager

### Properties
- `history: Command[]` - Stack of executed commands
- `currentIndex: number` - Current position in history
- `maxHistorySize: number` - Maximum history size (default: 100)

### Methods

#### execute(command, state)
Executes a command and adds it to history.
- Removes any commands after current index
- Executes the command
- Adds to history stack
- Limits history size
- Logs command description

#### undo(state)
Undoes the last command.
- Checks if undo is possible
- Calls command's `undo()` method
- Decrements current index
- Returns new state or null

#### redo(state)
Redoes the next command.
- Checks if redo is possible
- Increments current index
- Executes the command
- Returns new state or null

#### canUndo()
Returns true if undo is possible.

#### canRedo()
Returns true if redo is possible.

#### getUndoDescription()
Returns description of command that would be undone.

#### getRedoDescription()
Returns description of command that would be redone.

## Integration with Context

### FloorplanContext

The context uses the Command pattern by:

1. **Storing CommandHistory in a ref**
   ```typescript
   const historyRef = useRef<CommandHistory>(new CommandHistory());
   ```

2. **Converting state for commands**
   ```typescript
   const toCommandState = (state: FloorplanState): CommandState => ({
     points: state.points,
     walls: state.walls,
     rooms: state.rooms,
     selectedIds: state.selectedIds,
   });
   ```

3. **Executing commands in reducer**
   ```typescript
   case 'ADD_WALL': {
     const command = new AddWallCommand(action.wall);
     const newCommandState = commandHistory.execute(command, toCommandState(state));
     return fromCommandState(state, newCommandState);
   }
   ```

4. **Providing undo/redo status**
   ```typescript
   const contextValue: FloorplanContextType = {
     state,
     dispatch,
     canUndo,
     canRedo,
     getUndoDescription: () => historyRef.current.getUndoDescription(),
     getRedoDescription: () => historyRef.current.getRedoDescription(),
   };
   ```

## User Interface

### Toolbar Integration

The Toolbar component uses the command history:

```typescript
const { canUndo, canRedo, getUndoDescription, getRedoDescription } = useFloorplan();

<button
  onClick={handleUndo}
  disabled={!canUndo}
  title={canUndo ? `Undo: ${getUndoDescription()}` : 'Nothing to undo'}
>
  ↶ Undo
</button>
```

### Keyboard Shortcuts

- **Undo:** `Ctrl+Z` (Windows/Linux) or `Cmd+Z` (Mac)
- **Redo:** `Ctrl+Y` (Windows/Linux) or `Cmd+Shift+Z` (Mac)

Keyboard shortcuts are handled in `App.tsx`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      dispatch({ type: 'UNDO' });
    }
    else if (
      ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
    ) {
      e.preventDefault();
      dispatch({ type: 'REDO' });
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dispatch]);
```

## Benefits of Command Pattern

### 1. **Robust Undo/Redo**
- Each command knows how to undo itself
- No need for full state snapshots
- Efficient memory usage
- Reliable state restoration

### 2. **Clear Intent**
- Each command has a descriptive name
- Easy to understand what each operation does
- Better debugging with command descriptions

### 3. **Extensibility**
- Easy to add new commands
- Commands can be composed
- Commands can be serialized for save/replay

### 4. **Testability**
- Commands can be tested in isolation
- State transformations are predictable
- No side effects outside command execution

### 5. **Type Safety**
- Full TypeScript type safety
- Compile-time checks for command parameters
- Clear interfaces for all operations

## Best Practices

### Creating New Commands

1. **Extend the Command interface**
   ```typescript
   export class MyCommand implements Command {
     execute(state: CommandState): CommandState { }
     undo(state: CommandState): CommandState { }
     getDescription(): string { }
   }
   ```

2. **Store all data needed for undo**
   ```typescript
   private previousData: SomeType | null = null;
   
   execute(state: CommandState): CommandState {
     this.previousData = state.someData;
     // ... modify state
   }
   ```

3. **Make commands immutable**
   - Don't modify command properties after construction
   - Use `readonly` for constructor parameters when possible

4. **Provide descriptive messages**
   ```typescript
   getDescription(): string {
     return `Add wall from (${this.startX}, ${this.startY}) to (${this.endX}, ${this.endY})`;
   }
   ```

### Using Commands

1. **Always use commands for undoable actions**
   - Don't modify state directly in the reducer
   - Create a command and execute it through CommandHistory

2. **Use actions for non-undoable state changes**
   - UI state (mode, selection)
   - View settings (grid size, snap to grid)
   - These don't need undo functionality

3. **Group related commands with CompositeCommand**
   ```typescript
   const commands = [
     new AddPointCommand(point1),
     new AddPointCommand(point2),
     new AddWallCommand(wall),
   ];
   const composite = new CompositeCommand(commands, "Draw wall");
   commandHistory.execute(composite, state);
   ```

## Performance Considerations

### Memory Usage
- Commands store minimal state
- Old commands are removed when history limit is reached
- Maps and Sets are efficiently copied using constructors

### Execution Speed
- Commands execute synchronously
- State updates are batched by React
- Room detection may be expensive for large floorplans

### History Limit
- Default: 100 commands
- Configurable via `maxHistorySize` property
- Older commands are automatically removed

## Future Enhancements

### Potential Improvements

1. **Command Serialization**
   - Save command history to file
   - Replay actions for debugging
   - Share editing sessions

2. **Command Macros**
   - Record and replay command sequences
   - Create custom tools from command combinations

3. **Command Validation**
   - Validate commands before execution
   - Prevent invalid state transitions
   - Better error messages

4. **Async Commands**
   - Support for async operations
   - Progress tracking for long operations
   - Cancellable commands

5. **Command Analytics**
   - Track which commands are used most
   - Identify common patterns
   - Optimize UI based on usage

## Related Documentation

- [Architecture](ARCHITECTURE.md) - Overall application architecture
- [Design Decisions](DESIGN_DECISIONS.md) - Design choices and rationale
- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Development guidelines
