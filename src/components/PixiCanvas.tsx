import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useFloorplan } from '../context/FloorplanContext';
import type { Point, Wall } from '../types/floorplan';
import { snapToGrid, generateId, isNearPoint } from '../utils/geometry';

export const PixiCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const wallsGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const previewGraphicsRef = useRef<PIXI.Graphics | null>(null);

  const { state, dispatch } = useFloorplan();
  const [tempStartPoint, setTempStartPoint] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Pixi.js
  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;
    const app = new PIXI.Application();

    (async () => {
      // Get container dimensions
      const container = canvasRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Initialize the application
      await app.init({
        width,
        height,
        background: 0x1e1e1e,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!mounted || !canvasRef.current) return;

      appRef.current = app;
      canvasRef.current.appendChild(app.canvas);

      // Create graphics layers
      const gridGraphics = new PIXI.Graphics();
      gridGraphicsRef.current = gridGraphics;
      app.stage.addChild(gridGraphics);

      const wallsGraphics = new PIXI.Graphics();
      wallsGraphicsRef.current = wallsGraphics;
      app.stage.addChild(wallsGraphics);

      const previewGraphics = new PIXI.Graphics();
      previewGraphicsRef.current = previewGraphics;
      app.stage.addChild(previewGraphics);

      // Enable interaction on stage
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      // Debug: Test if events work
      console.log('Canvas initialized, stage eventMode:', app.stage.eventMode);
      console.log('Stage hitArea:', app.stage.hitArea);

      // Draw initial grid
      drawGrid(gridGraphics, app.screen.width, app.screen.height, state.gridSize);
      
      // Mark as initialized so event handlers can attach
      setIsInitialized(true);
    })();

    // Handle resize
    const handleResize = () => {
      if (appRef.current?.renderer && canvasRef.current) {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        
        appRef.current.renderer.resize(width, height);
        if (gridGraphicsRef.current && appRef.current.screen) {
          drawGrid(
            gridGraphicsRef.current,
            appRef.current.screen.width,
            appRef.current.screen.height,
            state.gridSize
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
      
      gridGraphicsRef.current = null;
      wallsGraphicsRef.current = null;
      previewGraphicsRef.current = null;
    };
  }, []);

  // Draw grid
  const drawGrid = (
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    gridSize: number
  ) => {
    graphics.clear();

    // Minor grid lines
    for (let x = 0; x <= width; x += gridSize) {
      graphics.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      graphics.moveTo(0, y).lineTo(width, y);
    }
    graphics.stroke({ width: 1, color: 0x2a2a2a, alpha: 1 });

    // Major grid lines (every 5 grid units)
    for (let x = 0; x <= width; x += gridSize * 5) {
      graphics.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize * 5) {
      graphics.moveTo(0, y).lineTo(width, y);
    }
    graphics.stroke({ width: 1, color: 0x3a3a3a, alpha: 1 });
  };

  // Render walls
  useEffect(() => {
    if (!wallsGraphicsRef.current) return;

    const graphics = wallsGraphicsRef.current;
    graphics.clear();

    // Draw all walls
    state.walls.forEach((wall: Wall) => {
      const startPoint = state.points.get(wall.startPointId);
      const endPoint = state.points.get(wall.endPointId);

      if (startPoint && endPoint) {
        const isSelected = state.selectedIds.has(wall.id);
        const color = isSelected ? 0x0078d4 : 0xffffff;

        // Draw wall line
        graphics
          .moveTo(startPoint.x, startPoint.y)
          .lineTo(endPoint.x, endPoint.y)
          .stroke({ width: wall.thickness, color, alpha: 1 });

        // Draw points
        graphics
          .circle(startPoint.x, startPoint.y, 4)
          .fill(color)
          .circle(endPoint.x, endPoint.y, 4)
          .fill(color);
      }
    });
  }, [state.walls, state.points, state.selectedIds]);

  // Handle mouse move
  useEffect(() => {
    if (!isInitialized || !appRef.current || !previewGraphicsRef.current) return;

    const app = appRef.current;
    const previewGraphics = previewGraphicsRef.current;

    const handleMouseMove = (event: PIXI.FederatedPointerEvent) => {
      console.log('Mouse move event triggered:', event.global);
      let { x, y } = event.global;

      // Snap to grid if enabled
      if (state.snapToGrid) {
        const snapped = snapToGrid({ id: '', x, y }, state.gridSize);
        x = snapped.x;
        y = snapped.y;
      }

      setMousePos({ x, y });

      // Draw preview in draw mode
      if (state.mode === 'draw' && tempStartPoint) {
        previewGraphics.clear();
        
        // Draw preview line
        previewGraphics
          .moveTo(tempStartPoint.x, tempStartPoint.y)
          .lineTo(x, y)
          .stroke({ width: 2, color: 0xffaa00, alpha: 1 });

        // Draw preview point
        previewGraphics
          .circle(x, y, 4)
          .fill(0xffaa00);
      }
    };

    // Use pointermove (Pixi v8 recommended)
    if (app.stage) {
      console.log('Attaching pointermove handler');
      app.stage.on('pointermove', handleMouseMove);
    }

    return () => {
      if (app.stage) {
        app.stage.off('pointermove', handleMouseMove);
      }
    };
  }, [isInitialized, state.mode, state.snapToGrid, state.gridSize, tempStartPoint]);

  // Handle click
  useEffect(() => {
    if (!isInitialized || !appRef.current) return;

    const app = appRef.current;

    const handleClick = () => {
      console.log('Click event triggered! Mode:', state.mode, 'MousePos:', mousePos);
      if (state.mode !== 'draw') return;

      let { x, y } = mousePos;

      // Snap to grid if enabled
      if (state.snapToGrid) {
        const snapped = snapToGrid({ id: '', x, y }, state.gridSize);
        x = snapped.x;
        y = snapped.y;
      }

      if (!tempStartPoint) {
        // First click - set start point
        const point: Point = {
          id: generateId(),
          x,
          y,
        };
        setTempStartPoint(point);
        dispatch({ type: 'ADD_POINT', point });
        console.log('First point placed:', point);
      } else {
        // Second click - create wall
        const endPoint: Point = {
          id: generateId(),
          x,
          y,
        };

        // Check if clicking near existing point
        let finalEndPoint = endPoint;
        for (const [, point] of state.points) {
          if (isNearPoint(endPoint, point, 10)) {
            finalEndPoint = point;
            break;
          }
        }

        if (finalEndPoint.id === endPoint.id) {
          dispatch({ type: 'ADD_POINT', point: endPoint });
        }

        const wall: Wall = {
          id: generateId(),
          startPointId: tempStartPoint.id,
          endPointId: finalEndPoint.id,
          thickness: 4,
          style: 'solid',
        };

        dispatch({ type: 'ADD_WALL', wall });
        console.log('Wall created:', wall);

        // Continue chain - end point becomes new start point
        setTempStartPoint(finalEndPoint);

        // Clear preview
        if (previewGraphicsRef.current) {
          previewGraphicsRef.current.clear();
        }
      }
    };

    // Use pointerdown (Pixi v8 recommended)
    if (app.stage) {
      console.log('Attaching pointerdown handler');
      app.stage.on('pointerdown', handleClick);
    }

    return () => {
      if (app.stage) {
        app.stage.off('pointerdown', handleClick);
      }
    };
  }, [
    isInitialized,
    state.mode,
    state.snapToGrid,
    state.gridSize,
    state.points,
    tempStartPoint,
    mousePos,
    dispatch,
  ]);

  // Cancel drawing on mode change or Escape
  useEffect(() => {
    if (state.mode !== 'draw') {
      setTempStartPoint(null);
      if (previewGraphicsRef.current) {
        previewGraphicsRef.current.clear();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTempStartPoint(null);
        if (previewGraphicsRef.current) {
          previewGraphicsRef.current.clear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.mode]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      data-testid="pixi-canvas"
    />
  );
};
