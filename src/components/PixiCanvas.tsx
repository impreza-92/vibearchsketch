import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useSpatial } from '../context/SpatialContext';
import type { Vertex, Edge, Surface } from '../types/spatial';
import { snapToGrid, generateId, isNearVertex, isVertexOnLineSegment } from '../utils/geometry';
import { formatEdgeLength } from '../utils/measurements';

export const PixiCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const edgesGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const previewGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const measurementContainerRef = useRef<PIXI.Container | null>(null);
  const surfaceContainerRef = useRef<PIXI.Container | null>(null);

  const { state, dispatch } = useSpatial();
  const [tempStartVertex, setTempStartVertex] = useState<Vertex | null>(null);
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

      const edgesGraphics = new PIXI.Graphics();
      edgesGraphicsRef.current = edgesGraphics;
      app.stage.addChild(edgesGraphics);

      const previewGraphics = new PIXI.Graphics();
      previewGraphicsRef.current = previewGraphics;
      app.stage.addChild(previewGraphics);

      // Create measurement container for text labels
      const measurementContainer = new PIXI.Container();
      measurementContainerRef.current = measurementContainer;
      app.stage.addChild(measurementContainer);

      // Create surface container for surface labels (on top of everything)
      const surfaceContainer = new PIXI.Container();
      surfaceContainerRef.current = surfaceContainer;
      app.stage.addChild(surfaceContainer);

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
      edgesGraphicsRef.current = null;
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

  // Render edges
  useEffect(() => {
    if (!edgesGraphicsRef.current || !measurementContainerRef.current) return;

    const graphics = edgesGraphicsRef.current;
    const measurementContainer = measurementContainerRef.current;
    
    graphics.clear();
    // Clear previous measurement labels
    measurementContainer.removeChildren();

    // Draw all edges
    state.edges.forEach((edge: Edge) => {
      const startVertex = state.vertices.get(edge.startVertexId);
      const endVertex = state.vertices.get(edge.endVertexId);

      if (startVertex && endVertex) {
        const isSelected = state.selectedIds.has(edge.id);
        const color = isSelected ? 0x0078d4 : 0xffffff;

        // Draw edge line
        graphics
          .moveTo(startVertex.x, startVertex.y)
          .lineTo(endVertex.x, endVertex.y)
          .stroke({ width: edge.thickness, color, alpha: 1 });

        // Draw vertices
        graphics
          .circle(startVertex.x, startVertex.y, 4)
          .fill(color)
          .circle(endVertex.x, endVertex.y, 4)
          .fill(color);

        // Add measurement label if enabled
        if (state.measurement.showMeasurements) {
          const measurementText = formatEdgeLength(
            startVertex,
            endVertex,
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

          // Position text at midpoint of edge
          const midX = (startVertex.x + endVertex.x) / 2;
          const midY = (startVertex.y + endVertex.y) / 2;
          
          // Calculate rotation to align with edge
          const angle = Math.atan2(endVertex.y - startVertex.y, endVertex.x - startVertex.x);
          
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
  }, [state.edges, state.vertices, state.selectedIds, state.measurement]);

  // Render surfaces
  useEffect(() => {
    if (!surfaceContainerRef.current) return;

    const surfaceContainer = surfaceContainerRef.current;
    surfaceContainer.removeChildren();

    // Draw all surfaces
    state.surfaces.forEach((surface: Surface) => {
      // Create surface label
      const text = new PIXI.Text({
        text: surface.name,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          fill: 0x88ccff,
          fontWeight: 'bold',
        },
      });

      text.anchor.set(0.5, 0.5);
      text.x = surface.centroid.x;
      text.y = surface.centroid.y;

      // Add semi-transparent background
      const bg = new PIXI.Graphics();
      bg.rect(
        surface.centroid.x - text.width / 2 - 4,
        surface.centroid.y - text.height / 2 - 2,
        text.width + 8,
        text.height + 4
      );
      bg.fill({ color: 0x000000, alpha: 0.6 });

      surfaceContainer.addChild(bg);
      surfaceContainer.addChild(text);
    });
  }, [state.surfaces]);

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
      if (state.mode === 'draw' && tempStartVertex) {
        previewGraphics.clear();
        
        // Draw preview line
        previewGraphics
          .moveTo(tempStartVertex.x, tempStartVertex.y)
          .lineTo(x, y)
          .stroke({ width: 2, color: 0xffaa00, alpha: 1 });

        // Draw preview vertex
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
  }, [isInitialized, state.mode, state.snapToGrid, state.gridSize, tempStartVertex]);

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

      if (!tempStartVertex) {
        // === FIRST CLICK: Determine start vertex ===
        // Handles scenarios 1 & 2 (new start) and 3 & 4 (existing start) and 5 (split edge)
        let startVertex: Vertex | undefined;
        
        // First, search for existing vertex within 10px radius
        for (const [, vertex] of state.vertices) {
          if (isNearVertex({ id: '', x, y }, vertex, 10)) {
            startVertex = vertex;
            break;
          }
        }
        
        // If no nearby vertex, check if clicking on an existing edge (Scenario 5)
        if (!startVertex) {
          for (const [edgeId, edge] of state.edges) {
            const startEdgeVertex = state.vertices.get(edge.startVertexId);
            const endEdgeVertex = state.vertices.get(edge.endVertexId);
            
            if (startEdgeVertex && endEdgeVertex) {
              if (isVertexOnLineSegment({ id: '', x, y }, startEdgeVertex, endEdgeVertex, 8)) {
                // Scenario 5: Split the edge at this vertex
                const splitVertex: Vertex = {
                  id: generateId(),
                  x,
                  y,
                };
                
                dispatch({ type: 'SPLIT_EDGE', edgeId, splitVertex });
                console.log('Edge split at vertex:', splitVertex);
                
                // Use the split vertex as the start vertex
                startVertex = splitVertex;
                break;
              }
            }
          }
        }
        
        // Only create new vertex if none exists nearby and not on edge
        if (!startVertex) {
          // Scenarios 1 & 3: Create new start vertex
          startVertex = {
            id: generateId(),
            x,
            y,
          };
          console.log('New start vertex created (not dispatched yet):', startVertex);
        } else if (!state.vertices.has(startVertex.id)) {
          // Edge case: split vertex needs to be waited for (it's in the dispatch queue)
          // The split vertex will be available in the next render
          console.log('Using split vertex as start:', startVertex);
        } else {
          // Scenarios 2 & 4: Reuse existing start vertex
          console.log('Reusing existing start vertex:', startVertex);
        }
        
        setTempStartVertex(startVertex);
      } else {
        // === SECOND CLICK: Determine end vertex and create edge ===
        // Handles scenarios 1 & 2 (new end) and 3 & 4 (existing end) and 5 (split edge)
        let endVertex: Vertex | undefined;

        // First, search for existing vertex within 10px radius
        for (const [, vertex] of state.vertices) {
          if (isNearVertex({ id: '', x, y }, vertex, 10)) {
            endVertex = vertex;
            break;
          }
        }

        // If no nearby vertex, check if clicking on an existing edge (Scenario 5)
        if (!endVertex) {
          for (const [edgeId, edge] of state.edges) {
            const startEdgeVertex = state.vertices.get(edge.startVertexId);
            const endEdgeVertex = state.vertices.get(edge.endVertexId);
            
            if (startEdgeVertex && endEdgeVertex) {
              if (isVertexOnLineSegment({ id: '', x, y }, startEdgeVertex, endEdgeVertex, 8)) {
                // Scenario 5: Split the edge at this vertex
                const splitVertex: Vertex = {
                  id: generateId(),
                  x,
                  y,
                };
                
                dispatch({ type: 'SPLIT_EDGE', edgeId, splitVertex });
                console.log('Edge split at vertex:', splitVertex);
                
                // Use the split vertex as the end vertex
                endVertex = splitVertex;
                break;
              }
            }
          }
        }

        // Only create new vertex if none exists nearby and not on edge
        if (!endVertex) {
          // Scenarios 1 & 2: Create new end vertex
          endVertex = {
            id: generateId(),
            x,
            y,
          };
          console.log('New end vertex created (not dispatched yet):', endVertex);
        } else if (!state.vertices.has(endVertex.id)) {
          // Edge case: split vertex needs to be waited for (it's in the dispatch queue)
          console.log('Using split vertex as end:', endVertex);
        } else {
          // Scenarios 3 & 4: Reuse existing end vertex
          console.log('Reusing existing end vertex:', endVertex);
        }

        // Create edge connecting the two vertices (all 5 scenarios)
        const edge: Edge = {
          id: generateId(),
          startVertexId: tempStartVertex.id,
          endVertexId: endVertex.id,
          thickness: 4,
          style: 'solid',
        };

        // Dispatch atomic DRAW_EDGE command with all information
        dispatch({
          type: 'DRAW_EDGE',
          startVertex: tempStartVertex,
          endVertex: endVertex,
          edge,
          startVertexExists: state.vertices.has(tempStartVertex.id),
          endVertexExists: state.vertices.has(endVertex.id),
        });
        console.log('Edge drawn with atomic command:', edge);

        // Reset for next edge - don't continue chain
        setTempStartVertex(null);

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
    state.vertices,
    state.edges,
    tempStartVertex,
    mousePos,
    dispatch,
  ]);

  // Cancel drawing on mode change or Escape
  useEffect(() => {
    if (state.mode !== 'draw') {
      setTempStartVertex(null);
      if (previewGraphicsRef.current) {
        previewGraphicsRef.current.clear();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTempStartVertex(null);
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
