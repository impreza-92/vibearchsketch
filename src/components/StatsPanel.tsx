import React from 'react';
import { useSpatialStore } from '../store/useSpatialStore';
import './StatsPanel.css';

export const StatsPanel: React.FC = () => {
  const graph = useSpatialStore((state) => state.graph);
  
  const edgeCount = graph.getEdges().size;
  const surfaceCount = graph.getSurfaces().size;
  
  // Calculate total area in square meters
  // Assuming pixelsPerMm is 0.1 (default), so 10px = 100mm = 0.1m
  // Area in pixels^2 needs to be converted to m^2
  // 1 pixel = 1/pixelsPerMm mm
  // 1 pixel^2 = (1/pixelsPerMm)^2 mm^2
  // 1 m^2 = 1,000,000 mm^2
  
  const measurementSettings = useSpatialStore((state) => state.measurement);
  const pixelsPerMm = measurementSettings.pixelsPerMm;
  
  let totalAreaMm2 = 0;
  graph.getSurfaces().forEach(surface => {
    totalAreaMm2 += surface.area / (pixelsPerMm * pixelsPerMm);
  });
  
  const totalAreaM2 = totalAreaMm2 / 1000000;

  return (
    <div className="stats-panel">
      <div className="stat-item">
        <span className="stat-label">Walls:</span>
        <span className="stat-value">{edgeCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Rooms:</span>
        <span className="stat-value">{surfaceCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Total Area:</span>
        <span className="stat-value">{totalAreaM2.toFixed(2)} m²</span>
      </div>
    </div>
  );
};
