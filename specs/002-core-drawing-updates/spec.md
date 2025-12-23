# Feature Specification: Core Drawing Updates

**Feature Branch**: `002-core-drawing-updates`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Refactor Edge attributes, fix room splitting IDs, implement drawing resolution, and update canvas styling."

## Clarifications

### Session 2025-12-23
- Q: How should the user select the drawing resolution? → A: Dropdown menu in the toolbar.
- Q: How should new room IDs be generated? → A: Always increment (Max ID + 1).
- Q: What is the default drawing resolution? → A: 100mm.

## User Scenarios & Testing

### User Story 1 - Configurable Drawing Precision (Priority: P1)

As a user, I want to select a drawing resolution (e.g., 1mm, 100mm) so that my measurements are precise without needing a visual grid.

**Why this priority**: This is a fundamental change to the drawing interaction model requested by the user.

**Independent Test**: Select a resolution (e.g., 100mm) and verify that drawn walls snap to 100mm increments.

**Acceptance Scenarios**:

1. **Given** the resolution is set to 100mm, **When** I draw a wall, **Then** its length and position coordinates are multiples of 100mm.
2. **Given** the resolution is set to 1000mm, **When** I move the cursor, **Then** the preview snaps to 1000mm grid points.
3. **Given** any resolution, **When** I move the cursor near an existing vertex, **Then** it snaps to the vertex (point snapping) regardless of the resolution grid.

---

### User Story 2 - Reliable Room Splitting (Priority: P1)

As a user, I want room IDs to be updated correctly when I split a room so that I can distinguish between different spaces.

**Why this priority**: Bug fix for core functionality (room detection).

**Independent Test**: Draw a room, then draw a wall splitting it. Check the generated room IDs.

**Acceptance Scenarios**:

1. **Given** a room with ID 1, **When** I draw a wall splitting it into two, **Then** I see two rooms with distinct IDs (e.g., 1 and 2, or 2 and 3).
2. **Given** multiple rooms, **When** I split one, **Then** the new IDs are unique and do not duplicate existing IDs.
3. **Given** a sequence of room IDs, **When** a new ID is generated, **Then** it follows the sequence (e.g., next available number) rather than skipping arbitrarily.

---

### User Story 3 - Modern Canvas Visualization (Priority: P2)

As a user, I want a clean, modern canvas without a grid so that the design looks professional.

**Why this priority**: Visual improvement requested by the user.

**Independent Test**: Open the application and observe the canvas background and wall colors.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** I view the canvas, **Then** the background is an off-white color.
2. **Given** the application is open, **When** I view the canvas, **Then** there are no visible grid lines.
3. **Given** I have drawn walls, **When** I view them, **Then** they appear in a dark color.

---

### User Story 4 - Codebase Cleanup (Priority: P3)

As a developer, I want the `Edge` interface to be free of UI attributes so that the data model is clean.

**Why this priority**: Refactoring task to improve code quality.

**Independent Test**: Check the `Edge` interface definition in the code.

**Acceptance Scenarios**:

1. **Given** the codebase, **When** I inspect the `Edge` interface, **Then** it does not contain `thickness` or `style` properties.

### Edge Cases

- **Resolution Change**: If the user changes resolution while drawing, the next point snaps to the new resolution grid. Existing points remain unchanged.
- **Minimum Length**: If a user attempts to draw a wall shorter than the resolution (e.g., 10mm wall with 100mm resolution), it should snap to the nearest grid point (0 or 100mm).
- **Complex Splits**: If a wall intersects multiple rooms or creates invalid geometry, the system should handle it gracefully (e.g., by not splitting or showing an error) and ensure no ID corruption.
- **Legacy Data**: Existing drawings with "thickness" or "style" attributes should load correctly, ignoring or migrating those attributes.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow the user to select a drawing resolution from a predefined list (e.g., 1mm, 5mm, 100mm, 1000mm) via a dropdown menu in the toolbar.
- **FR-001a**: The default drawing resolution MUST be set to 100mm on application start.
- **FR-002**: Drawing operations (wall creation, endpoint movement) MUST snap coordinates to the selected resolution.
- **FR-003**: Drawing operations MUST snap to existing points (vertices) when the cursor is within a threshold, overriding the resolution snap if necessary.
- **FR-004**: The system MUST NOT display a background grid on the canvas.
- **FR-005**: The canvas background color MUST be an off-white shade (e.g., #F9F9F9).
- **FR-006**: Wall edges MUST be rendered in a dark color (e.g., #2C2C2C).
- **FR-007**: The `Edge` data structure MUST NOT contain `thickness` or `style` attributes.
- **FR-008**: When a room is split by a new wall, the system MUST assign unique identifiers to the resulting rooms.
- **FR-009**: Room identifiers generated during splitting MUST be strictly sequential to the highest existing room ID (Max ID + 1), never reusing deleted IDs.

### Key Entities

- **Edge**: Represents a wall or boundary. Attributes: `start`, `end` (points). Removed: `thickness`, `style`.
- **Room**: Represents a detected enclosed space. Attributes: `id` (unique identifier), `polygon`.
- **DrawingSettings**: New entity/state to hold `resolution` (number).
