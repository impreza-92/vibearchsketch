# Tasks: Core Drawing Updates

**Feature**: Core Drawing Updates
**Spec**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

## Phase 1: Setup

- [x] T001 Create `DrawingSettings` interface and update `SpatialState` in [src/types/spatial.ts](src/types/spatial.ts)

## Phase 2: Foundational

*No blocking foundational tasks identified.*

## Phase 3: Configurable Drawing Precision (US1)

- [x] T002 [US1] Implement `getSnappedPoint` in [src/utils/geometry.ts](src/utils/geometry.ts)
- [x] T003 [US1] Add `drawingSettings` slice and `setResolution` action to [src/store/useSpatialStore.ts](src/store/useSpatialStore.ts)
- [x] T004 [US1] Update `Toolbar` to add resolution dropdown in [src/components/Toolbar.tsx](src/components/Toolbar.tsx)
- [x] T005 [US1] Update drawing interaction to use `getSnappedPoint` in [src/components/PixiCanvas.tsx](src/components/PixiCanvas.tsx)
- [x] T006 [US1] Add unit tests for snapping in [tests/unit/geometry.test.ts](tests/unit/geometry.test.ts)

## Phase 4: Reliable Room Splitting (US2)

- [x] T007 [US2] Create `src/utils/roomDetection.ts` and implement `updateRoomIds` with signature matching in [src/utils/roomDetection.ts](src/utils/roomDetection.ts)
- [x] T008 [US2] Update `SpatialGraph` to use `updateRoomIds` when updating surfaces in [src/utils/spatialGraph.ts](src/utils/spatialGraph.ts)
- [x] T009 [US2] Add unit tests for room ID generation in [tests/unit/roomDetection.test.ts](tests/unit/roomDetection.test.ts)

## Phase 5: Modern Canvas Visualization (US3)

- [x] T010 [US3] Update `PixiCanvas` to remove grid rendering and change background color in [src/components/PixiCanvas.tsx](src/components/PixiCanvas.tsx)
- [x] T011 [US3] Update wall rendering to use fixed dark color in [src/components/PixiCanvas.tsx](src/components/PixiCanvas.tsx)

## Phase 6: Codebase Cleanup (US4)

- [x] T012 [US4] Remove `thickness` and `style` from `Edge` interface in [src/types/spatial.ts](src/types/spatial.ts)
- [x] T013 [US4] Remove `thickness` and `style` usages in [src/store/useSpatialStore.ts](src/store/useSpatialStore.ts) and [src/utils/commands.ts](src/utils/commands.ts)
- [x] T014 [US4] Remove `thickness` and `style` usages in [src/components/PixiCanvas.tsx](src/components/PixiCanvas.tsx)
- [x] T015 [US4] Update export logic to remove attributes in [src/utils/export.ts](src/utils/export.ts)

## Final Phase: Polish

- [x] T016 Verify all tests pass and feature works as expected

## Dependencies

- US1 (Snapping) is independent.
- US2 (Room Splitting) depends on `SpatialGraph` structure.
- US3 (Visuals) is independent but modifies `PixiCanvas`.
- US4 (Cleanup) modifies `Edge` interface, affecting all other phases. It is placed last to minimize disruption during development, but could be done earlier if preferred.

## Implementation Strategy

1.  **MVP**: Implement US1 (Snapping) and US3 (Visuals) first to give the user the immediate UI feedback they requested.
2.  **Logic**: Implement US2 (Room Splitting) to fix the core bug.
3.  **Refactor**: Implement US4 (Cleanup) to tidy up the code.
