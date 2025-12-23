import React from 'react';
import { useSpatialStore } from '../store/useSpatialStore';
import { generateJSON, generateCSV } from '../utils/export';
import { ClearCanvasCommand } from '../utils/commands';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const mode = useSpatialStore((state) => state.mode);
  const snapToGrid = useSpatialStore((state) => state.snapToGrid);
  const setMode = useSpatialStore((state) => state.setMode);
  const setSnapToGrid = useSpatialStore((state) => state.setSnapToGrid);
  const undo = useSpatialStore((state) => state.undo);
  const redo = useSpatialStore((state) => state.redo);
  const dispatch = useSpatialStore((state) => state.dispatch);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      dispatch(new ClearCanvasCommand());
    }
  };

  const handleExportJSON = () => {
    const graph = useSpatialStore.getState().graph;
    const json = generateJSON(graph);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const graph = useSpatialStore.getState().graph;
    const measurement = useSpatialStore.getState().measurement;
    const { walls, rooms } = generateCSV(graph, measurement.pixelsPerMm);
    
    // Download Walls
    const blobWalls = new Blob([walls], { type: 'text/csv' });
    const urlWalls = URL.createObjectURL(blobWalls);
    const aWalls = document.createElement('a');
    aWalls.href = urlWalls;
    aWalls.download = 'walls.csv';
    aWalls.click();
    URL.revokeObjectURL(urlWalls);

    // Download Rooms
    const blobRooms = new Blob([rooms], { type: 'text/csv' });
    const urlRooms = URL.createObjectURL(blobRooms);
    const aRooms = document.createElement('a');
    aRooms.href = urlRooms;
    aRooms.download = 'rooms.csv';
    aRooms.click();
    URL.revokeObjectURL(urlRooms);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={mode === 'draw' ? 'active' : ''}
          onClick={() => setMode('draw')}
          title="Draw Wall (W)"
        >
          Draw
        </button>
        <button
          className={mode === 'select' ? 'active' : ''}
          onClick={() => setMode('select')}
          title="Select (V)"
        >
          Select
        </button>
        <button
          className={mode === 'erase' ? 'active' : ''}
          onClick={() => setMode('erase')}
          title="Erase (E)"
        >
          Erase
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={undo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button onClick={redo} title="Redo (Ctrl+Y)">
          Redo
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
          />
          Snap to Grid
        </label>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={handleExportJSON} title="Export as JSON">
          JSON
        </button>
        <button onClick={handleExportCSV} title="Export as CSV">
          CSV
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={handleClear} title="Clear Canvas" className="danger">
          Clear
        </button>
      </div>
    </div>
  );
};
