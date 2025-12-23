import type { DrawingMode } from '../types/floorplan';
import { useFloorplan } from '../context/FloorplanContext';
import './Toolbar.css';

export const Toolbar = () => {
  const { state, dispatch, canUndo, canRedo, getUndoDescription, getRedoDescription } = useFloorplan();

  const setMode = (mode: DrawingMode) => {
    dispatch({ type: 'SET_MODE', mode });
  };

  const toggleSnapToGrid = () => {
    dispatch({ type: 'SET_SNAP_TO_GRID', enabled: !state.snapToGrid });
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  const handleRedo = () => {
    dispatch({ type: 'REDO' });
  };

  const handleClear = () => {
    if (confirm('Clear all walls? This action can be undone.')) {
      dispatch({ type: 'CLEAR_ALL' });
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Tools</h3>
        <button
          className={state.mode === 'draw' ? 'active' : ''}
          onClick={() => setMode('draw')}
          title="Draw walls (D)"
        >
          ✏️ Draw
        </button>
        <button
          className={state.mode === 'select' ? 'active' : ''}
          onClick={() => setMode('select')}
          title="Select and edit (S)"
        >
          👆 Select
        </button>
        <button
          className={state.mode === 'pan' ? 'active' : ''}
          onClick={() => setMode('pan')}
          title="Pan view (Space)"
        >
          ✋ Pan
        </button>
        <button
          className={state.mode === 'erase' ? 'active' : ''}
          onClick={() => setMode('erase')}
          title="Erase walls (E)"
        >
          🗑️ Erase
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Options</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.snapToGrid}
            onChange={toggleSnapToGrid}
          />
          Snap to Grid
        </label>
        <label className="input-label">
          Grid Size:
          <input
            type="number"
            value={state.gridSize}
            onChange={(e) =>
              dispatch({
                type: 'SET_GRID_SIZE',
                size: parseInt(e.target.value) || 10,
              })
            }
            min="5"
            max="50"
            step="5"
          />
        </label>
      </div>

      <div className="toolbar-section">
        <h3>Measurements</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.measurement.showMeasurements}
            onChange={(e) =>
              dispatch({
                type: 'SET_SHOW_MEASUREMENTS',
                show: e.target.checked,
              })
            }
          />
          Show Lengths
        </label>
        <label className="input-label">
          Scale:
          <input
            type="number"
            value={state.measurement.pixelsPerMm}
            onChange={(e) =>
              dispatch({
                type: 'SET_PIXELS_PER_MM',
                value: parseFloat(e.target.value) || 0.1,
              })
            }
            min="0.01"
            max="10"
            step="0.01"
            title="Pixels per millimeter"
          />
          px/mm
        </label>
      </div>

      <div className="toolbar-section">
        <h3>Edit</h3>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title={canUndo ? `Undo: ${getUndoDescription()}` : 'Nothing to undo'}
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title={canRedo ? `Redo: ${getRedoDescription()}` : 'Nothing to redo'}
        >
          ↷ Redo
        </button>
        <button onClick={handleClear} className="danger" title="Clear all">
          🗑️ Clear All
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Info</h3>
        <div className="info-text">
          Walls: {state.walls.size}
        </div>
        <div className="info-text">
          Points: {state.points.size}
        </div>
        <div className="info-text">
          Rooms: {state.rooms.size}
        </div>
        <div className="info-text">
          Mode: {state.mode}
        </div>
      </div>
    </div>
  );
};
