# Feature Specification: Core Floorplan Drawing & Export

**Feature Branch**: `001-floorplan-core`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Implement the feature specification based on the updated constitution. I want to build an application where the user can draw floorplans and ultimately export them to JSON and CSV. When the user is drawing, he is informed of the amount of rooms and the length of walls among other data concerning the floorplan."

## User Scenarios & Testing

### User Story 1 - Draw Walls and Create Rooms (Priority: P1)

As a user, I want to draw walls on a canvas by clicking points so that I can define the layout of a floorplan and create enclosed rooms.

**Why this priority**: This is the fundamental capability of the application. Without drawing walls, no other features (data analysis, export) are possible.

**Independent Test**: Can be tested by launching the app, drawing a series of connected lines, and verifying they visually form walls and enclosed spaces.

**Acceptance Scenarios**:

1. **Given** an empty canvas, **When** I click a start point and an end point, **Then** a wall segment is drawn between them.
2. **Given** an existing wall, **When** I start a new wall from one of its endpoints, **Then** the walls are connected at a shared vertex (corner).
3. **Given** a series of connected walls, **When** I connect the last wall back to the start point, **Then** the system recognizes the enclosed area as a "Room".
4. **Given** a drawing in progress, **When** I press the Escape key, **Then** the current unfinished wall segment is cancelled.

---

### User Story 2 - View Real-Time Floorplan Data (Priority: P2)

As a user, I want to see the length of walls and the total count of rooms while I am drawing, so that I can create accurate plans and track my progress.

**Why this priority**: Provides immediate feedback and value to the user, distinguishing the tool from a simple drawing app.

**Independent Test**: Can be tested by drawing walls of known lengths and closing loops, then observing the on-screen indicators.

**Acceptance Scenarios**:

1. **Given** a wall is drawn, **When** I look at the canvas, **Then** the length of that wall is displayed next to it.
2. **Given** I am modifying the floorplan (adding/removing walls), **When** a room is formed or destroyed, **Then** the "Total Rooms" counter updates immediately.
3. **Given** a closed room, **When** the room is detected, **Then** its approximate area is calculated and displayed (e.g., inside the room or in a side panel).

---

### User Story 3 - Export Floorplan Data (Priority: P3)

As a user, I want to export my floorplan to JSON and CSV formats so that I can save my work or use the data in other applications.

**Why this priority**: Allows data portability and integration, which is a key requirement.

**Independent Test**: Can be tested by creating a floorplan, clicking export buttons, and validating the structure/content of the downloaded files.

**Acceptance Scenarios**:

1. **Given** a floorplan with walls and rooms, **When** I click "Export JSON", **Then** a `.json` file is downloaded containing the full geometric representation (vertices, edges, surfaces).
2. **Given** a floorplan with walls and rooms, **When** I click "Export CSV", **Then** a `.csv` file is downloaded containing a summary of the floorplan (e.g., list of rooms with areas, list of walls with lengths).

### Edge Cases

- **Overlapping Walls**: System should handle or prevent walls that cross each other without creating a vertex.
- **Zero-length Walls**: System should prevent creating walls with start point == end point.
- **Complex Polygons**: Room detection should handle non-rectangular rooms (L-shapes, etc.).
- **Disconnected Graphs**: Export should handle multiple disjoint structures on the same canvas.

### Assumptions

- Users interact via a mouse or trackpad (touch support is out of scope for this iteration).
- The coordinate system origin (0,0) is at the top-left of the canvas.
- Wall thickness is uniform for this version.
- "Room" is defined strictly as a closed loop of walls.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to draw line segments (walls) by defining start and end vertices.
- **FR-002**: System MUST automatically snap new vertices to existing vertices within a reasonable threshold to ensure connectivity.
- **FR-003**: System MUST detect closed loops of walls and identify them as "Rooms" (Surfaces).
- **FR-004**: System MUST calculate and display the length of each wall segment in real-time.
- **FR-005**: System MUST calculate and display the total number of detected rooms in real-time.
- **FR-006**: System MUST calculate the area of each detected room.
- **FR-007**: System MUST provide an "Export JSON" function that serializes the current state (vertices, edges, rooms) to a standard JSON format.
- **FR-008**: System MUST provide an "Export CSV" function that generates a tabular report of the floorplan data (e.g., Room Name, Area, Wall Count).
- **FR-009**: System MUST allow users to clear the canvas to start over.

### Key Entities

- **Vertex**: A point in 2D space (x, y) representing a wall corner or endpoint.
- **Edge (Wall)**: A connection between two Vertices, having properties like length and thickness.
- **Surface (Room)**: A closed region bounded by a set of Edges, having properties like Area.
- **Floorplan**: The collection of all Vertices, Edges, and Surfaces.

## Success Criteria

- **Usability**: A new user can draw a simple 4-wall room and see the room count increment to 1 within 30 seconds.
- **Accuracy**: Wall lengths displayed match the geometric distance between vertices.
- **Data Integrity**: Exported JSON can be parsed and contains all entities visible on the canvas.
- **Performance**: Real-time updates (lengths, room count) occur without noticeable lag (< 16ms frame time) for floorplans with up to 100 walls.
