# Tasks: Core Floorplan Drawing & Export

**Feature Branch**: `001-floorplan-core`
**Spec**: [specs/001-floorplan-core/spec.md](../spec.md)

## Phase 1: Setup & Infrastructure
*Goal: Initialize project structure, dependencies, and core state management.*

- [X] T001 Install dependencies (PixiJS, Zustand, Immer) in `package.json`
- [X] T002 Create project directory structure (`src/components`, `src/store`, `src/utils`, `src/types`)
- [X] T003 Define TypeScript interfaces for `Vertex`, `Edge`, `Surface` in `src/types/spatial.ts`
- [X] T004 Implement `SpatialGraph` class in `src/utils/spatialGraph.ts` (Core Data Structure)
- [X] T005 Create test harness (mock data generators) for `SpatialGraph` in `tests/helpers/mockData.ts`
- [X] T006 Implement `Command` interface and `CommandManager` in `src/utils/commands.ts`
- [X] T007 Initialize Zustand store with `SpatialGraph` and `CommandManager` in `src/store/useSpatialStore.ts`
- [X] T008 Implement `geometry.ts` with distance, snapping, and intersection helpers in `src/utils/geometry.ts`
- [X] T009 [P] Create `PixiCanvas` component skeleton with lifecycle management in `src/components/PixiCanvas.tsx`
- [X] T010 [P] Create `Toolbar` component skeleton in `src/components/Toolbar.tsx`
- [X] T011 Integrate components into `src/App.tsx`

## Phase 2: Foundational Logic (Blocking)
*Goal: Implement core graph operations and rendering basics.*

- [X] T012 Implement `AddVertexCommand` and `AddEdgeCommand` in `src/utils/commands.ts`
- [X] T013 Implement `RemoveEntityCommand` in `src/utils/commands.ts`
- [X] T014 Implement `SplitEdgeCommand` logic (geometry + graph update) in `src/utils/commands.ts`
- [X] T015 Implement basic PixiJS rendering loop (draw vertices/edges from graph) in `src/components/PixiCanvas.tsx`
- [X] T016 Create comprehensive unit tests for `SpatialGraph` operations using test harness in `tests/unit/spatialGraph.test.ts`
- [X] T017 Create unit tests for Command execution/undo in `tests/unit/commands.test.ts`

## Phase 3: User Story 1 - Draw Walls & Create Rooms
*Goal: Enable users to draw walls and automatically detect rooms.*

- [X] T018 [US1] Implement mouse interaction (click-drag-release) for drawing walls in `src/components/PixiCanvas.tsx`
- [X] T019 [US1] Implement vertex snapping logic during drawing in `src/components/PixiCanvas.tsx`
- [X] T020 [US1] Implement `detectSurfaces` algorithm (Planar Face Traversal) in `src/utils/spatialGraph.ts`
- [X] T021 [US1] Integrate `detectSurfaces` into `SpatialGraph` modification methods (auto-run on change)
- [X] T022 [US1] Render detected surfaces (rooms) with fill color in `src/components/PixiCanvas.tsx`
- [X] T023 [US1] Create unit tests for room detection algorithm using test harness in `tests/unit/spatialGraph.test.ts`

## Phase 4: User Story 2 - Real-Time Data
*Goal: Display wall lengths and room counts.*

- [X] T024 [US2] Implement `StatsPanel` component to show room/wall counts in `src/components/StatsPanel.tsx`
- [X] T025 [US2] Add text labels for wall lengths to PixiJS rendering in `src/components/PixiCanvas.tsx`
- [X] T026 [US2] Add text labels for room areas to PixiJS rendering in `src/components/PixiCanvas.tsx`
- [X] T027 [US2] Optimize rendering to only update labels when geometry changes in `src/components/PixiCanvas.tsx`

## Phase 5: User Story 3 - Export Data
*Goal: Allow users to save their work.*

- [X] T028 [US3] Implement `generateJSON` function in `src/utils/export.ts`
- [X] T029 [US3] Implement `generateCSV` function in `src/utils/export.ts`
- [X] T030 [US3] Add Export buttons to `src/components/Toolbar.tsx` and connect to export utils
- [X] T031 [US3] Create unit tests for export functions in `tests/unit/export.test.ts`

## Phase 6: Polish & Cleanup
*Goal: Ensure stability and code quality.*

- [X] T032 Implement "Clear Canvas" command in `src/utils/commands.ts` and `src/components/Toolbar.tsx`
- [X] T033 Add error boundary and basic error handling in `src/App.tsx`
- [X] T034 Run full test suite and fix any regressions
- [X] T035 Verify 60fps performance with 100+ walls

## Dependencies

- **US1** depends on Phase 1 & 2
- **US2** depends on US1 (needs walls/rooms to measure)
- **US3** depends on US1 (needs data to export)

## Parallel Execution Opportunities

- **T009 (Canvas)** and **T010 (Toolbar)** can be built in parallel.
- **T018 (Interaction)** and **T020 (Algorithm)** can be built in parallel by different developers (UI vs Logic).
- **T024 (Stats UI)** and **T025 (Canvas Labels)** can be built in parallel.
