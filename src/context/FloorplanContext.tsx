import { createContext, useContext, useReducer, useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  FloorplanState,
  FloorplanAction,
  Wall,
} from '../types/floorplan';
import { generateId } from '../utils/geometry';
import { FloorplanGraph } from '../utils/floorplanGraph';
import {
  CommandHistory,
  AddPointCommand,
  DrawWallCommand,
  AddWallCommand,
  RemoveWallCommand,
  SplitWallCommand,
  AddRoomCommand,
  UpdateRoomCommand,
  RemoveRoomCommand,
  DetectRoomsCommand,
  ClearAllCommand,
  type CommandState,
} from '../utils/commands';

// Initial state with FloorplanGraph
const initialGraph = new FloorplanGraph();

const initialState: FloorplanState = {
  points: initialGraph.getPoints(),
  walls: initialGraph.getWalls(),
  rooms: initialGraph.getRooms(),
  selectedIds: new Set(),
  mode: 'draw',
  gridSize: 10,
  snapToGrid: true,
  measurement: {
    pixelsPerMm: 0.1, // 0.1 pixels = 1mm, so 10px = 100mm (10cm)
    showMeasurements: true, // Show wall lengths by default
  },
};

// Convert FloorplanState to CommandState
const toCommandState = (state: FloorplanState, graph: FloorplanGraph): CommandState => ({
  graph,
  selectedIds: state.selectedIds,
});

// Apply CommandState changes to FloorplanState
const fromCommandState = (
  state: FloorplanState,
  commandState: CommandState
): FloorplanState => ({
  ...state,
  points: commandState.graph.getPoints(),
  walls: commandState.graph.getWalls(),
  rooms: commandState.graph.getRooms(),
  selectedIds: commandState.selectedIds,
});

// Create a command history instance (will be stored in ref in the provider)
let commandHistory: CommandHistory;
// Store the current graph instance
let currentGraph: FloorplanGraph = new FloorplanGraph();

// Reducer
const floorplanReducer = (
  state: FloorplanState,
  action: FloorplanAction
): FloorplanState => {
  switch (action.type) {
    case 'ADD_POINT': {
      const command = new AddPointCommand(action.point);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'DRAW_WALL': {
      const command = new DrawWallCommand(
        action.startPoint,
        action.endPoint,
        action.wall,
        action.startPointExists,
        action.endPointExists
      );
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'ADD_WALL': {
      const command = new AddWallCommand(action.wall);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'REMOVE_WALL': {
      const command = new RemoveWallCommand(action.wallId);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'SPLIT_WALL': {
      // Get the wall to split
      const wallToSplit = state.walls.get(action.wallId);
      if (!wallToSplit) return state;

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

      const command = new SplitWallCommand(
        action.wallId,
        action.splitPoint,
        wall1,
        wall2
      );
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'ADD_ROOM': {
      const command = new AddRoomCommand(action.room);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'UPDATE_ROOM': {
      const command = new UpdateRoomCommand(action.roomId, action.updates);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'REMOVE_ROOM': {
      const command = new RemoveRoomCommand(action.roomId);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'DETECT_ROOMS': {
      const command = new DetectRoomsCommand();
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
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
      const newCommandState = commandHistory.undo(toCommandState(state, currentGraph));
      if (!newCommandState) return state;
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'REDO': {
      const newCommandState = commandHistory.redo(toCommandState(state, currentGraph));
      if (!newCommandState) return state;
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'CLEAR_ALL': {
      const command = new ClearAllCommand();
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    default:
      return state;
  }
};

// Context
interface FloorplanContextType {
  state: FloorplanState;
  dispatch: React.Dispatch<FloorplanAction>;
  canUndo: boolean;
  canRedo: boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const FloorplanContext = createContext<FloorplanContextType | null>(null);

// Provider
export const FloorplanProvider = ({ children }: { children: ReactNode }) => {
  const historyRef = useRef<CommandHistory>(new CommandHistory());
  const [state, dispatch] = useReducer(floorplanReducer, initialState);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize the command history for the reducer
  // This is a workaround since reducers can't access refs directly
  commandHistory = historyRef.current;

  // Update can undo/redo status when state changes
  useEffect(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, [state]);

  const contextValue: FloorplanContextType = {
    state,
    dispatch,
    canUndo,
    canRedo,
    getUndoDescription: () => historyRef.current.getUndoDescription(),
    getRedoDescription: () => historyRef.current.getRedoDescription(),
  };

  return (
    <FloorplanContext value={contextValue}>{children}</FloorplanContext>
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
