<!--
SYNC IMPACT REPORT
Version: 1.0.0 -> 1.1.0
Modified Principles:
- I. Modern React Architecture -> I. Architecture & Separation of Concerns (Added strict logic/UI segregation)
- II. Centralized State Management -> II. State Management & Command Pattern (Added Command Pattern requirement for SpatialGraph)
Templates Status:
- .specify/templates/plan-template.md: ✅ Compatible
- .specify/templates/spec-template.md: ✅ Compatible
- .specify/templates/tasks-template.md: ✅ Compatible
-->

# VibeArchSketch Constitution

## Core Principles

### I. Architecture & Separation of Concerns
The application MUST be built using **React 19+** with **TypeScript**. There MUST be a strict segregation between business logic/data structures and UI components. UI components are responsible solely for rendering and user interaction, delegating business logic to utility layers or state managers. All components MUST be functional components utilizing Hooks.

### II. State Management & Command Pattern
Global application state MUST be managed using **Zustand**. All operations modifying the **SpatialGraph** (or core spatial data) MUST utilize the **Command Pattern** to ensure robust undo/redo capability and history tracking. Direct mutation of the graph from the UI is prohibited. Local component state (`useState`) is reserved for ephemeral UI interactions.

### III. High-Performance Graphics
All canvas-based drawing and rendering functionality MUST be implemented using **PixiJS**. The rendering layer SHOULD be decoupled from React's render cycle where possible to ensure 60fps performance. React components should control the *state* of the canvas, while PixiJS handles the *execution* of the rendering.

### IV. Type Safety & Code Quality
**TypeScript** is the primary language. All interfaces and types MUST be explicitly defined. The codebase MUST adhere to the project's ESLint and Prettier configurations. Commits SHOULD NOT break the build or introduce linting errors. Usage of `any` is forbidden without explicit, documented justification.

### V. Testing Strategy
Testing MUST be implemented using **Vitest**. Core logic (geometry, state transformations) MUST have high unit test coverage. UI components SHOULD be tested for accessibility and interaction. Test files should be split up where applicable to keep them organized and human readable. Tests should always be run after changes to the code.

## Technology Stack

### Core Dependencies
- **Frontend Framework**: React 19+
- **Language**: TypeScript 5+
- **State Management**: Zustand
- **Graphics Engine**: PixiJS 8+
- **Build Tool**: Vite
- **Testing**: Vitest

## Development Workflow

### Code Structure
- `src/components`: React UI components.
- `src/store`: Zustand stores.
- `src/utils`: Pure utility functions (geometry, math).
- `src/canvas`: PixiJS specific logic and classes.

## Governance

This Constitution supersedes all other project documentation. Amendments require a Pull Request with explicit justification and team approval.

**Version**: 1.1.0 | **Ratified**: 2025-12-23 | **Last Amended**: 2025-12-23
