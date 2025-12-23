import React from 'react';
import { useSpatialStore } from '../store/useSpatialStore';
import { generateJSON, generateCSV } from '../utils/export';
import { ClearCanvasCommand } from '../utils/commands';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const mode = useSpatialStore((state) => state.mode);
  const drawingSettings = useSpatialStore((state) => state.drawingSettings);
  const setMode = useSpatialStore((state) => state.setMode);
  const setResolution = useSpatialStore((state) => state.setResolution);
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
        <label className="toolbar-label" htmlFor="resolution-select" style={{ marginRight: '8px', color: '#ccc' }}>Res:</label>
        <select
          id="resolution-select"
          value={drawingSettings.resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          className="toolbar-select"
          title="Snapping Resolution"
          style={{ padding: '4px', borderRadius: '4px', background: '#333', color: 'white', border: '1px solid #555' }}
        >
          <option value={1}>1 mm</option>
          <option value={5}>5 mm</option>
          <option value={10}>10 mm</option>
          <option value={50}>50 mm</option>
          <option value={100}>100 mm</option>
          <option value={500}>500 mm</option>
          <option value={1000}>1000 mm</option>
        </select>
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
