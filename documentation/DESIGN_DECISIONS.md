# Design Decisions

## Technical Decisions

### Why Pixi.js over Canvas API or SVG?

**Decision: Pixi.js**

**Alternatives Considered:**
1. Raw Canvas API
2. SVG with React
3. Three.js
4. Fabric.js

**Rationale:**
- **Performance**: Pixi.js uses WebGL for hardware acceleration, crucial for complex floorplans with many elements
- **Developer Experience**: Higher-level API than raw Canvas, easier than WebGL
- **Rendering Speed**: Can handle 1000+ objects at 60fps
- **Event Handling**: Built-in interaction manager for mouse/touch events
- **Community**: Large ecosystem, well-maintained, extensive documentation

**Trade-offs:**
- Larger bundle size (~500KB) vs raw Canvas
- Learning curve for Pixi.js API
- May be overkill for simple diagrams

### Why Direct Pixi.js Integration vs @pixi/react?

**Decision: Direct Pixi.js v8 with refs and useEffect**

**Rationale:**
- **Control**: Full access to Pixi.js v8 rendering pipeline and optimizations
- **Performance**: No abstraction layer overhead, modern Graphics API
- **Flexibility**: Easier to implement custom rendering logic and tools
- **Debugging**: Direct access to Pixi objects in DevTools
- **Documentation**: Following official Pixi.js v8 patterns from pixijs.com
- **Modern API**: Async initialization and chained Graphics methods

**Pixi.js v8 Benefits:**
- Async initialization prevents render blocking
- New Graphics API with method chaining is more intuitive
- Pointer events (`pointermove`, `pointerdown`) unify mouse + touch handling
- Performance improvements in batching and rendering
- Better lifecycle management with initialization state tracking

**Implementation Pattern:**
- Use `isInitialized` state to coordinate event handlers with async init
- Event handlers wait for initialization to complete before attaching
- Prevents race conditions between async init and event handler useEffects
- Ensures stage is fully ready before interaction is enabled

**When to Reconsider:**
- If we need declarative rendering of 100+ Pixi components
- If team is unfamiliar with Pixi.js but knows React well
- If we want React-style composition of Pixi elements

### State Management: Context vs Zustand vs Redux

**Decision: React Context + useReducer (with migration path to Zustand)**

**Rationale:**
- **Simplicity**: No additional dependencies for MVP
- **Sufficient**: Floorplan state is relatively simple (walls, rooms, selected items)
- **Type Safety**: Works naturally with TypeScript
- **Migration Path**: Easy to swap to Zustand if needed (similar API)

**When to Migrate to Zustand:**
- State updates become performance bottleneck
- Need time-travel debugging beyond undo/redo
- Multiple independent state slices needed
- Team wants devtools integration

**Why Not Redux:**
- Overkill for this use case
- More boilerplate
- Larger bundle size
- Context + useReducer achieves same goals with less code

## UX Decisions

### Drawing Interaction Model

**Decision: Click-to-place individual walls (one wall at a time)**

**Alternatives Considered:**
1. Click-and-drag to draw walls
2. Freehand drawing with auto-straightening
3. Shape-based drawing (rectangles, then subdivide)
4. Auto-chaining walls (previous behavior)

**Rationale:**
- **Clarity**: Each wall is a deliberate action (2 clicks = 1 wall)
- **Control**: User decides when to connect walls vs. start new ones
- **Flexibility**: Easy to draw disconnected walls without changing modes
- **Familiar**: Similar to professional CAD software workflow
- **Smart Snapping**: Automatically detects and reuses existing points within 10 pixels

**Implementation:**
- First click: Start point (reuses existing point if within 10px)
- Move mouse: Preview line
- Second click: End point, create wall, reset for next wall
- No automatic chaining - user must intentionally click on endpoints to connect walls
- Visual feedback shows when near existing points

### Vertex Management and Duplicate Prevention

**Decision: Smart point detection with 10px snap radius and edge splitting**

**Problem Addressed:**
When drawing walls, we need to handle 5 distinct scenarios without creating duplicate vertices:

1. **Both vertices are new** - Create and add both start and end points
2. **Start exists, end is new** - Reuse existing start point, create new end point
3. **Start is new, end exists** - Create new start point, reuse existing end point
4. **Both vertices exist** - Reuse both points, only create the wall
5. **Click on existing edge** - Split the edge at the click point, creating a new vertex and two walls

**Implementation:**
- **Point Detection** (Scenarios 1-4):
  - Before creating a point, search all existing points within 10px radius
  - If found: Reuse the existing point (no ADD_POINT dispatch)
  - If not found: Check if clicking on an existing wall (Scenario 5)
  - If not on wall: Create new point and dispatch ADD_POINT action
  
- **Edge Splitting** (Scenario 5):
  - Calculate perpendicular distance from click to each wall segment
  - If distance < 8px AND not near endpoints (t > 0.1 and t < 0.9):
    - Create new point at click position
    - Remove original wall
    - Create two new walls: start→new and new→end
    - Update any rooms referencing the split wall
  - Use the new point as start/end point for next wall

**Benefits:**
- **Data Integrity**: Prevents duplicate points at the same location
- **T-Junctions**: Properly connects perpendicular walls to existing walls
- **Room Topology**: Split walls correctly update room boundaries
- **Connection Support**: Walls automatically share vertices when drawn near existing points
- **User Control**: 10px tolerance for points, 8px for edges - gives flexibility while preventing accidental behavior
- **Performance**: Efficient lookup using Map iteration

