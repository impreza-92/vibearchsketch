import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  FloorplanState,
  FloorplanAction,
  FloorplanSnapshot,
  Wall,
} from '../types/floorplan';
import { detectRooms, updateRoomProperties } from '../utils/roomDetection';
import { generateId } from '../utils/geometry';

// Initial state
const initialState: FloorplanState = {
  points: new Map(),
  walls: new Map(),
  rooms: new Map(),
  selectedIds: new Set(),
  mode: 'draw',
  gridSize: 10,
  snapToGrid: true,
  measurement: {
    pixelsPerMm: 0.1, // 0.1 pixels = 1mm, so 10px = 100mm (10cm)
    showMeasurements: true, // Show wall lengths by default
  },
  history: [],
  historyIndex: -1,
};

// Create snapshot for undo/redo
const createSnapshot = (state: FloorplanState): FloorplanSnapshot => ({
  points: new Map(state.points),
  walls: new Map(state.walls),
  rooms: new Map(state.rooms),
  selectedIds: new Set(state.selectedIds),
});

// Restore from snapshot
const restoreSnapshot = (
  state: FloorplanState,
  snapshot: FloorplanSnapshot
): FloorplanState => ({
  ...state,
  points: new Map(snapshot.points),
  walls: new Map(snapshot.walls),
  rooms: new Map(snapshot.rooms),
  selectedIds: new Set(snapshot.selectedIds),
});

// Reducer
const floorplanReducer = (
  state: FloorplanState,
  action: FloorplanAction
): FloorplanState => {
  switch (action.type) {
    case 'ADD_POINT': {
      const newPoints = new Map(state.points);
      newPoints.set(action.point.id, action.point);

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        points: newPoints,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'ADD_WALL': {
      const newWalls = new Map(state.walls);
      newWalls.set(action.wall.id, action.wall);

      // Check for new rooms after adding the wall
      const newRooms = new Map(state.rooms);
      const detectedRooms = detectRooms(state.points, newWalls, state.rooms);
      detectedRooms.forEach(room => {
        newRooms.set(room.id, room);
      });

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        walls: newWalls,
        rooms: newRooms,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'REMOVE_WALL': {
      const newWalls = new Map(state.walls);
      newWalls.delete(action.wallId);

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        walls: newWalls,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'SPLIT_WALL': {
      // Get the wall to split
      const wallToSplit = state.walls.get(action.wallId);
      if (!wallToSplit) return state;

      const newPoints = new Map(state.points);
      const newWalls = new Map(state.walls);
      const newRooms = new Map(state.rooms);

      // Add the split point
      newPoints.set(action.splitPoint.id, action.splitPoint);

      // Remove the original wall
      newWalls.delete(action.wallId);

      // Create two new walls
      const wall1: Wall = {
        id: generateId(),
        startPointId: wallToSplit.startPointId,
        endPointId: action.splitPoint.id,
        thickness: wallToSplit.thickness,
        style: wallToSplit.style,
      };

      const wall2: Wall = {
        id: generateId(),
        startPointId: action.splitPoint.id,
        endPointId: wallToSplit.endPointId,
        thickness: wallToSplit.thickness,
        style: wallToSplit.style,
      };

      newWalls.set(wall1.id, wall1);
      newWalls.set(wall2.id, wall2);

      // Update rooms that reference the split wall
      newRooms.forEach((room, roomId) => {
        if (room.wallIds.includes(action.wallId)) {
          // Replace old wall ID with two new wall IDs
          const updatedWallIds = room.wallIds.map((id) =>
            id === action.wallId ? [wall1.id, wall2.id] : [id]
          ).flat();

          // Update wall IDs and recalculate centroid and area
          const updatedRoom = {
            ...room,
            wallIds: updatedWallIds,
          };
          
          // Recalculate centroid and area based on new wall configuration
          const roomWithNewProps = updateRoomProperties(updatedRoom, newPoints, newWalls);
          newRooms.set(roomId, roomWithNewProps);
        }
      });

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        points: newPoints,
        walls: newWalls,
        rooms: newRooms,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'ADD_ROOM': {
      const newRooms = new Map(state.rooms);
      newRooms.set(action.room.id, action.room);

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        rooms: newRooms,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'UPDATE_ROOM': {
      const room = state.rooms.get(action.roomId);
      if (!room) return state;

      const newRooms = new Map(state.rooms);
      newRooms.set(action.roomId, { ...room, ...action.updates });

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        rooms: newRooms,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'REMOVE_ROOM': {
      const newRooms = new Map(state.rooms);
      newRooms.delete(action.roomId);

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        rooms: newRooms,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'DETECT_ROOMS': {
      // Detect all rooms in the current floorplan
      const detectedRooms = detectRooms(state.points, state.walls, state.rooms);
      
      if (detectedRooms.length === 0) return state;

      const newRooms = new Map(state.rooms);
      detectedRooms.forEach(room => {
        newRooms.set(room.id, room);
      });

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...state,
        rooms: newRooms,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'SELECT': {
      return {
        ...state,
        selectedIds: new Set(action.ids),
      };
    }

    case 'DESELECT_ALL': {
      return {
        ...state,
        selectedIds: new Set(),
      };
    }

    case 'SET_MODE': {
      return {
        ...state,
        mode: action.mode,
        selectedIds: new Set(), // Clear selection when changing modes
      };
    }

    case 'SET_SNAP_TO_GRID': {
      return {
        ...state,
        snapToGrid: action.enabled,
      };
    }

    case 'SET_GRID_SIZE': {
      return {
        ...state,
        gridSize: action.size,
      };
    }

    case 'SET_PIXELS_PER_MM': {
      return {
        ...state,
        measurement: {
          ...state.measurement,
          pixelsPerMm: action.value,
        },
      };
    }

    case 'SET_SHOW_MEASUREMENTS': {
      return {
        ...state,
        measurement: {
          ...state.measurement,
          showMeasurements: action.show,
        },
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;

      const snapshot = state.history[state.historyIndex - 1];
      return {
        ...restoreSnapshot(state, snapshot),
        historyIndex: state.historyIndex - 1,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;

      const snapshot = state.history[state.historyIndex + 1];
      return {
        ...restoreSnapshot(state, snapshot),
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'CLEAR_ALL': {
      // Add to history before clearing
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state));

      return {
        ...initialState,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    default:
      return state;
  }
};

// Context
interface FloorplanContextType {
  state: FloorplanState;
  dispatch: React.Dispatch<FloorplanAction>;
}

const FloorplanContext = createContext<FloorplanContextType | null>(null);

// Provider
export const FloorplanProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(floorplanReducer, initialState);

  return (
    <FloorplanContext value={{ state, dispatch }}>{children}</FloorplanContext>
  );
};

// Hook
export const useFloorplan = () => {
  const context = useContext(FloorplanContext);
  if (!context) {
    throw new Error('useFloorplan must be used within FloorplanProvider');
  }
  return context;
};
