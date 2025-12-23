import { useEffect } from 'react';
import { SpatialProvider, useSpatial } from './context/SpatialContext';
import { PixiCanvas } from './components/PixiCanvas';
import { Toolbar } from './components/Toolbar';
import './App.css';

function AppContent() {
  const { dispatch } = useSpatial();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <div className="app">
      <Toolbar />
      <main className="canvas-container">
        <PixiCanvas />
      </main>
    </div>
  );
}

function App() {
  return (
    <SpatialProvider>
      <AppContent />
    </SpatialProvider>
  );
}

export default App;
