# Quickstart: Core Floorplan Feature

## Prerequisites
- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Running the Application

```bash
npm run dev
```
Access the app at `http://localhost:5173`.

## Usage Guide

1.  **Select Tool**: Click the "Draw" icon in the toolbar.
2.  **Draw Wall**: Click on the canvas to start a wall, move mouse, click again to end.
3.  **Chain Walls**: Continue clicking to draw connected walls.
4.  **Close Room**: Click on the starting vertex to close the loop. The room count will increment.
5.  **Export**: Click the "Export JSON" or "Export CSV" button in the header.

## Testing

Run the unit tests for the graph logic:

```bash
npm test
```
