# Floorplan Drawing App

A modern web-based floorplan drawing application built with React 19, TypeScript, and Pixi.js.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)
![Pixi.js](https://img.shields.io/badge/Pixi.js-8.x-ff69b4.svg)

## ✨ Features

- **Interactive Edge Drawing** - Click-to-place vertices to create edges
- **Smart Edge Splitting** - Click on existing edges to split them and create connections
- **Automatic Surface Detection** - Surfaces (rooms) are automatically detected and labeled
- **Grid Snapping** - Toggle-able grid snapping for precision
- **Multiple Drawing Modes** - Draw, Select, Pan, and Erase tools
- **Robust Undo/Redo** - Command pattern implementation for reliable history
- **Measurement Display** - Real-time edge length measurements
- **Responsive Canvas** - Resizes automatically with window
- **Type-Safe** - Built with TypeScript for reliability
- **High Performance** - Hardware-accelerated rendering with Pixi.js WebGL

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with WebGL support

### Installation

```bash
# Clone or navigate to the project
cd vibearchsketch

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎨 Usage

### Drawing Edges

1. Click the **✏️ Draw** button in the toolbar
2. Click on the canvas to place the first vertex
3. Move your mouse to see a preview of the edge
4. Click again to place the second vertex and create the edge
5. The edge is complete - next click starts a new edge
6. To connect edges, click on an existing vertex when starting or ending an edge
7. The app automatically snaps to existing vertices within 10 pixels
8. Press `Escape` to cancel an edge in progress

### Options

- **Snap to Grid** - Toggle grid snapping on/off
- **Grid Size** - Adjust grid spacing (5-50 pixels)
- **Show Lengths** - Toggle edge measurement display
- **Scale** - Adjust measurement scale (pixels per millimeter)
- **Undo** (`Ctrl+Z` / `Cmd+Z`) - Undo last action with tooltip showing action description
- **Redo** (`Ctrl+Y` / `Cmd+Shift+Z`) - Redo undone action with tooltip showing action description
- **Clear All** - Remove all edges (can be undone)

## 🏗️ Architecture

### Technology Stack

- **React 19.2** - UI framework with modern hooks
- **TypeScript 5.6** - Type safety and developer experience
- **Pixi.js 8.x** - WebGL-powered 2D rendering
- **Vite** - Fast build tool and dev server

### Project Structure

```
src/
├── components/          # React components
│   ├── PixiCanvas.tsx  # Main Pixi.js canvas
│   └── Toolbar.tsx     # Drawing tools toolbar
├── context/            # React Context for state
│   └── SpatialContext.tsx
├── types/              # TypeScript type definitions
│   └── spatial.ts
├── utils/              # Utility functions
│   ├── commands.ts     # Command pattern implementation
│   ├── geometry.ts     # Math helpers
│   ├── measurements.ts # Measurement formatting
│   └── spatialGraph.ts # Graph data structure & surface detection
├── App.tsx             # Root component
└── main.tsx           # Entry point
```

## 📚 Documentation

Comprehensive documentation available in the `documentation/` folder:

- [**ARCHITECTURE.md**](./documentation/ARCHITECTURE.md) - System design and technical decisions
- [**DESIGN_DECISIONS.md**](./documentation/DESIGN_DECISIONS.md) - Rationale behind choices
- [**IMPLEMENTATION_GUIDE.md**](./documentation/IMPLEMENTATION_GUIDE.md) - Development guide and patterns
- [**COMMAND_PATTERN.md**](./documentation/COMMAND_PATTERN.md) - Undo/Redo implementation details
- [**EDGE_SPLITTING.md**](./documentation/EDGE_SPLITTING.md) - Wall splitting algorithm
- [**ROOM_DETECTION.md**](./documentation/ROOM_DETECTION.md) - Automatic room detection
- [**MEASUREMENTS.md**](./documentation/MEASUREMENTS.md) - Measurement system

## 🎯 Roadmap

### ✅ Phase 1 - Foundation (Current)
- [x] Basic Pixi.js canvas setup
- [x] Wall drawing with click-to-place
- [x] Grid with snapping
- [x] Toolbar with mode switching
- [x] Undo/redo functionality

### 🔄 Phase 2 - Selection & Editing
- [ ] Selection mode with hit detection
- [ ] Move and edit walls
- [ ] Properties panel
- [ ] Delete selected elements

### 📋 Phase 3 - Advanced Features
- [ ] Room detection from walls
- [ ] Measurement tools
- [ ] Pan and zoom controls
- [ ] Save/load JSON files
- [ ] Export to SVG/PNG

---

**Made with ❤️ using React, TypeScript, and Pixi.js**
