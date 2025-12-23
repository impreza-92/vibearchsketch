import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SpatialGraph } from '../utils/spatialGraph';
import { CommandManager } from '../utils/commands';
import type { Command, CommandState } from '../utils/commands';
import { enableMapSet, current, isDraft } from 'immer';
import type { DrawingMode } from '../types/spatial';

enableMapSet();

interface SpatialState {
  graph: SpatialGraph;
  commandManager: CommandManager;
  selectedIds: Set<string>;
  mode: DrawingMode;
  snapToGrid: boolean;
  gridSize: number;
  measurement: {
    pixelsPerMm: number;
    showMeasurements: boolean;
  };
  
  // Actions
  dispatch: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  select: (ids: string[]) => void;
  clearSelection: () => void;
  setMode: (mode: DrawingMode) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setMeasurement: (settings: Partial<{ pixelsPerMm: number; showMeasurements: boolean }>) => void;
}

export const useSpatialStore = create<SpatialState>()(
  immer((set) => ({
    graph: new SpatialGraph(),
    commandManager: new CommandManager(),
    selectedIds: new Set(),
    mode: 'draw',
    snapToGrid: true,
    gridSize: 20,
    measurement: {
      pixelsPerMm: 0.1,
      showMeasurements: true,
    },

    dispatch: (command: Command) => {
      set((state) => {
        const cmdState: CommandState = {
          graph: isDraft(state.graph) ? (current(state.graph) as SpatialGraph) : (state.graph as unknown as SpatialGraph),
          selectedIds: isDraft(state.selectedIds) ? current(state.selectedIds) : (state.selectedIds as unknown as Set<string>),
        };

        const resultState = state.commandManager.execute(command, cmdState);
        
        state.graph = resultState.graph as any;
        state.selectedIds = resultState.selectedIds as any;
      });
    },

    undo: () => {
      set((state) => {
        const cmdState: CommandState = {
          graph: isDraft(state.graph) ? (current(state.graph) as SpatialGraph) : (state.graph as unknown as SpatialGraph),
          selectedIds: isDraft(state.selectedIds) ? current(state.selectedIds) : (state.selectedIds as unknown as Set<string>),
        };
        
        const resultState = state.commandManager.undo(cmdState);
        
        state.graph = resultState.graph as any;
        state.selectedIds = resultState.selectedIds as any;
      });
    },

    redo: () => {
      set((state) => {
        const cmdState: CommandState = {
          graph: isDraft(state.graph) ? (current(state.graph) as SpatialGraph) : (state.graph as unknown as SpatialGraph),
          selectedIds: isDraft(state.selectedIds) ? current(state.selectedIds) : (state.selectedIds as unknown as Set<string>),
        };
        
        const resultState = state.commandManager.redo(cmdState);
        
        state.graph = resultState.graph as any;
        state.selectedIds = resultState.selectedIds as any;
      });
    },

    select: (ids: string[]) => {
      set((state) => {
        state.selectedIds = new Set(ids);
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedIds.clear();
      });
    },

    setMode: (mode) => {
      set((state) => {
        state.mode = mode;
      });
    },

    setSnapToGrid: (enabled) => {
      set((state) => {
        state.snapToGrid = enabled;
      });
    },

    setGridSize: (size) => {
      set((state) => {
        state.gridSize = size;
      });
    },

    setMeasurement: (settings) => {
      set((state) => {
        state.measurement = { ...state.measurement, ...settings };
      });
    },
  }))
);
