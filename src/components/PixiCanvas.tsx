import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useFloorplan } from '../context/FloorplanContext';
import type { Point, Wall, Room } from '../types/floorplan';
import { snapToGrid, generateId, isNearPoint, isPointOnLineSegment } from '../utils/geometry';
import { formatWallLength } from '../utils/measurements';

export const PixiCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const wallsGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const previewGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const measurementContainerRef = useRef<PIXI.Container | null>(null);
  const roomContainerRef = useRef<PIXI.Container | null>(null);

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

      // Create measurement container for text labels
      const measurementContainer = new PIXI.Container();
      measurementContainerRef.current = measurementContainer;
      app.stage.addChild(measurementContainer);

      // Create room container for room labels (on top of everything)
      const roomContainer = new PIXI.Container();
      roomContainerRef.current = roomContainer;
      app.stage.addChild(roomContainer);

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
    if (!wallsGraphicsRef.current || !measurementContainerRef.current) return;

    const graphics = wallsGraphicsRef.current;
    const measurementContainer = measurementContainerRef.current;
    
    graphics.clear();
    // Clear previous measurement labels
    measurementContainer.removeChildren();

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

        // Add measurement label if enabled
        if (state.measurement.showMeasurements) {
          const measurementText = formatWallLength(
            startPoint,
            endPoint,
            state.measurement
          );

          const text = new PIXI.Text({
            text: measurementText,
            style: {
              fontFamily: 'Arial, sans-serif',
              fontSize: 12,
              fill: 0xffaa00,
              fontWeight: 'bold',
            },
          });

          // Position text at midpoint of wall
          const midX = (startPoint.x + endPoint.x) / 2;
          const midY = (startPoint.y + endPoint.y) / 2;
          
          // Calculate rotation to align with wall
          const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
          
          text.anchor.set(0.5, 0.5);
          text.x = midX;
          text.y = midY;
          text.rotation = angle;

          // Add background for better readability
          const bg = new PIXI.Graphics();
          bg.rect(
            -text.width / 2 - 2,
            -text.height / 2 - 1,
            text.width + 4,
            text.height + 2
          );
          bg.fill({ color: 0x000000, alpha: 0.7 });
          
          const label = new PIXI.Container();
          label.x = midX;
          label.y = midY;
          label.rotation = angle;
          label.addChild(bg);
          label.addChild(text);
          
          // Reset text position relative to container
          text.x = 0;
          text.y = 0;

          measurementContainer.addChild(label);
        }
      }
    });
  }, [state.walls, state.points, state.selectedIds, state.measurement]);

  // Render rooms
  useEffect(() => {
    if (!roomContainerRef.current) return;

    const roomContainer = roomContainerRef.current;
    roomContainer.removeChildren();

    // Draw all rooms
    state.rooms.forEach((room: Room) => {
      // Create room label
      const text = new PIXI.Text({
        text: room.name,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          fill: 0x88ccff,
          fontWeight: 'bold',
        },
      });

      text.anchor.set(0.5, 0.5);
      text.x = room.centroid.x;
      text.y = room.centroid.y;

      // Add semi-transparent background
      const bg = new PIXI.Graphics();
      bg.rect(
        room.centroid.x - text.width / 2 - 4,
        room.centroid.y - text.height / 2 - 2,
        text.width + 8,
        text.height + 4
      );
      bg.fill({ color: 0x000000, alpha: 0.6 });

      roomContainer.addChild(bg);
      roomContainer.addChild(text);
    });
  }, [state.rooms]);

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
        // === FIRST CLICK: Determine start point ===
        // Handles scenarios 1 & 2 (new start) and 3 & 4 (existing start) and 5 (split edge)
        let startPoint: Point | undefined;
        
        // First, search for existing point within 10px radius
        for (const [, point] of state.points) {
          if (isNearPoint({ id: '', x, y }, point, 10)) {
            startPoint = point;
            break;
          }
        }
        
        // If no nearby point, check if clicking on an existing wall (Scenario 5)
        if (!startPoint) {
          for (const [wallId, wall] of state.walls) {
            const startWallPoint = state.points.get(wall.startPointId);
            const endWallPoint = state.points.get(wall.endPointId);
            
            if (startWallPoint && endWallPoint) {
              if (isPointOnLineSegment({ id: '', x, y }, startWallPoint, endWallPoint, 8)) {
                // Scenario 5: Split the wall at this point
                const splitPoint: Point = {
                  id: generateId(),
                  x,
                  y,
                };
                
                dispatch({ type: 'SPLIT_WALL', wallId, splitPoint });
                console.log('Wall split at point:', splitPoint);
                
                // Use the split point as the start point
                startPoint = splitPoint;
                break;
              }
            }
          }
        }
        
        // Only create and add new point if none exists nearby and not on wall
        if (!startPoint) {
          // Scenarios 1 & 3: Create new start vertex
          startPoint = {
            id: generateId(),
            x,
            y,
          };
          dispatch({ type: 'ADD_POINT', point: startPoint });
          console.log('New start point created:', startPoint);
        } else if (!state.points.has(startPoint.id)) {
          // Edge case: split point needs to be waited for (it's in the dispatch queue)
          // The split point will be available in the next render
          console.log('Using split point as start:', startPoint);
        } else {
          // Scenarios 2 & 4: Reuse existing start vertex (no dispatch = no duplicate)
          console.log('Reusing existing start point:', startPoint);
        }
        
        setTempStartPoint(startPoint);
      } else {
        // === SECOND CLICK: Determine end point and create wall ===
        // Handles scenarios 1 & 2 (new end) and 3 & 4 (existing end) and 5 (split edge)
        let endPoint: Point | undefined;

        // First, search for existing point within 10px radius
        for (const [, point] of state.points) {
          if (isNearPoint({ id: '', x, y }, point, 10)) {
            endPoint = point;
            break;
          }
        }

        // If no nearby point, check if clicking on an existing wall (Scenario 5)
        if (!endPoint) {
          for (const [wallId, wall] of state.walls) {
            const startWallPoint = state.points.get(wall.startPointId);
            const endWallPoint = state.points.get(wall.endPointId);
            
            if (startWallPoint && endWallPoint) {
              if (isPointOnLineSegment({ id: '', x, y }, startWallPoint, endWallPoint, 8)) {
                // Scenario 5: Split the wall at this point
                const splitPoint: Point = {
                  id: generateId(),
                  x,
                  y,
                };
                
                dispatch({ type: 'SPLIT_WALL', wallId, splitPoint });
                console.log('Wall split at point:', splitPoint);
                
                // Use the split point as the end point
                endPoint = splitPoint;
                break;
              }
            }
          }
        }

        // Only create and add new point if none exists nearby and not on wall
        if (!endPoint) {
          // Scenarios 1 & 2: Create new end vertex
          endPoint = {
            id: generateId(),
            x,
            y,
          };
          dispatch({ type: 'ADD_POINT', point: endPoint });
          console.log('New end point created:', endPoint);
        } else if (!state.points.has(endPoint.id)) {
          // Edge case: split point needs to be waited for (it's in the dispatch queue)
          console.log('Using split point as end:', endPoint);
        } else {
          // Scenarios 3 & 4: Reuse existing end vertex (no dispatch = no duplicate)
          console.log('Reusing existing end point:', endPoint);
        }

        // Create wall connecting the two points (all 5 scenarios)
        const wall: Wall = {
          id: generateId(),
          startPointId: tempStartPoint.id,
          endPointId: endPoint.id,
          thickness: 4,
          style: 'solid',
        };

        dispatch({ type: 'ADD_WALL', wall });
        console.log('Wall created:', wall);

        // Reset for next wall - don't continue chain
        setTempStartPoint(null);

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
