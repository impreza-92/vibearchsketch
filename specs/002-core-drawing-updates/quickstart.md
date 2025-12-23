# Quickstart: Core Drawing Updates

## Overview
This feature updates the core drawing experience by introducing variable resolution snapping, removing the visual grid, and ensuring robust room ID generation.

## Setup

1.  **Checkout Branch**: `git checkout 002-core-drawing-updates`
2.  **Install Dependencies**: `npm install` (No new dependencies, but good practice)

## Usage

### Changing Resolution
1.  Locate the dropdown in the toolbar (default: "100mm").
2.  Select a new resolution (e.g., "1000mm").
3.  Draw a wall; notice the cursor snaps to the new grid.

### Drawing Walls
1.  Click to start a wall.
2.  Move cursor.
    - **Grid Snap**: Cursor snaps to resolution increments.
    - **Vertex Snap**: Move close to an existing corner; cursor snaps to it.
3.  Click to finish.

### Splitting Rooms
1.  Draw a closed room (Room 1).
2.  Draw a wall that bisects the room.
3.  Observe that two new rooms are created with new IDs (e.g., Room 2, Room 3).

## Development

### Key Files
- `src/types/spatial.ts`: Updated `Edge` interface.
- `src/store/useSpatialStore.ts`: New `drawingSettings` slice.
- `src/utils/geometry.ts`: `getSnappedPoint` function.
- `src/utils/roomDetection.ts`: Updated ID generation logic.

### Testing
- Run unit tests: `npm run test`
- Verify `geometry.test.ts` for snapping logic.
- Verify `roomDetection.test.ts` for ID generation.
