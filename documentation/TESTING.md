# Testing Strategy

## Test Implementation Status

### ✅ Completed: FloorplanGraph Unit Tests

**Algorithm:** Improved minimal cycle basis detection based on "Constructing a Cycle Basis for a Planar Graph" by David Eberly (Geometric Tools Library)

**Coverage:** 64.95% line coverage, 61.32% branch coverage, 47.82% function coverage

**Test Suite:** 39 tests organized into 4 describe blocks:

1. **Core Operations (12 tests)**
   - Point Operations: add, get, remove, cascade deletion
   - Wall Operations: add, get, remove, find between points (bidirectional)
   - Graph Cloning: deep copy verification, immutability

2. **Room Detection Algorithm (14 tests)**
   - Single shapes: rectangle, triangle
   - Complex layouts: two adjacent rooms, 2x2 grid, L-shaped polygon, three-room L-shape
   - **NEW:** Filament handling (dead-end edges correctly ignored)
   - Edge cases: incomplete loops, tiny rooms (< 100px²), disconnected components
   - Algorithm verification: clockwise/counterclockwise handling, no duplicates, wall removal

3. **Edge Cases (8 tests)**
   - Empty graph, single point, non-existent entities
   - Graceful error handling

4. **Room Property Calculations (5 tests)**
   - Centroid calculation for rectangles and triangles
   - Area calculation using Shoelace formula
   - Complex polygon area calculations
   - Sequential room naming

**Algorithm Improvements:**
- ✅ Filament removal: Dead-end edges are excluded from cycle detection
- ✅ Leftmost vertex start: Consistent cycle orientation
- ✅ Cross-product based angle calculations: More robust than trigonometric methods
- ✅ Better numerical stability: Avoids floating-point edge cases
- ✅ Reference implementation: Based on production-quality Geometric Tools Library

**Key Findings:**
- ✅ Single room detection works correctly after stopping condition fix
- ✅ Two adjacent rooms correctly detected with shared wall in both rooms
- ✅ Room properties (centroid, area) calculated accurately
- ✅ Filaments (dead-end edges) correctly ignored during room detection
- ✅ Three-room L-shape configuration correctly detected
- ✅ All 39 tests passing with improved algorithm

**Test Infrastructure:**
- Framework: Vitest 1.0+ with @vitest/ui
- Environment: jsdom for DOM testing
- Utilities: @testing-library/react, @testing-library/jest-dom
- Mock Data: Comprehensive test data generators in `tests/helpers/mockData.ts`
- Scripts: `npm test`, `npm run test:ui`, `npm run test:coverage`

---

## Overview

This document outlines the testing strategy for the floorplan editor application, including unit tests, integration tests, and performance benchmarks. The testing approach prioritizes critical functionality (room detection, command pattern) while ensuring maintainability and fast feedback loops.

## Test Priorities

### 🔴 Critical (Must Have)
1. **Room Detection Algorithm** - Core functionality that recently had bugs
2. **DrawWallCommand** - Atomic operation for wall drawing
3. **CommandHistory** - Undo/redo must be reliable
4. **Graph Operations** - Foundation of the entire system

### 🟠 High Priority
5. **Individual Commands** - All 11 command classes
6. **State Synchronization** - Graph and React state consistency
7. **Geometry Utilities** - Distance, area, centroid calculations

### 🟡 Medium Priority
8. **Component Rendering** - React component behavior
9. **User Interactions** - Click handling, pointer events
10. **Edge Cases** - Empty states, invalid inputs

### 🟢 Nice to Have
11. **Integration Tests** - End-to-end user workflows
12. **Performance Benchmarks** - Large floorplan handling
13. **Visual Regression** - Screenshot comparison

## 1. FloorplanGraph Unit Tests

### Priority: 🔴 Critical

These tests verify the core graph data structure and room detection algorithm.

#### Core Graph Operations

**Adding Points**
```typescript
describe('FloorplanGraph - Point Operations', () => {
  test('adds point with correct ID and coordinates', () => {
    const graph = new FloorplanGraph();
    const point = { id: 'p1', x: 100, y: 200 };
    graph.addPoint(point);
    expect(graph.getPoint('p1')).toEqual(point);
  });

  test('addPoint returns updated graph', () => {
    const graph = new FloorplanGraph();
    const newGraph = graph.addPoint({ id: 'p1', x: 0, y: 0 });
    expect(newGraph).not.toBe(graph); // Immutability
    expect(newGraph.getPoints()).toHaveLength(1);
  });
});
```

