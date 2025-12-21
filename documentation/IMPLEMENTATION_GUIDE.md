# Implementation Guide

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- VS Code (recommended)
- Git

### Getting Started

```bash
# Already initialized! Project structure:
cd vibearchsketch

# Install dependencies (already done)
npm install

# Install Pixi.js (next step)
npm install pixi.js

# Start development server
npm run dev

# Build for production
npm run build
```

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Error Lens

## Implementation Phases

### Phase 1: Foundation (Current)

**Goal**: Basic Pixi.js canvas with wall drawing capability

**Tasks:**
1. ✅ Initialize Vite + React + TypeScript project
2. ✅ Create documentation structure
3. ⏳ Install Pixi.js and set up dependencies
4. ⏳ Define core TypeScript types
5. ⏳ Create PixiCanvas component
6. ⏳ Implement basic wall drawing
7. ⏳ Add toolbar for mode switching
8. ⏳ Implement pan and zoom

**Completion Criteria:**
- User can draw walls by clicking points
- User can pan and zoom the canvas
- Walls are saved in state
- Basic toolbar for switching modes

### Phase 2: Selection and Editing

**Goal**: Select and modify drawn elements

**Tasks:**
1. Implement selection mode with hit detection
2. Add selection highlights and handles
3. Implement drag to move walls
4. Add properties panel for editing
5. Implement undo/redo functionality
6. Add delete functionality

**Completion Criteria:**
- User can select walls by clicking
- User can modify wall properties
- User can undo/redo actions
- User can delete selected elements

### Phase 3: Advanced Features

**Goal**: Room detection and measurements

**Tasks:**
1. Implement room detection from connected walls
2. Add room fill colors and labels
3. Implement measurement tools
4. Add grid snapping controls
5. Add save/load JSON functionality

**Completion Criteria:**
- Rooms are automatically detected
- User can measure distances
- User can save and load floorplans

### Phase 4: Polish and Export

**Goal**: Production-ready features

**Tasks:**
1. Add keyboard shortcuts
2. Implement export to SVG/PNG
3. Add touch support for mobile
4. Optimize performance for large floorplans
5. Add onboarding tutorial

## Code Organization

### Component Structure

```typescript
// Example component pattern

import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

### Hook Pattern

```typescript
// Example custom hook

import { useState, useCallback } from 'react';

export const useMyHook = () => {
  const [state, setState] = useState<string>('');
  
  const doSomething = useCallback(() => {
    setState('new value');
  }, []);
  
  return { state, doSomething };
};
```

### Context Pattern

```typescript
// Example context setup

import { createContext, useContext, useReducer, FC, ReactNode } from 'react';

interface State {
  value: string;
}

type Action = 
  | { type: 'SET_VALUE'; payload: string }
  | { type: 'RESET' };

const initialState: State = { value: '' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_VALUE':
      return { ...state, value: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const MyContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const MyProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <MyContext value={{ state, dispatch }}>
      {children}
    </MyContext>
  );
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
};
```

## TypeScript Guidelines

### Type Definitions

```typescript
// types/floorplan.ts - Core types

export interface Point {
  id: string;
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  startPointId: string;
  endPointId: string;
  thickness: number;
  style: 'solid' | 'dashed';
}

export interface Room {
  id: string;
  name: string;
  wallIds: string[];
  fill?: string;
}

export type DrawingMode = 'draw' | 'select' | 'pan' | 'erase';

export interface FloorplanState {
  points: Map<string, Point>;
  walls: Map<string, Wall>;
  rooms: Map<string, Room>;
  selectedIds: Set<string>;
  mode: DrawingMode;
  gridSize: number;
  snapToGrid: boolean;
}
```

### Type Safety Best Practices

1. **Avoid `any`** - Use `unknown` if type is truly unknown
2. **Use discriminated unions** for state machines
3. **Prefer interfaces over types** for objects
4. **Use `readonly`** for immutable data
5. **Leverage type inference** - don't over-annotate

```typescript
// Good: Discriminated union
type DrawAction =
  | { type: 'START_DRAWING'; point: Point }
  | { type: 'CONTINUE_DRAWING'; point: Point }
  | { type: 'FINISH_DRAWING' }
  | { type: 'CANCEL_DRAWING' };

