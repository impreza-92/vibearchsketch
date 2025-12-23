# Data Model: Core Drawing Updates

## Entities

### Edge (Updated)
Represents a wall segment between two vertices.
*Removed `thickness` and `style` attributes.*

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (UUID). |
| `startVertexId` | `string` | ID of the start vertex. |
| `endVertexId` | `string` | ID of the end vertex. |

### DrawingSettings (New)
Global settings for the drawing tool.

| Field | Type | Description |
|-------|------|-------------|
| `resolution` | `number` | Snapping resolution in millimeters (e.g., 100). |

### Room (Logic Update)
Represents a detected enclosed space.
*Schema unchanged, but ID generation logic updated.*

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier. Format: `room-{number}`. |
| `edgeIds` | `string[]` | List of Edge IDs forming the boundary. |

## State Management

### Store: `useSpatialStore`
- **State**:
    - `edges`: `Record<string, Edge>` (Updated schema)
    - `drawingSettings`: `DrawingSettings` (New)
- **Actions**:
    - `setResolution(resolution: number)`
    - `updateRoomIds(rooms: Room[])` (Implements the signature matching logic)

## Validation Rules

1.  **Edge Connectivity**: An Edge must always connect two valid Vertices.
2.  **Room ID Sequence**: New Room IDs must be strictly greater than the highest previously assigned ID.
3.  **Resolution**: Must be a positive integer.