**Adding Walls**
- Verify wall connects correct points
- Verify neighbors are updated for both endpoints
- Verify room detection triggered after adding wall
- Test adding wall between non-existent points (should fail gracefully)

**Removing Walls**
- Verify wall removed from graph
- Verify neighbors updated
- Verify rooms re-detected (room may disappear)
- Test removing non-existent wall (should be no-op)

**Removing Points**
- Verify point removed from graph
- Verify all connected walls removed (cascade)
- Verify rooms re-detected

**Graph Cloning**
- Verify deep copy (no shared references)
- Verify all points, walls, rooms copied
- Verify modifications to clone don't affect original

#### Room Detection Algorithm Tests (CRITICAL!)

**Test Case 1: Single Rectangle**
```typescript
test('detects single rectangle as one room', () => {
  const graph = new FloorplanGraph();
  
  // Create rectangle: A(0,0) -> B(100,0) -> C(100,100) -> D(0,100) -> A
  graph.addPoint({ id: 'A', x: 0, y: 0 });
  graph.addPoint({ id: 'B', x: 100, y: 0 });
  graph.addPoint({ id: 'C', x: 100, y: 100 });
  graph.addPoint({ id: 'D', x: 0, y: 100 });
  
  graph.addWall({ id: 'w1', startPointId: 'A', endPointId: 'B' });
  graph.addWall({ id: 'w2', startPointId: 'B', endPointId: 'C' });
  graph.addWall({ id: 'w3', startPointId: 'C', endPointId: 'D' });
  graph.addWall({ id: 'w4', startPointId: 'D', endPointId: 'A' });
  
  const rooms = graph.getRooms();
  expect(rooms).toHaveLength(1);
  expect(rooms[0].wallIds).toHaveLength(4);
  expect(rooms[0].area).toBe(10000); // 100 * 100
});
```

**Test Case 2: Single Triangle**
```typescript
test('detects triangle as one room', () => {
  // 3 walls forming triangle
  // Expected: 1 room with 3 walls
});
```

**Test Case 3: Two Adjacent Rooms (Interior Edge Test)**
```typescript
test('detects two adjacent rooms with shared wall', () => {
  const graph = new FloorplanGraph();
  
  // Create two rectangles sharing a wall
  // A--B--C
  // |  |  |
  // D--E--F
  
  // Add points...
  // Add walls...
  
  const rooms = graph.getRooms();
  expect(rooms).toHaveLength(2); // Exactly 2 rooms (not 1, not 3)
  
  // Verify each room has 4 walls
  expect(rooms[0].wallIds).toHaveLength(4);
  expect(rooms[1].wallIds).toHaveLength(4);
  
  // Verify shared wall (B-E) is in both rooms
  const sharedWall = graph.findWallBetweenPoints('B', 'E');
  expect(rooms[0].wallIds).toContain(sharedWall.id);
  expect(rooms[1].wallIds).toContain(sharedWall.id);
});
```

**Test Case 4: Four Rooms in Grid**
```typescript
test('detects four rooms in 2x2 grid', () => {
  // A--B--C
  // |  |  |
  // D--E--F
  // |  |  |
  // G--H--I
  
  // Expected: Exactly 4 rooms
  // Top-left: A-B-E-D
  // Top-right: B-C-F-E
  // Bottom-left: D-E-H-G
  // Bottom-right: E-F-I-H
});
```

**Test Case 5: L-Shaped Room**
```typescript
test('detects L-shaped polygon as one room', () => {
  // Create L-shape with 6 vertices
  // Expected: 1 room with 6 walls
});
```

**Test Case 6: Nested Squares**
```typescript
test('detects outer and inner square as separate rooms', () => {
  // Large outer square + smaller inner square (no connection)
  // Expected: 2 separate rooms
});
```

**Test Case 7: Open Path**
```typescript
test('does not detect room from incomplete loop', () => {
  const graph = new FloorplanGraph();
  
  // Create 3 walls but don't close the loop
  // A--B--C
  // |
  // D
  
  graph.addWall({ id: 'w1', startPointId: 'A', endPointId: 'B' });
  graph.addWall({ id: 'w2', startPointId: 'B', endPointId: 'C' });
  graph.addWall({ id: 'w3', startPointId: 'A', endPointId: 'D' });
  
  const rooms = graph.getRooms();
  expect(rooms).toHaveLength(0); // No closed loop = no room
});
```