// Good: Readonly for immutable config
interface Config {
  readonly gridSize: number;
  readonly snapTolerance: number;
}

// Good: Generic constraints
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}
```

## Pixi.js Integration

### Canvas Setup Pattern (Pixi.js v8)

```typescript
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export const PixiCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    let mounted = true;
    const app = new PIXI.Application();
    
    // Async initialization (Pixi.js v8 pattern)
    (async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: 0x1e1e1e, // v8: 'background' not 'backgroundColor'
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      
      if (!mounted || !canvasRef.current) return;
      
      appRef.current = app;
      canvasRef.current.appendChild(app.canvas);
      
      // Enable interaction
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      
      // Signal that initialization is complete
      // This allows event handlers to attach
      setIsInitialized(true);
    })();
    
    // Cleanup
    return () => {
      mounted = false;
      setIsInitialized(false);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);
  
  // Event handlers wait for initialization
  useEffect(() => {
    if (!isInitialized || !appRef.current) return;
    
    const app = appRef.current;
    
    const handlePointerMove = (event: PIXI.FederatedPointerEvent) => {
      console.log('Pointer move:', event.global);
    };
    
    const handlePointerDown = (event: PIXI.FederatedPointerEvent) => {
      console.log('Pointer down:', event.global);
    };
    
    // Use pointer events (v8 recommendation)
    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerdown', handlePointerDown);
    
    return () => {
      app.stage.off('pointermove', handlePointerMove);
      app.stage.off('pointerdown', handlePointerDown);
    };
  }, [isInitialized]); // Runs when initialization completes
  
  return <div ref={canvasRef} />;
};
```

### Drawing Pattern (Pixi.js v8)

```typescript
// Drawing a wall in Pixi.js v8 with new Graphics API
const drawWall = (
  graphics: PIXI.Graphics,
  start: Point,
  end: Point,
  thickness: number
) => {
  graphics.clear();
  
  // v8: Use chained methods with .stroke()
  graphics
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke({ width: thickness, color: 0xffffff, alpha: 1 });
  
  // Draw endpoint circles
  graphics
    .circle(start.x, start.y, 4)
    .fill(0xffffff)
    .circle(end.x, end.y, 4)
    .fill(0xffffff);
};
```

### Event Handling Pattern (Pixi.js v8)

```typescript
// Add interaction to Pixi stage with proper cleanup
const setupInteraction = (
  app: PIXI.Application,
  onPointerMove: (x: number, y: number) => void
) => {
  app.stage.eventMode = 'static'; // Enable events
  app.stage.hitArea = app.screen;
  
  // v8: Use pointer events (recommended over mouse events)
  const handleMove = (event: PIXI.FederatedPointerEvent) => {
    const { x, y } = event.global;
    onPointerMove(x, y);
  };
  
  app.stage.on('pointermove', handleMove);
  
  // Return cleanup function
  return () => {
    if (app.stage) {
      app.stage.off('pointermove', handleMove);
    }
  };
};
```

## Testing Strategy

### Unit Tests

```typescript
// utils/__tests__/geometry.test.ts

import { distance, snapToGrid } from '../geometry';

