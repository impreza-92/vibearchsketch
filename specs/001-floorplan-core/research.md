# Research: Core Floorplan Drawing & Export

**Feature**: Core Floorplan Drawing & Export
**Date**: 2025-12-23

## 1. PixiJS 8 Integration with React 19

### Decision
Use a `useRef` to hold the `PIXI.Application` instance and manage its lifecycle within a `useEffect` hook. Decouple the rendering loop from React's render cycle by subscribing the PixiJS scene directly to the Zustand store.

### Rationale
- **React 19 Concurrency**: Direct DOM manipulation (canvas) needs to be isolated from React's commit phase to avoid tearing and flickering.
- **Performance**: React's virtual DOM overhead is too high for 60fps interactive drawing. PixiJS should handle the interaction loop (pointer events) and rendering, while React handles the UI overlay (toolbar, stats).
- **PixiJS v8**: v8 introduces a new async initialization pattern (`await app.init()`) which must be handled carefully in `useEffect` cleanup functions to prevent memory leaks (using `app.destroy()`).

### Alternatives Considered
- **@pixi/react**: A React wrapper library. Rejected because it adds an abstraction layer that can hinder performance optimization and often lags behind the core PixiJS version.
- **Canvas API (Raw)**: Rejected because PixiJS provides a robust scene graph, WebGL acceleration, and interaction manager out of the box, which significantly speeds up development.

## 2. Room Detection Algorithm

### Decision
Implement a **Planar Face Traversal** algorithm using the "Right-Hand Rule" (or Left-Hand Rule) to detect closed cycles in the graph.

### Rationale
- **Graph Theory**: A floorplan is a planar graph. The "rooms" are the internal faces of this graph.
- **Shared Edges**: This algorithm naturally handles edges shared by two rooms by traversing each edge in both directions (as two directed half-edges).
- **Filaments**: Dead-end walls (filaments) are automatically ignored or handled as degenerate faces.

### Implementation Details
1.  Convert undirected walls (Edges) into two directed half-edges.
2.  Sort outgoing half-edges at each vertex by angle.
3.  Traverse the graph by always taking the "next right" turn at each vertex.
4.  Cycles found are candidate rooms.
5.  Calculate area using the **Shoelace Formula**. Positive area indicates a room (CCW traversal), negative indicates the outer boundary (CW traversal).

## 3. State Management (Zustand)

### Decision
Use **Zustand** with the `immer` middleware for immutable state updates. Store data in a normalized format (Records/Maps) rather than arrays.

### Rationale
- **Normalization**: Storing vertices and edges as `Record<string, Entity>` allows O(1) lookup, which is critical for snapping and hit-testing.
- **Immutability**: `immer` simplifies the complex logic of splitting walls (adding a vertex, removing one edge, adding two edges) without manual spread operator nesting.
- **Transient Updates**: Zustand allows components to subscribe to specific slices of state, preventing the entire UI from re-rendering when a single wall is dragged.

### Alternatives Considered
- **Redux Toolkit**: Too much boilerplate for this scope.
- **React Context**: Performance issues with frequent updates (mouse movement) causing full tree re-renders.

## 4. Export Formats

### Decision
- **JSON**: Dump the normalized store state directly.
- **CSV**: Generate a summary report (Room List, Wall List).

### Rationale
- **JSON**: Provides a complete, lossless representation of the data for saving/loading.
- **CSV**: Standard format for interoperability with spreadsheet software (Excel, Sheets) for quantity takeoffs.
