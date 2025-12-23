import { useEffect } from 'react';
import { useSpatialStore } from './store/useSpatialStore';
import { PixiCanvas } from './components/PixiCanvas';
import { Toolbar } from './components/Toolbar';
import { StatsPanel } from './components/StatsPanel';
import './App.css';

function App() {
  const undo = useSpatialStore((state) => state.undo);
  const redo = useSpatialStore((state) => state.redo);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="app">
      <Toolbar />
      <main className="canvas-container">
        <PixiCanvas />
        <StatsPanel />
      </main>
    </div>
  );
}

export default App;
