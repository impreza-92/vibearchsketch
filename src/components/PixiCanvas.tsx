import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useSpatialStore } from '../store/useSpatialStore';
import type { Vertex, Edge, Surface } from '../types/spatial';
import { snapToGrid, generateId, isNearVertex, isVertexOnLineSegment } from '../utils/geometry';
import { formatEdgeLength } from '../utils/measurements';
import { DrawEdgeCommand, SplitEdgeCommand } from '../utils/commands';

export const PixiCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const edgesGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const previewGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const measurementContainerRef = useRef<PIXI.Container | null>(null);
  const surfaceContainerRef = useRef<PIXI.Container | null>(null);

  const graph = useSpatialStore((state) => state.graph);
  const selectedIds = useSpatialStore((state) => state.selectedIds);
  const mode = useSpatialStore((state) => state.mode);
  const snapToGridEnabled = useSpatialStore((state) => state.snapToGrid);
  const gridSize = useSpatialStore((state) => state.gridSize);
  const measurement = useSpatialStore((state) => state.measurement);
  const showMeasurements = measurement.showMeasurements;
  const dispatch = useSpatialStore((state) => state.dispatch);

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
      const container = canvasRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

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

      const gridGraphics = new PIXI.Graphics();
      gridGraphicsRef.current = gridGraphics;
      app.stage.addChild(gridGraphics);

      const edgesGraphics = new PIXI.Graphics();
      edgesGraphicsRef.current = edgesGraphics;
      app.stage.addChild(edgesGraphics);

      const previewGraphics = new PIXI.Graphics();
      previewGraphicsRef.current = previewGraphics;
      app.stage.addChild(previewGraphics);

      const measurementContainer = new PIXI.Container();
      measurementContainerRef.current = measurementContainer;
      app.stage.addChild(measurementContainer);

      const surfaceContainer = new PIXI.Container();
      surfaceContainerRef.current = surfaceContainer;
      app.stage.addChild(surfaceContainer);

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      drawGrid(gridGraphics, app.screen.width, app.screen.height, gridSize);
      
      setIsInitialized(true);
    })();

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
            gridSize
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);

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

  const drawGrid = (
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    gridSize: number
  ) => {
    graphics.clear();
    for (let x = 0; x <= width; x += gridSize) {
      graphics.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      graphics.moveTo(0, y).lineTo(width, y);
    }
    graphics.stroke({ width: 1, color: 0x2a2a2a, alpha: 1 });
    for (let x = 0; x <= width; x += gridSize * 5) {
      graphics.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize * 5) {
      graphics.moveTo(0, y).lineTo(width, y);
    }
    graphics.stroke({ width: 1, color: 0x3a3a3a, alpha: 1 });
  };

  useEffect(() => {
    if (!edgesGraphicsRef.current || !measurementContainerRef.current) return;

    const graphics = edgesGraphicsRef.current;
    const measurementContainer = measurementContainerRef.current;
    
    graphics.clear();
    measurementContainer.removeChildren();

    graph.getEdges().forEach((edge: Edge) => {
      const startVertex = graph.getVertices().get(edge.startVertexId);
      const endVertex = graph.getVertices().get(edge.endVertexId);

      if (startVertex && endVertex) {
        const isSelected = selectedIds.has(edge.id);
        const color = isSelected ? 0x0078d4 : 0xffffff;

        graphics
          .moveTo(startVertex.x, startVertex.y)
          .lineTo(endVertex.x, endVertex.y)
          .stroke({ width: edge.thickness, color, alpha: 1 });

        graphics
          .circle(startVertex.x, startVertex.y, 4)
          .fill(color)
          .circle(endVertex.x, endVertex.y, 4)
          .fill(color);

        if (showMeasurements) {
          const measurementText = formatEdgeLength(
            startVertex,
            endVertex,
            measurement
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

          const midX = (startVertex.x + endVertex.x) / 2;
          const midY = (startVertex.y + endVertex.y) / 2;
          
          text.anchor.set(0.5, 0.5);
          text.x = midX;
          text.y = midY;

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
          label.addChild(bg);
          label.addChild(text);
          
          text.x = 0;
          text.y = 0;

          measurementContainer.addChild(label);
        }
      }
    });
  }, [graph, selectedIds, showMeasurements]);

  useEffect(() => {
    if (!surfaceContainerRef.current) return;

    const surfaceContainer = surfaceContainerRef.current;
    surfaceContainer.removeChildren();

    graph.getSurfaces().forEach((surface: Surface) => {
      const pixelsPerMm = measurement.pixelsPerMm;
      const areaM2 = surface.area / (pixelsPerMm * pixelsPerMm) / 1000000;

      const text = new PIXI.Text({
        text: `${surface.name}\n${areaM2.toFixed(2)} m²`,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          fill: 0x88ccff,
          fontWeight: 'bold',
          align: 'center',
        },
      });

      text.anchor.set(0.5, 0.5);
      text.x = surface.centroid.x;
      text.y = surface.centroid.y;

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
  }, [graph, measurement]);

  useEffect(() => {
    if (!isInitialized || !appRef.current || !previewGraphicsRef.current) return;

    const app = appRef.current;
    const previewGraphics = previewGraphicsRef.current;

    const handleMouseMove = (event: PIXI.FederatedPointerEvent) => {
      let { x, y } = event.global;

      if (snapToGridEnabled) {
        const snapped = snapToGrid({ id: '', x, y }, gridSize);
        x = snapped.x;
        y = snapped.y;
      }

      setMousePos({ x, y });

      if (mode === 'draw' && tempStartVertex) {
        previewGraphics.clear();
        previewGraphics
          .moveTo(tempStartVertex.x, tempStartVertex.y)
          .lineTo(x, y)
          .stroke({ width: 2, color: 0xffaa00, alpha: 1 });

        previewGraphics
          .circle(x, y, 4)
          .fill(0xffaa00);
      }
    };

    if (app.stage) {
      app.stage.on('pointermove', handleMouseMove);
    }

    return () => {
      if (app.stage) {
        app.stage.off('pointermove', handleMouseMove);
      }
    };
  }, [isInitialized, mode, snapToGridEnabled, gridSize, tempStartVertex]);

  useEffect(() => {
    if (!isInitialized || !appRef.current) return;

    const app = appRef.current;

    const handleClick = () => {
      if (mode !== 'draw') return;

      let { x, y } = mousePos;

      if (snapToGridEnabled) {
        const snapped = snapToGrid({ id: '', x, y }, gridSize);
        x = snapped.x;
        y = snapped.y;
      }

      if (!tempStartVertex) {
        let startVertex: Vertex | undefined;
        
        for (const [, vertex] of graph.getVertices()) {
          if (isNearVertex({ id: '', x, y }, vertex, 10)) {
            startVertex = vertex;
            break;
          }
        }
        
        if (!startVertex) {
          for (const [edgeId, edge] of graph.getEdges()) {
            const startEdgeVertex = graph.getVertices().get(edge.startVertexId);
            const endEdgeVertex = graph.getVertices().get(edge.endVertexId);
            
            if (startEdgeVertex && endEdgeVertex) {
              if (isVertexOnLineSegment({ id: '', x, y }, startEdgeVertex, endEdgeVertex, 8)) {
                const splitVertex: Vertex = {
                  id: generateId(),
                  x,
                  y,
                };
                
                const edge1: Edge = {
                  id: generateId(),
                  startVertexId: edge.startVertexId,
                  endVertexId: splitVertex.id,
                  thickness: edge.thickness,
                  style: edge.style,
                };
                
                const edge2: Edge = {
                  id: generateId(),
                  startVertexId: splitVertex.id,
                  endVertexId: edge.endVertexId,
                  thickness: edge.thickness,
                  style: edge.style,
                };

                dispatch(new SplitEdgeCommand(edgeId, splitVertex, edge1, edge2));
                startVertex = splitVertex;
                break;
              }
            }
          }
        }
        
        if (!startVertex) {
          startVertex = {
            id: generateId(),
            x,
            y,
          };
        }
        
        setTempStartVertex(startVertex);
      } else {
        let endVertex: Vertex | undefined;

        for (const [, vertex] of graph.getVertices()) {
          if (isNearVertex({ id: '', x, y }, vertex, 10)) {
            endVertex = vertex;
            break;
          }
        }

        if (!endVertex) {
          for (const [edgeId, edge] of graph.getEdges()) {
            const startEdgeVertex = graph.getVertices().get(edge.startVertexId);
            const endEdgeVertex = graph.getVertices().get(edge.endVertexId);
            
            if (startEdgeVertex && endEdgeVertex) {
              if (isVertexOnLineSegment({ id: '', x, y }, startEdgeVertex, endEdgeVertex, 8)) {
                const splitVertex: Vertex = {
                  id: generateId(),
                  x,
                  y,
                };
                
                const edge1: Edge = {
                  id: generateId(),
                  startVertexId: edge.startVertexId,
                  endVertexId: splitVertex.id,
                  thickness: edge.thickness,
                  style: edge.style,
                };
                
                const edge2: Edge = {
                  id: generateId(),
                  startVertexId: splitVertex.id,
                  endVertexId: edge.endVertexId,
                  thickness: edge.thickness,
                  style: edge.style,
                };

                dispatch(new SplitEdgeCommand(edgeId, splitVertex, edge1, edge2));
                endVertex = splitVertex;
                break;
              }
            }
          }
        }

        if (!endVertex) {
          endVertex = {
            id: generateId(),
            x,
            y,
          };
        }

        const edge: Edge = {
          id: generateId(),
          startVertexId: tempStartVertex.id,
          endVertexId: endVertex.id,
          thickness: 4,
          style: 'solid',
        };

        dispatch(
          new DrawEdgeCommand(
            tempStartVertex,
            endVertex,
            edge,
            graph.getVertices().has(tempStartVertex.id),
            graph.getVertices().has(endVertex.id)
          )
        );

        setTempStartVertex(null);
        if (previewGraphicsRef.current) {
          previewGraphicsRef.current.clear();
        }
      }
    };

    if (app.stage) {
      app.stage.on('pointerdown', handleClick);
    }

    return () => {
      if (app.stage) {
        app.stage.off('pointerdown', handleClick);
      }
    };
  }, [isInitialized, mode, snapToGridEnabled, gridSize, graph, tempStartVertex, mousePos, dispatch]);

  useEffect(() => {
    if (mode !== 'draw') {
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
  }, [mode]);

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
