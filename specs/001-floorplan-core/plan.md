# Implementation Plan: Core Floorplan Drawing & Export

**Branch**: `001-floorplan-core` | **Date**: 2025-12-23 | **Spec**: [specs/001-floorplan-core/spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-floorplan-core/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the core floorplan drawing functionality using React 19, TypeScript, and PixiJS 8. The system will allow users to draw walls (edges) and vertices, automatically detecting closed rooms (surfaces) using a planar face traversal algorithm. State will be managed by Zustand with Immer for immutability. The architecture enforces strict separation of concerns by encapsulating graph logic in a `SpatialGraph` class and using the **Command Pattern** for all state modifications to support undo/redo. The feature includes real-time calculation of wall lengths and room areas, as well as export capabilities to JSON and CSV formats.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: React 19.2, PixiJS 8.x, Zustand 5.x, Immer
**Storage**: LocalStorage (for auto-save), File System (for export)
**Testing**: Vitest (Unit), Playwright (E2E - future)
**Target Platform**: Modern Web Browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web Application (Single Page)
**Performance Goals**: 60fps rendering during drawing; <16ms update time for graph operations up to 1000 elements.
**Constraints**: Client-side only; no backend required for this iteration.
**Scale/Scope**: Single floorplan document; ~100-500 elements typical.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Architecture & Separation of Concerns**: ✅ Compliant. Logic isolated in `SpatialGraph` and `utils`.
- **II. State Management & Command Pattern**: ✅ Compliant. Using Zustand + Command Pattern for graph ops.
- **III. High-Performance Graphics**: ✅ Compliant. Using PixiJS 8.
- **IV. Type Safety & Code Quality**: ✅ Compliant. Strict TS.
- **V. Testing Strategy**: ✅ Compliant. Vitest for logic.

## Project Structure

### Documentation (this feature)

```text
specs/001-floorplan-core/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── export-schema.ts
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── PixiCanvas.tsx   # Main drawing surface (UI only)
│   ├── Toolbar.tsx      # Tool selection
│   └── StatsPanel.tsx   # Room/Wall counts
├── store/
│   └── useSpatialStore.ts # Zustand store (State + Command Dispatch)
├── utils/
│   ├── spatialGraph.ts  # Core Domain Model (Logic)
│   ├── commands.ts      # Command Pattern Implementation
│   ├── geometry.ts      # Math helpers
│   └── export.ts        # JSON/CSV generation
├── types/
│   └── spatial.ts       # Shared interfaces
└── App.tsx
```

**Structure Decision**: Single project structure with strict separation: `utils/spatialGraph.ts` holds the domain model, `utils/commands.ts` handles mutations, and `store/useSpatialStore.ts` manages state and dispatching.

## Complexity Tracking

N/A - No constitution violations.