**Test Case 8: Tiny Room Filtered Out**
```typescript
test('filters out room with area < 100 pixels', () => {
  const graph = new FloorplanGraph();
  
  // Create very small triangle (area < 100)
  graph.addPoint({ id: 'A', x: 0, y: 0 });
  graph.addPoint({ id: 'B', x: 5, y: 0 });
  graph.addPoint({ id: 'C', x: 2.5, y: 3 });
  
  // Area = 0.5 * 5 * 3 = 7.5 (< 100 threshold)
  
  const rooms = graph.getRooms();
  expect(rooms).toHaveLength(0); // Too small, filtered out
});
```

**Test Case 9: Disconnected Components**
```typescript
test('detects rooms in disconnected components', () => {
  // Two separate rectangles with no connection
  // Expected: 2 rooms (one in each component)
});
```

**Test Case 10: Complex Floorplan**
```typescript
test('detects all rooms in complex floorplan with 10+ rooms', () => {
  // Create apartment layout with multiple rooms
  // Living room, kitchen, bedrooms, bathrooms, hallway
  // Expected: Correct number of rooms, no duplicates
});
```

#### Edge Cases

**Empty Graph**
```typescript
test('handles empty graph gracefully', () => {
  const graph = new FloorplanGraph();
  expect(graph.getPoints()).toHaveLength(0);
  expect(graph.getWalls()).toHaveLength(0);
  expect(graph.getRooms()).toHaveLength(0);
});
```

**Single Point, No Walls**
```typescript
test('handles single point with no walls', () => {
  const graph = new FloorplanGraph();
  graph.addPoint({ id: 'p1', x: 0, y: 0 });
  expect(graph.getRooms()).toHaveLength(0);
});
```

**Duplicate Wall Prevention**
```typescript
test('prevents adding duplicate walls between same points', () => {
  // Attempt to add two walls between A and B
  // Expected: Only one wall exists (or error thrown)
});
```

#### Room Property Calculations

**Centroid Calculation**
```typescript
test('calculates centroid correctly for rectangle', () => {
  // Rectangle from (0,0) to (100,100)
  // Expected centroid: (50, 50)
});

test('calculates centroid for triangle', () => {
  // Triangle at (0,0), (100,0), (50,100)
  // Expected centroid: average of vertices
});
```

**Area Calculation (Shoelace Formula)**
```typescript
test('calculates area correctly for rectangle', () => {
  // 100x100 rectangle
  // Expected area: 10000
});

test('calculates area for complex polygon', () => {
  // L-shape or other complex polygon
  // Expected: Known area value
});

test('handles clockwise vs counterclockwise vertices', () => {
  // Same polygon, different vertex order
  // Expected: Same area (absolute value)
});
```

## 2. Command Pattern Tests

### Priority: 🔴 Critical

#### Individual Command Tests

**AddPointCommand**
```typescript
describe('AddPointCommand', () => {
  test('execute adds point to graph', () => {
    const state = initialState;
    const point = { id: 'p1', x: 100, y: 200 };
    const command = new AddPointCommand(point);
    
    const newState = command.execute(state);
    expect(newState.points).toContainEqual(point);
  });

  test('undo removes point from graph', () => {
    const state = initialState;
    const point = { id: 'p1', x: 100, y: 200 };
    const command = new AddPointCommand(point);
    
    const afterExecute = command.execute(state);
    const afterUndo = command.undo(afterExecute);
    
    expect(afterUndo.points).not.toContainEqual(point);
    expect(afterUndo.points).toEqual(state.points); // Back to original
  });
});
```

**DrawWallCommand (Critical - Atomic Operation)**
```typescript
describe('DrawWallCommand', () => {
  test('execute creates two points and one wall atomically', () => {
    const state = initialState;
    const point1 = { id: 'p1', x: 0, y: 0 };
    const point2 = { id: 'p2', x: 100, y: 0 };
    const command = new DrawWallCommand(point1, point2);
    
    const newState = command.execute(state);
    
    // Verify both points added
    expect(newState.points).toContainEqual(point1);
    expect(newState.points).toContainEqual(point2);
    
    // Verify wall added
    expect(newState.walls).toHaveLength(1);
    expect(newState.walls[0].startPointId).toBe('p1');
    expect(newState.walls[0].endPointId).toBe('p2');
  });

  test('undo removes both points and wall atomically', () => {
    const state = initialState;
    const command = new DrawWallCommand(
      { id: 'p1', x: 0, y: 0 },
      { id: 'p2', x: 100, y: 0 }
    );
    
    const afterExecute = command.execute(state);
    const afterUndo = command.undo(afterExecute);
    
    // Verify everything reverted
    expect(afterUndo.points).toEqual(state.points);
    expect(afterUndo.walls).toEqual(state.walls);
  });

  test('completes rectangle and detects room', () => {
    // Draw 4 walls to complete rectangle
    // Expected: Room detected after 4th wall
  });
});
```

