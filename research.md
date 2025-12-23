# Research: React 19 + TypeScript + PixiJS 8 Architecture

## 1. PixiJS 8 Integration

### Managing Application Lifecycle
**Best Practice:**
- **Initialization:** Use a `useEffect` hook to initialize the `PIXI.Application`. Since PixiJS v8 uses an asynchronous `init()` method, ensure the cleanup function handles the destruction properly to avoid memory leaks.
- **Ref Storage:** Store the `PIXI.Application` instance in a `useRef` to maintain access without triggering re-renders.
- **Strict Mode:** In React 18/19 Strict Mode, effects run twice. Ensure your initialization logic checks if the app is already initialized or use a `mounted` flag.

**Current Implementation (`PixiCanvas.tsx`):**
- Correctly uses `useRef` for the app and `useEffect` for async initialization.
- Correctly handles the `mounted` state to prevent double initialization.

### Handling Window Resizing
**Best Practice:**
- **ResizeObserver:** Prefer `ResizeObserver` on the parent container over `window.addEventListener('resize')`. This handles cases where the layout changes (e.g., sidebar toggles) without the window size changing.
- **Debouncing:** Debounce the resize handler to prevent excessive layout calculations during drag operations.

**Recommendation:**
Replace the current `window` resize listener with a `ResizeObserver` on the `canvasRef` container.

### Performance Optimization (60fps)
**Best Practice:**
- **Separate Rendering Loop:** Do not rely on React state updates to drive the render loop for high-frequency animations. Use Pixi's built-in `app.ticker`.
- **Dirty Flag Pattern:** Only redraw graphics when data actually changes.
- **Culling:** For large graphs, implement viewport culling (only draw what is visible).
- **Event Mode:** Use `eventMode = 'static'` (as currently implemented) for better performance than `dynamic` if continuous hit testing isn't needed.

### Decoupling Rendering from React
**Best Practice:**
- **Store Subscription:** Instead of passing state via props or context which triggers React re-renders, have the PixiJS component subscribe directly to the Zustand store.
- **Transient Updates:** For high-frequency changes (like dragging a vertex), update the PixiJS graphics directly from the event handler or a transient store update, bypassing React's render cycle entirely.

## 2. Room Detection Algorithm

### Efficient Closed Loop Detection
**Best Practice: Planar Face Traversal (Right-Hand Rule)**
- **Concept:** In a planar graph (2D floorplan), every closed room is a "face". You can find all faces by traversing edges.
- **Algorithm:**
    1.  Treat every undirected wall as two directed half-edges (A→B and B→A).
    2.  Sort outgoing edges at each vertex by angle.
    3.  Traverse the graph: When arriving at a vertex, always take the "right-most" turn (next edge in clockwise order).
    4.  This traversal guarantees finding the smallest enclosing cycle (the room) for any starting edge.

**Current Implementation (`spatialGraph.ts`):**
- Already implements `findMinimalCycles` using a robust "Planar Face Detection" approach.
- Includes filament (dead-end) removal.
- Uses `traceFaceImproved` with cross-product angle calculations.

### Handling Shared Edges
**Best Practice:**
- **Directed Edge Keying:** Use a composite key (e.g., `${startId}-${endId}`) to track visited edges.
- **Double Traversal:** Since a wall can be part of two rooms (one on each side), the algorithm must allow traversing the wall A→B for Room 1 and B→A for Room 2.
- **Visited Set:** Track visited *directed* edges, not undirected walls.

### Calculating Area of Irregular Polygons
**Best Practice: Shoelace Formula**
- **Formula:** $Area = \frac{1}{2} | \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) |$
- **Orientation:** The sign of the result indicates winding order (clockwise vs. counter-clockwise). This is useful for detecting "holes" or ensuring consistent room definitions.

**Current Implementation:**
- Correctly implements `calculateSignedPolygonArea` using the Shoelace formula.

## 3. Zustand State Management

### Managing Complex Graph Structure
**Best Practice: Normalized State**
- **Structure:** Do not store class instances (like `SpatialGraph`) directly in the store if they contain methods. Store plain objects (POJOs).
- **Normalization:** Store data in Maps or Objects keyed by ID.
    ```typescript
    interface SpatialState {
      vertices: Record<string, Vertex>;
      edges: Record<string, Edge>;
      surfaces: Record<string, Surface>;
    }
    ```
- **Separation:** Keep the *data* in Zustand, and the *logic* (graph algorithms) in pure functions or a helper class that takes the state as input.

### Immutable Updates with Immer
**Best Practice:**
- **Middleware:** Use `immer` middleware to write simpler reducers.
    ```typescript
    set((state) => {
      state.vertices[id].x = newX; // Immer handles the immutability
    })
    ```
- **Atomic Updates:** Group related updates (e.g., moving a vertex also updates connected edges) into single actions to prevent inconsistent states.

### Selectors for Performance
**Best Practice:**
- **Granular Selectors:** Create small, specific selectors.
    ```typescript
    const useVertex = (id) => useStore(state => state.vertices[id]);
    ```
- **Memoization:** Use `useShallow` from `zustand/react/shallow` to prevent re-renders when returning objects/arrays.
- **Computed Values:** For expensive derivations (like the room detection result), consider using a derived store or computing it only when the relevant graph topology changes (edges added/removed), not on every vertex move.

### Proposed Zustand Store Structure

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  vertices: Record<string, Vertex>;
  edges: Record<string, Edge>;
  // ...
  actions: {
    addVertex: (v: Vertex) => void;
    updateVertexPosition: (id: string, x: number, y: number) => void;
    // ...
  }
}

export const useSpatialStore = create<State>()(
  immer((set) => ({
    vertices: {},
    edges: {},
    actions: {
      addVertex: (v) => set((state) => {
        state.vertices[v.id] = v;
      }),
      // ...
    }
  }))
);
```
