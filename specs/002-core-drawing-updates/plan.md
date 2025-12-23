# Implementation Plan: Core Drawing Updates

**Branch**: `002-core-drawing-updates` | **Date**: 2025-12-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-core-drawing-updates/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements variable resolution snapping (replacing the visual grid), robust room splitting with sequential ID generation, and a modern visual style (off-white background, dark walls). It also refactors the `Edge` interface to remove UI attributes (`thickness`, `style`) to clean up the data model.

## Technical Context

**Language/Version**: TypeScript 5+
**Primary Dependencies**: React 19+, PixiJS 8+, Zustand
**Storage**: LocalStorage (via Zustand persist)
**Testing**: Vitest
**Target Platform**: Web (Modern Browsers)
**Project Type**: Web
**Performance Goals**: 60fps rendering
**Constraints**: Strict logic/UI segregation
**Scale/Scope**: Core drawing engine

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Architecture**: Logic (snapping, room detection) placed in `utils/` and `store/`. UI components (`Toolbar`, `PixiCanvas`) only handle rendering and input. ✅
- **II. State Management**: `useSpatialStore` manages state. Command pattern (existing) will be used for wall creation/splitting. ✅
- **III. Graphics**: PixiJS handles the grid-less rendering and custom styling. ✅
- **IV. Type Safety**: New interfaces (`DrawingSettings`) and updated `Edge` defined in `contracts/`. ✅
- **V. Testing**: Unit tests required for `getSnappedPoint` and `updateRoomIds`. ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-core-drawing-updates/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Toolbar.tsx       # Update for resolution dropdown
│   └── PixiCanvas.tsx    # Update for visual style & snapping events
├── store/
│   └── useSpatialStore.ts # Add drawingSettings, update room logic
├── types/
│   └── spatial.ts        # Update Edge interface
└── utils/
    ├── geometry.ts       # Add getSnappedPoint
    └── roomDetection.ts  # Update ID generation logic
```

**Structure Decision**: Standard single project structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A