**MovePointCommand**
```typescript
describe('MovePointCommand', () => {
  test('execute moves point and updates connected walls', () => {
    // Move point from (0,0) to (50,50)
    // Verify all connected walls update their geometry
    // Verify rooms recalculate area/centroid
  });

  test('undo restores original position', () => {
    // Move point and undo
    // Verify point back at original position
    // Verify rooms restored to original state
  });
});
```

#### CommandHistory Tests

**Basic Operations**
```typescript
describe('CommandHistory', () => {
  test('execute adds command to history and enables undo', () => {
    const history = new CommandHistory();
    expect(history.canUndo()).toBe(false);
    
    history.execute(new AddPointCommand({ id: 'p1', x: 0, y: 0 }), state);
    
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  test('undo reverts command and enables redo', () => {
    const history = new CommandHistory();
    history.execute(command1, state);
    
    const afterUndo = history.undo(currentState);
    
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  test('redo reapplies command', () => {
    const history = new CommandHistory();
    history.execute(command1, state);
    history.undo(state1);
    
    const afterRedo = history.redo(state0);
    
    expect(afterRedo).toEqual(state1); // Back to executed state
    expect(history.canRedo()).toBe(false);
  });

  test('new command after undo clears redo stack', () => {
    const history = new CommandHistory();
    history.execute(command1, state);
    history.undo(state1);
    
    expect(history.canRedo()).toBe(true);
    
    history.execute(command2, state0);
    
    expect(history.canRedo()).toBe(false); // Redo stack cleared
  });
});
```

**Multiple Operations**
```typescript
test('handles chain of undo/redo operations', () => {
  const history = new CommandHistory();
  
  // Execute 5 commands
  history.execute(cmd1, state0);
  history.execute(cmd2, state1);
  history.execute(cmd3, state2);
  history.execute(cmd4, state3);
  history.execute(cmd5, state4);
  
  // Undo 3 times
  history.undo(state5);
  history.undo(state4);
  history.undo(state3);
  
  // Redo 2 times
  history.redo(state2);
  history.redo(state3);
  
  // Verify correct state
  expect(history.canUndo()).toBe(true); // Can undo back to state2
  expect(history.canRedo()).toBe(true); // Can redo to state5
});
```

**Edge Cases**
```typescript
test('undo on empty history does nothing', () => {
  const history = new CommandHistory();
  expect(() => history.undo(state)).not.toThrow();
  expect(history.canUndo()).toBe(false);
});

test('redo on empty redo stack does nothing', () => {
  const history = new CommandHistory();
  expect(() => history.redo(state)).not.toThrow();
  expect(history.canRedo()).toBe(false);
});
```

## 3. Geometry Utility Tests

### Priority: 🟠 High

**Distance Calculations**
```typescript
describe('Geometry Utils', () => {
  test('calculates distance between two points', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(distance(p1, p2)).toBe(5); // 3-4-5 triangle
  });

  test('calculates perpendicular distance to line segment', () => {
    // Point (1,1) to line from (0,0) to (2,0)
    // Expected: 1 (perpendicular distance to x-axis)
  });
});
```

**Snap Detection**
```typescript
test('snaps to point within threshold', () => {
  const point = { x: 100, y: 100 };
  const nearby = { x: 105, y: 103 };
  expect(shouldSnapToPoint(nearby, point, 10)).toBe(true);
});

test('does not snap to point beyond threshold', () => {
  const point = { x: 100, y: 100 };
  const far = { x: 120, y: 120 };
  expect(shouldSnapToPoint(far, point, 10)).toBe(false);
});
```

## 4. React Component Tests

### Priority: 🟡 Medium