**Edge Cases Handled:**
- Clicking on the same point twice creates a zero-length wall (cosmetic only, no duplicate)
- Multiple walls can share the same vertices (intentional feature)
- Grid snapping happens before point/edge detection, ensuring consistent coordinates
- Split points near endpoints (t < 0.1 or t > 0.9) are treated as clicking on the endpoint
- Rooms automatically update when walls are split (wallIds array updated)

**Why Edge Splitting Matters:**
In architectural drawing, it's common to draw perpendicular walls that meet an existing wall at a T-junction. Without edge splitting:
- The new wall would either miss the existing wall or create a floating point
- Room detection would fail because walls aren't properly connected
- Manual vertex creation would be required (tedious workflow)

With edge splitting:
- Click anywhere on a wall to create a connection point
- New walls automatically connect to the split point
- Room topology remains valid (split wall replaced by two walls in room boundary)

### Grid and Snapping

**Decision: Optional grid overlay with toggle-able snapping**

**Rationale:**
- **Flexibility**: Users can choose precision vs freedom
- **Visual Aid**: Grid helps maintain proportions
- **Default On**: Snapping enabled by default for cleaner results
- **Quick Toggle**: Hold Shift to temporarily disable snapping

**Grid Settings:**
- Default grid size: 10px (configurable)
- Minor grid lines every 10px
- Major grid lines every 50px
- Snap tolerance: 5px from grid intersection

### Selection and Editing

**Decision: Direct manipulation with handles**

**Rationale:**
- **Intuitive**: Click to select, drag to move
- **Visual Feedback**: Highlighted selection, resize handles
- **Multi-select**: Shift-click to add to selection
- **Properties Panel**: Edit numeric values for precision

**Selection Modes:**
- Single click: Select element
- Shift+click: Add/remove from selection
- Click+drag empty space: Rectangle selection (future)
- Delete key: Remove selected elements

## Visual Design Decisions

### Color Scheme

**Decision: Professional CAD-inspired theme**

**Colors:**
- Background: `#1e1e1e` (dark gray)
- Grid: `#2a2a2a` (subtle)
- Walls: `#ffffff` (white, high contrast)
- Selected: `#0078d4` (blue, accessible)
- Preview: `#ffaa00` (orange, distinct from final)
- Grid major: `#3a3a3a` (slightly brighter)

**Rationale:**
- Dark theme reduces eye strain
- High contrast for walls ensures visibility
- Blue selection matches VS Code and professional tools
- Orange preview is distinct and attention-grabbing

### UI Layout

**Decision: Tools on left, canvas center, properties on right**

**Layout:**
```
┌──────────┬─────────────────────────┬──────────────┐
│ Toolbar  │                         │ Properties   │
│          │                         │              │
│ [Draw]   │      Canvas             │ Wall Props   │
│ [Select] │                         │ - Thickness  │
│ [Pan]    │                         │ - Style      │
│ [Erase]  │                         │              │
│          │                         │ Room Props   │
│          │                         │ - Name       │
│          │                         │ - Fill       │
└──────────┴─────────────────────────┴──────────────┘
│              Status Bar (coords, zoom)            │
└───────────────────────────────────────────────────┘
```

**Rationale:**
- **Standard**: Matches Adobe, Figma, CAD software conventions
- **Left-to-right**: Natural workflow (select tool → draw → edit properties)
- **Maximized Canvas**: Center focus on drawing area
- **Collapsible Panels**: Can hide for full-screen canvas

## Data Format Decisions

### File Format

**Decision: JSON with clear schema**

**Format:**
```json
{
  "version": "1.0",
  "metadata": {
    "name": "My Floorplan",
    "created": "2025-12-21T00:00:00Z",
    "modified": "2025-12-21T00:00:00Z"
  },
  "points": [
    { "id": "p1", "x": 100, "y": 100 }
  ],
  "walls": [
    { "id": "w1", "startPointId": "p1", "endPointId": "p2", "thickness": 10 }
  ],
  "rooms": [
    { "id": "r1", "name": "Living Room", "wallIds": ["w1", "w2"] }
  ]
}
```

**Rationale:**
- **Human-readable**: Easy to debug and edit manually
- **Portable**: Works across platforms, easy to parse
- **Versioned**: Can evolve schema with version field
- **Extensible**: Can add custom properties without breaking

**Future Export Formats:**
- SVG for vector graphics
- PNG/JPEG for raster images
- DXF for CAD software import (Phase 3)

## Performance Decisions

### Rendering Optimization Strategy

**Decisions:**
1. **Layer-based rendering**: Separate static and dynamic content
2. **Spatial indexing**: Quadtree for large floorplans (>500 elements)
3. **Lazy rendering**: Only render visible elements when zoomed in
4. **Debounced updates**: Throttle pan/zoom recalculations

**Rationale:**
- Start simple, optimize when needed
- Pixi.js handles most optimizations automatically
- Focus on algorithmic efficiency over micro-optimizations

### When to Optimize

**Thresholds:**
- <100 elements: No optimization needed
- 100-500 elements: Implement layer caching
- 500-1000 elements: Add spatial indexing
- 1000+ elements: Consider viewport culling and LOD

## Accessibility Decisions

**Decision: Keyboard-first with ARIA labels**

**Features:**
- Tab navigation through tools
- Arrow keys to nudge selected elements
- Keyboard shortcuts (Ctrl+Z undo, Delete, Escape cancel)
- ARIA labels on all interactive elements
- Focus indicators on toolbar buttons

**Rationale:**
- Professional tools are keyboard-heavy
- Accessibility is requirement, not afterthought
- Power users prefer keyboard shortcuts

**Future:**
- Voice commands for drawing (experimental)
- Screen reader support for canvas content (challenging)
- High contrast mode toggle
