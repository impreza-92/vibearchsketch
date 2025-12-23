import { createContext, useContext, useReducer, useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  SpatialState,
  SpatialAction,
  Edge,
} from '../types/spatial';
import { generateId } from '../utils/geometry';
import { SpatialGraph } from '../utils/spatialGraph';
import {
  CommandHistory,
  AddVertexCommand,
  DrawEdgeCommand,
  AddEdgeCommand,
  RemoveEdgeCommand,
  SplitEdgeCommand,
  AddSurfaceCommand,
  UpdateSurfaceCommand,
  RemoveSurfaceCommand,
  DetectSurfacesCommand,
  ClearAllCommand,
  type CommandState,
} from '../utils/commands';

// Initial state with SpatialGraph
const initialGraph = new SpatialGraph();

const initialState: SpatialState = {
  vertices: initialGraph.getVertices(),
  edges: initialGraph.getEdges(),
  surfaces: initialGraph.getSurfaces(),
  selectedIds: new Set(),
  mode: 'draw',
  gridSize: 10,
  snapToGrid: true,
  measurement: {
    pixelsPerMm: 0.1, // 0.1 pixels = 1mm, so 10px = 100mm (10cm)
    showMeasurements: true, // Show edge lengths by default
  },
};

// Convert SpatialState to CommandState
const toCommandState = (state: SpatialState, graph: SpatialGraph): CommandState => ({
  graph,
  selectedIds: state.selectedIds,
});

// Apply CommandState changes to SpatialState
const fromCommandState = (
  state: SpatialState,
  commandState: CommandState
): SpatialState => ({
  ...state,
  vertices: commandState.graph.getVertices(),
  edges: commandState.graph.getEdges(),
  surfaces: commandState.graph.getSurfaces(),
  selectedIds: commandState.selectedIds,
});

// Create a command history instance (will be stored in ref in the provider)
let commandHistory: CommandHistory;
// Store the current graph instance
let currentGraph: SpatialGraph = new SpatialGraph();

// Reducer
const spatialReducer = (
  state: SpatialState,
  action: SpatialAction
): SpatialState => {
  switch (action.type) {
    case 'ADD_VERTEX': {
      const command = new AddVertexCommand(action.vertex);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'DRAW_EDGE': {
      const command = new DrawEdgeCommand(
        action.startVertex,
        action.endVertex,
        action.edge,
        action.startVertexExists,
        action.endVertexExists
      );
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'ADD_EDGE': {
      const command = new AddEdgeCommand(action.edge);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'REMOVE_EDGE': {
      const command = new RemoveEdgeCommand(action.edgeId);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'SPLIT_EDGE': {
      // Get the edge to split
      const edgeToSplit = state.edges.get(action.edgeId);
      if (!edgeToSplit) return state;

      // Create two new edges
      const edge1: Edge = {
        id: generateId(),
        startVertexId: edgeToSplit.startVertexId,
        endVertexId: action.splitVertex.id,
        thickness: edgeToSplit.thickness,
        style: edgeToSplit.style,
      };

      const edge2: Edge = {
        id: generateId(),
        startVertexId: action.splitVertex.id,
        endVertexId: edgeToSplit.endVertexId,
        thickness: edgeToSplit.thickness,
        style: edgeToSplit.style,
      };

      const command = new SplitEdgeCommand(
        action.edgeId,
        action.splitVertex,
        edge1,
        edge2
      );
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'ADD_SURFACE': {
      const command = new AddSurfaceCommand(action.surface);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'UPDATE_SURFACE': {
      const command = new UpdateSurfaceCommand(action.surfaceId, action.updates);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'REMOVE_SURFACE': {
      const command = new RemoveSurfaceCommand(action.surfaceId);
      const newCommandState = commandHistory.execute(command, toCommandState(state, currentGraph));
      currentGraph = newCommandState.graph;
      return fromCommandState(state, newCommandState);
    }

    case 'DETECT_SURFACES': {
      const command = new DetectSurfacesCommand();
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
interface SpatialContextType {
  state: SpatialState;
  dispatch: React.Dispatch<SpatialAction>;
  canUndo: boolean;
  canRedo: boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const SpatialContext = createContext<SpatialContextType | null>(null);

// Provider
export const SpatialProvider = ({ children }: { children: ReactNode }) => {
  const historyRef = useRef<CommandHistory>(new CommandHistory());
  const [state, dispatch] = useReducer(spatialReducer, initialState);
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

  const contextValue: SpatialContextType = {
    state,
    dispatch,
    canUndo,
    canRedo,
    getUndoDescription: () => historyRef.current.getUndoDescription(),
    getRedoDescription: () => historyRef.current.getRedoDescription(),
  };

  return (
    <SpatialContext value={contextValue}>{children}</SpatialContext>
  );
};

// Hook
export const useSpatial = () => {
  const context = useContext(SpatialContext);
  if (!context) {
    throw new Error('useSpatial must be used within SpatialProvider');
  }
  return context;
};