**FloorplanContext**
```typescript
describe('FloorplanContext', () => {
  test('provides initial state', () => {
    const { result } = renderHook(() => useFloorplanContext(), {
      wrapper: FloorplanProvider,
    });
    
    expect(result.current.state.points).toEqual([]);
    expect(result.current.state.walls).toEqual([]);
    expect(result.current.state.rooms).toEqual([]);
  });

  test('dispatches ADD_POINT action', () => {
    const { result } = renderHook(() => useFloorplanContext(), {
      wrapper: FloorplanProvider,
    });
    
    act(() => {
      result.current.dispatch({
        type: 'ADD_POINT',
        payload: { point: { id: 'p1', x: 0, y: 0 } },
      });
    });
    
    expect(result.current.state.points).toHaveLength(1);
  });
});
```

**Toolbar**
```typescript
describe('Toolbar', () => {
  test('undo button disabled when canUndo is false', () => {
    render(<Toolbar />);
    const undoButton = screen.getByTitle(/undo/i);
    expect(undoButton).toBeDisabled();
  });

  test('undo button enabled when canUndo is true', () => {
    // Set up state with executed command
    render(<Toolbar />);
    const undoButton = screen.getByTitle(/undo/i);
    expect(undoButton).toBeEnabled();
  });

  test('clicking undo dispatches UNDO action', () => {
    const { dispatch } = renderWithContext(<Toolbar />);
    const undoButton = screen.getByTitle(/undo/i);
    
    fireEvent.click(undoButton);
    
    expect(dispatch).toHaveBeenCalledWith({ type: 'UNDO' });
  });
});
```

## 5. Integration Tests

### Priority: 🟢 Nice to Have

**User Workflow: Draw Simple Room**
```typescript
test('user can draw a rectangle and see room label', async () => {
  // 1. Open application
  await page.goto('http://localhost:5173');
  
  // 2. Click 4 points to create rectangle
  await page.click('#canvas', { position: { x: 100, y: 100 } });
  await page.click('#canvas', { position: { x: 200, y: 100 } });
  await page.click('#canvas', { position: { x: 200, y: 200 } });
  await page.click('#canvas', { position: { x: 100, y: 200 } });
  
  // 3. Verify room label appears
  await expect(page.locator('text=Room 1')).toBeVisible();
});
```

**User Workflow: Undo/Redo**
```typescript
test('user can undo and redo wall drawing', async () => {
  // Draw a wall
  // Press Ctrl+Z (undo)
  // Verify wall disappears
  // Press Ctrl+Y (redo)
  // Verify wall reappears
});
```

**User Workflow: Draw Two Adjacent Rooms**
```typescript
test('user can draw two adjacent rooms', async () => {
  // Draw first rectangle
  // Extend to create second adjacent rectangle
  // Verify exactly 2 room labels appear
  // Verify labels show "Room 1" and "Room 2"
});
```

## 6. Performance Tests

### Priority: 🟢 Nice to Have

**Large Floorplan**
```typescript
test('handles 100 walls efficiently', () => {
  const startTime = performance.now();
  
  const graph = new FloorplanGraph();
  // Add 100 walls forming multiple rooms
  for (let i = 0; i < 100; i++) {
    graph.addWall(/* ... */);
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(100); // Should complete in < 100ms
  expect(graph.getRooms().length).toBeGreaterThan(0);
});
```

**Memory Leaks**
```typescript
test('no memory leaks after 100 undo operations', () => {
  const history = new CommandHistory();
  const initialMemory = performance.memory.usedJSHeapSize;
  
  // Execute and undo 100 commands
  for (let i = 0; i < 100; i++) {
    history.execute(new DrawWallCommand(/* ... */), state);
    history.undo(state);
  }
  
  // Force garbage collection (if available)
  if (global.gc) global.gc();
  
  const finalMemory = performance.memory.usedJSHeapSize;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be minimal (< 1MB)
  expect(memoryIncrease).toBeLessThan(1024 * 1024);
});
```

## Test Framework Setup

### Recommended Stack

**Unit Testing**
- **Vitest** - Fast, Vite-native test runner
- **@testing-library/react** - React component testing
- **@testing-library/user-event** - Simulate user interactions

**Integration Testing**
- **Playwright** - Modern e2e testing (instructions already in repo!)
- Alternative: **Cypress** - Developer-friendly e2e testing

**Coverage**
- **c8** or **istanbul** - Code coverage reporting

### Configuration

