# Floorplan Drawing App

A modern web-based floorplan drawing application built with React 19, TypeScript, and Pixi.js.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)
![Pixi.js](https://img.shields.io/badge/Pixi.js-8.x-ff69b4.svg)

## ✨ Features

- **Interactive Wall Drawing** - Click-to-place points to create walls
- **Grid Snapping** - Toggle-able grid snapping for precision
- **Multiple Drawing Modes** - Draw, Select, Pan, and Erase tools
- **Undo/Redo** - Full history support for all operations
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

### Drawing Walls

1. Click the **✏️ Draw** button in the toolbar
2. Click on the canvas to place the first point
3. Move your mouse to see a preview of the wall
4. Click again to place the second point and create the wall
5. The wall is complete - next click starts a new wall
6. To connect walls, click on an existing endpoint when starting or ending a wall
7. The app automatically snaps to existing points within 10 pixels
8. Press `Escape` to cancel a wall in progress

### Options

- **Snap to Grid** - Toggle grid snapping on/off
- **Grid Size** - Adjust grid spacing (5-50 pixels)
- **Undo** - Undo last action
- **Redo** - Redo undone action
- **Clear All** - Remove all walls

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
│   └── FloorplanContext.tsx
├── types/              # TypeScript type definitions
│   └── floorplan.ts
├── utils/              # Utility functions
│   └── geometry.ts     # Math helpers
├── App.tsx             # Root component
└── main.tsx           # Entry point
```

## 📚 Documentation

Comprehensive documentation available in the `documentation/` folder:

- [**ARCHITECTURE.md**](./documentation/ARCHITECTURE.md) - System design and technical decisions
- [**DESIGN_DECISIONS.md**](./documentation/DESIGN_DECISIONS.md) - Rationale behind choices
- [**IMPLEMENTATION_GUIDE.md**](./documentation/IMPLEMENTATION_GUIDE.md) - Development guide and patterns

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
