// Measurement utilities for converting pixels to millimeters

import type { Vertex, MeasurementSettings } from '../types/spatial';
import { distance } from './geometry';

/**
 * Convert pixels to millimeters
 */
export function pixelsToMm(
  pixels: number,
  pixelsPerMm: number
): number {
  return pixels / pixelsPerMm;
}

/**
 * Convert millimeters to pixels
 */
export function mmToPixels(
  mm: number,
  pixelsPerMm: number
): number {
  return mm * pixelsPerMm;
}

/**
 * Calculate the real-world distance between two vertices in millimeters
 */
export function calculateRealDistance(
  vertex1: Vertex,
  vertex2: Vertex,
  pixelsPerMm: number
): number {
  const pixelDistance = distance(vertex1, vertex2);
  return pixelsToMm(pixelDistance, pixelsPerMm);
}

/**
 * Format a measurement in millimeters for display
 */
export function formatMeasurement(
  valueInMm: number
): string {
  // Round to whole millimeters
  const rounded = Math.round(valueInMm);
  return `${rounded} mm`;
}

/**
 * Calculate and format the real-world length of an edge
 */
export function getEdgeLength(
  startVertex: Vertex,
  endVertex: Vertex,
  settings: MeasurementSettings
): number {
  return calculateRealDistance(startVertex, endVertex, settings.pixelsPerMm);
}

/**
 * Format an edge length for display
 */
export function formatEdgeLength(
  startVertex: Vertex,
  endVertex: Vertex,
  settings: MeasurementSettings
): string {
  const length = getEdgeLength(startVertex, endVertex, settings);
  return formatMeasurement(length);
}

/**
 * Get recommended pixels per mm based on grid size
 * This helps maintain a sensible default where 1 grid unit = reasonable real size
 */
export function getRecommendedPixelsPerMm(gridSize: number): number {
  // Default: 10px grid = 100mm (10cm), so 0.1 pixels per mm
  // This makes 1 grid square = 10cm which is architectural scale friendly
  return gridSize / 100;
}