**package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/ui": "^1.0.0",
    "playwright": "^1.40.0"
  }
}
```

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

### File Structure

```
tests/
  setup.ts                    # Test setup and global mocks
  unit/
    floorplanGraph.test.ts    # Graph data structure tests
    commands.test.ts          # Command pattern tests
    geometry.test.ts          # Geometry utility tests
    roomDetection.test.ts     # Room detection algorithm tests
  components/
    PixiCanvas.test.tsx       # PixiCanvas component tests
    Toolbar.test.tsx          # Toolbar component tests
    FloorplanContext.test.tsx # Context provider tests
  integration/
    drawing-workflow.spec.ts  # End-to-end drawing tests
    undo-redo.spec.ts        # Undo/redo workflow tests
    room-detection.spec.ts   # Room detection integration tests
  helpers/
    testUtils.tsx            # Test utilities and helpers
    mockData.ts              # Mock data generators
```

## Test Data Helpers

**Mock Data Generator**
```typescript
// tests/helpers/mockData.ts
export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number
): { points: Point[]; walls: Wall[] } {
  const points = [
    { id: 'p1', x, y },
    { id: 'p2', x: x + width, y },
    { id: 'p3', x: x + width, y: y + height },
    { id: 'p4', x, y: y + height },
  ];

  const walls = [
    { id: 'w1', startPointId: 'p1', endPointId: 'p2' },
    { id: 'w2', startPointId: 'p2', endPointId: 'p3' },
    { id: 'w3', startPointId: 'p3', endPointId: 'p4' },
    { id: 'w4', startPointId: 'p4', endPointId: 'p1' },
  ];

  return { points, walls };
}

export function createTwoAdjacentRooms(): FloorplanState {
  // Returns state with two adjacent rooms sharing a wall
}

export function createComplexFloorplan(): FloorplanState {
  // Returns state with 10+ rooms for stress testing
}
```

**Test Utilities**
```typescript
// tests/helpers/testUtils.tsx
export function renderWithContext(
  component: React.ReactElement,
  initialState?: Partial<FloorplanState>
) {
  const wrapper = ({ children }) => (
    <FloorplanProvider initialState={initialState}>
      {children}
    </FloorplanProvider>
  );

  return {
    ...render(component, { wrapper }),
    // Additional utilities
  };
}
```

## Coverage Goals

### Target Metrics

- **Overall Coverage:** > 80%
- **Critical Paths:** > 95%
  - Room detection algorithm
  - Command execute/undo
  - Graph operations
- **Components:** > 70%
- **Utilities:** > 85%

### Coverage Reports

Generate coverage with:
```bash
npm run test:coverage
```

View reports:
- Console: Text summary
- Browser: `coverage/index.html`
- CI/CD: LCOV format for integration

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Testing Best Practices

### 1. Arrange-Act-Assert Pattern
```typescript
test('example test', () => {
  // Arrange: Set up test data
  const graph = new FloorplanGraph();
  const point = { id: 'p1', x: 0, y: 0 };
  
  // Act: Perform action
  graph.addPoint(point);
  
  // Assert: Verify result
  expect(graph.getPoint('p1')).toEqual(point);
});
```

### 2. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 3. Descriptive Test Names
```typescript
// Good
test('detects two adjacent rooms with shared wall', () => {});

// Bad
test('test room detection', () => {});
```

### 4. Test Edge Cases
- Empty inputs
- Null/undefined values
- Boundary conditions
- Invalid data

### 5. Fast Tests
- Unit tests should run in milliseconds
- Mock external dependencies
- Use test doubles (spies, stubs, mocks)

## Next Steps

### Phase 1: Foundation (Week 1)
1. Set up Vitest configuration
2. Write FloorplanGraph unit tests (room detection)
3. Write DrawWallCommand tests
4. Achieve > 80% coverage for core functionality

### Phase 2: Commands (Week 2)
5. Test all 11 command classes
6. Test CommandHistory thoroughly
7. Test command state synchronization

### Phase 3: Components (Week 3)
8. Test React components
9. Test user interactions
10. Test edge cases

### Phase 4: Integration (Week 4)
11. Set up Playwright
12. Write end-to-end tests
13. Add CI/CD integration

## Conclusion

A comprehensive testing strategy ensures:
- **Confidence** in room detection algorithm (recent bug fix verified)
- **Reliability** of undo/redo functionality
- **Maintainability** when adding new features
- **Regression prevention** as codebase evolves

Focus on high-priority tests first (room detection, commands) to get maximum value quickly, then expand coverage over time.
