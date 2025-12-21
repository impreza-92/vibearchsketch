# Floorplan Drawing App - Architecture

## Overview

A web-based floorplan drawing application built with React 19, TypeScript, and Pixi.js. Users can create, edit, and export architectural floorplans through an interactive canvas interface.

## Technology Stack

### Core Technologies
- **React 19.2** - UI framework with modern hooks and concurrent rendering
- **TypeScript 5.x** - Type-safe development
- **Pixi.js 8.x** - High-performance 2D WebGL rendering engine
- **Vite** - Fast build tool with excellent HMR

### Key Libraries
- **@pixi/react** (or react-pixi-fiber) - React integration for Pixi.js
- **Zustand** (optional) - Lightweight state management if needed

## Architecture Decisions

### 1. Pixi.js Integration Approach

**Decision: Direct Pixi.js management with React refs and useEffect**

**Rationale:**
- Full control over Pixi.js rendering pipeline
- Better performance for complex drawing operations
- Easier to implement custom drawing tools and interactions
- Avoids abstraction overhead of @pixi/react for low-level canvas operations

**Implementation:**
- Create a `PixiCanvas` component that initializes Pixi.js Application asynchronously
- Use React refs to manage Pixi Application and Graphics layers
- Use useEffect hooks for async setup, cleanup, and event handling
- Follow Pixi.js v8 async initialization pattern with `await app.init()`
- Use initialization state (`isInitialized`) to coordinate event handler attachment after async init
- Use Pixi.js v8 pointer events (`pointermove`, `pointerdown`) for unified mouse/touch handling
- Expose drawing API through context or custom hooks

### 2. State Management

**Decision: React Context + useReducer for drawing state**

**Rationale:**
- Sufficient for initial scope (walls, rooms, basic tools)
- No additional dependencies
- Easy to migrate to Zustand later if complexity increases
- Clear separation between UI state and drawing state

**State Structure:**
```typescript
interface FloorplanState {
  walls: Wall[]
  rooms: Room[]
  selectedIds: string[]
  drawingMode: 'draw' | 'select' | 'pan' | 'erase'
  gridSize: number
  snapToGrid: boolean
  history: FloorplanState[] // For undo/redo
}
```

### 3. Coordinate System

**Decision: Pixel-based with optional grid snapping**

**Rationale:**
- Pixi.js uses pixel coordinates natively
- Grid snapping can be implemented as a transform layer
- Easy to scale and convert to real-world measurements later
- Simpler implementation for MVP

**Coordinate Features:**
- Origin (0, 0) at top-left of canvas
- Pan and zoom support with matrix transformations
- Grid overlay for visual reference
- Snap-to-grid option for precision

### 4. Data Model

**Decision: Graph-based wall representation**

**Rationale:**
- Walls as edges between points (nodes) create a flexible graph structure
- Easy to detect shared walls and room boundaries
- Efficient for hit detection and selection
- Natural representation for architectural elements

**Core Types:**
```typescript
interface Point {
  id: string
  x: number
  y: number
}

interface Wall {
  id: string
  startPointId: string
  endPointId: string
  thickness: number
  style: 'solid' | 'dashed'
}

interface Room {
  id: string
  name: string
  wallIds: string[]
  fill?: string
}
```

## Component Architecture

```
App
├── Toolbar (mode selection, tools)
├── PropertiesPanel (selected element properties)
├── PixiCanvas (main drawing surface)
│   ├── Pixi.Application
│   ├── Stage (Pixi container)
│   ├── GridLayer (optional grid overlay)
│   ├── WallsLayer (render walls)
│   ├── RoomsLayer (render rooms)
│   └── InteractionLayer (mouse events, selection)
└── StatusBar (coordinates, measurements)
```

## Rendering Strategy

### Pixi.js Rendering Pipeline

1. **Static layers** - Grid background (updated only on grid size change)
2. **Dynamic layers** - Walls and rooms (updated on state change)
3. **Interactive layer** - Preview graphics for temporary drawing
4. **Event system** - Stage with `eventMode: 'static'` for pointer events

### Performance Optimizations

- Use Pixi.js v8 Graphics API with chained methods for better performance
- Graphics layers added directly to app.stage (no extra Container needed)
- Implement spatial indexing (quadtree) for large floorplans (future)
- Only re-render changed layers using React useEffect dependencies
- Event listeners properly cleaned up to prevent memory leaks
- Use `mounted` flag to prevent state updates after component unmount

## User Interaction Flow

### Wall Drawing Mode
1. User clicks "Draw Wall" tool
2. First click places start point
3. Mouse move shows temporary preview line
4. Second click places end point and creates wall
5. Continue clicking to chain walls
6. Press Escape or switch mode to finish

### Selection Mode
1. User clicks element to select
2. Show selection handles/highlights
3. Drag to move selected elements
4. Click properties panel to edit attributes
5. Delete key removes selected elements

### Pan Mode
1. Click and drag to pan canvas
2. Scroll wheel to zoom in/out
3. Reset view button to center

## File Structure

```
src/
├── components/
│   ├── PixiCanvas.tsx           # Main Pixi.js canvas component
│   ├── Toolbar.tsx              # Drawing tools toolbar
│   ├── PropertiesPanel.tsx      # Edit properties
│   └── StatusBar.tsx            # Info display
├── hooks/
│   ├── useFloorplanState.ts     # State management hook
│   ├── useDrawingTool.ts        # Drawing tool logic
│   └── usePixiSetup.ts          # Pixi.js initialization
├── types/
│   ├── floorplan.ts             # Wall, Room, Point types
│   └── tools.ts                 # Tool modes and configs
├── utils/
│   ├── geometry.ts              # Math helpers (distance, intersection)
│   ├── snapToGrid.ts            # Grid snapping logic
│   └── serialization.ts         # Save/load JSON
├── context/
│   └── FloorplanContext.tsx     # Global state context
└── App.tsx                      # Root component
```

## Future Enhancements

### Phase 2
- Measurement tools (dimensions, area calculation)
- Room labeling and annotations
- Door and window placement
- Multiple floors/levels

### Phase 3
- Export to SVG, PNG, PDF
- Import from DXF/DWG files
- 3D preview mode
- Furniture library

### Phase 4
- Collaborative editing (WebSockets)
- Cloud storage integration
- Templates and presets
- Mobile touch support optimization