describe('geometry utils', () => {
  it('calculates distance between points', () => {
    const result = distance({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(result).toBe(5);
  });
  
  it('snaps point to grid', () => {
    const result = snapToGrid({ x: 23, y: 47 }, 10);
    expect(result).toEqual({ x: 20, y: 50 });
  });
});
```

### Integration Tests

```typescript
// components/__tests__/PixiCanvas.test.tsx

import { render, screen } from '@testing-library/react';
import { PixiCanvas } from '../PixiCanvas';

describe('PixiCanvas', () => {
  it('renders canvas container', () => {
    render(<PixiCanvas />);
    expect(screen.getByTestId('pixi-canvas')).toBeInTheDocument();
  });
});
```

## Drawing Logic Patterns

### Vertex Reuse, Edge Splitting, and Duplicate Prevention

The drawing system handles 5 distinct scenarios when placing vertices:

**Scenario 1: Both vertices are new**
```typescript
// User clicks in empty space (twice)
// Result: Create 2 new points, create 1 wall
// State changes: +2 points, +1 wall
```

**Scenario 2: Start vertex exists, end vertex is new**
```typescript
// User clicks on existing point, then empty space
// Result: Reuse existing start point, create new end point, create wall
// State changes: +1 point, +1 wall (no duplicate start point)
```

**Scenario 3: Start vertex is new, end vertex exists**
```typescript
// User clicks in empty space, then on existing point
// Result: Create new start point, reuse existing end point, create wall
// State changes: +1 point, +1 wall (no duplicate end point)
```

**Scenario 4: Both vertices exist**
```typescript
// User clicks on existing point (twice)
// Result: Reuse both points, create wall connecting them
// State changes: +0 points, +1 wall (no duplicates at all)
```

**Scenario 5: Click on existing edge (split wall)**
```typescript
// User clicks on an existing wall (not near its endpoints)
// Result: Create new point at click location, split wall into two walls
// State changes: +1 point, -1 wall (old), +2 walls (new)
// Room updates: Any room using the old wall now references both new walls
```

**Implementation Pattern:**
```typescript
// 1. Check for nearby point
const findNearbyPoint = (
  x: number, 
  y: number, 
  points: Map<string, Point>, 
  threshold: number = 10
): Point | undefined => {
  for (const [, point] of points) {
    if (isNearPoint({ id: '', x, y }, point, threshold)) {
      return point;
    }
  }
  return undefined;
};

// 2. Check if clicking on a wall (if no nearby point)
const findWallAtPoint = (
  x: number,
  y: number,
  walls: Map<string, Wall>,
  points: Map<string, Point>,
  threshold: number = 8
): { wallId: string; wall: Wall } | undefined => {
  for (const [wallId, wall] of walls) {
    const startPoint = points.get(wall.startPointId);
    const endPoint = points.get(wall.endPointId);
    
    if (startPoint && endPoint) {
      if (isPointOnLineSegment({ id: '', x, y }, startPoint, endPoint, threshold)) {
        return { wallId, wall };
      }
    }
  }
  return undefined;
};

// 3. Use in click handler
const handleClick = (x: number, y: number) => {
  // First priority: existing points
  const nearbyPoint = findNearbyPoint(x, y, state.points);
  
  if (nearbyPoint) {
    // Reuse existing point - NO dispatch
    useExistingPoint(nearbyPoint);
  } else {
    // Second priority: existing walls (split them)
    const wallAtPoint = findWallAtPoint(x, y, state.walls, state.points);
    
    if (wallAtPoint) {
      // Scenario 5: Split the wall
      const splitPoint: Point = { id: generateId(), x, y };
      dispatch({ type: 'SPLIT_WALL', wallId: wallAtPoint.wallId, splitPoint });
      useNewPoint(splitPoint);
    } else {
    // Create new point - YES dispatch
    const newPoint = { id: generateId(), x, y };
    dispatch({ type: 'ADD_POINT', point: newPoint });
  }
};
```

**Key Principle**: Only dispatch `ADD_POINT` when no existing point is found within the threshold radius. This guarantees no duplicate vertices regardless of which scenario occurs.

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Messages
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

Example:
```
feat: implement wall drawing tool

- Add click-to-place interaction
- Show preview line while drawing
- Support wall chaining
```

## Performance Monitoring

### Key Metrics
- FPS (target: 60fps)
- Time to Interactive (target: <2s)
- Bundle size (target: <500KB gzipped)
- Memory usage (target: <50MB for 100 walls)

### Tools
- React DevTools Profiler
- Pixi.js DevTools
- Chrome Performance panel
- Lighthouse CI

## Deployment

### Build Process

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

### Deployment Targets
- Vercel (recommended for Vite)
- Netlify
- GitHub Pages
- Self-hosted

### Environment Variables

```env
# .env.production
VITE_APP_TITLE="Floorplan Drawing App"
VITE_API_URL="https://api.example.com"
```

## Troubleshooting

### Common Issues

**Pixi.js not rendering:**
- Check canvas is added to DOM
- Verify WebGL support in browser
- Check console for initialization errors

**TypeScript errors:**
- Run `npm run type-check`
- Ensure @types packages are installed
- Check tsconfig.json configuration

**Performance issues:**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Profile Pixi.js rendering with DevTools
- Implement spatial indexing for large datasets

## Next Steps

1. Install Pixi.js dependencies
2. Create type definitions
3. Implement PixiCanvas component
4. Build wall drawing functionality
5. Add toolbar and mode switching

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.
See [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for rationale behind choices.
