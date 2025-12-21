import { FloorplanProvider } from './context/FloorplanContext';
import { PixiCanvas } from './components/PixiCanvas';
import { Toolbar } from './components/Toolbar';
import './App.css';

function App() {
  return (
    <FloorplanProvider>
      <div className="app">
        <Toolbar />
        <main className="canvas-container">
          <PixiCanvas />
        </main>
      </div>
    </FloorplanProvider>
  );
}

export default App;
