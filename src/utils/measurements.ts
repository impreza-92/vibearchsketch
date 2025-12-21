// Measurement utilities for converting pixels to real-world units

import type { Point, MeasurementSettings, UnitSystem } from '../types/floorplan';
import { distance } from './geometry';

/**
 * Convert pixels to real-world units
 */
export function pixelsToUnits(
  pixels: number,
  pixelsPerUnit: number
): number {
  return pixels / pixelsPerUnit;
}

/**
 * Convert real-world units to pixels
 */
export function unitsToPixels(
  units: number,
  pixelsPerUnit: number
): number {
  return units * pixelsPerUnit;
}

/**
 * Calculate the real-world distance between two points
 */
export function calculateRealDistance(
  point1: Point,
  point2: Point,
  pixelsPerUnit: number
): number {
  const pixelDistance = distance(point1, point2);
  return pixelsToUnits(pixelDistance, pixelsPerUnit);
}

/**
 * Format a measurement for display with proper unit labels
 */
export function formatMeasurement(
  value: number,
  unitSystem: UnitSystem,
  precision: number = 2
): string {
  const roundedValue = Number(value.toFixed(precision));
  
  if (unitSystem === 'metric') {
    // Metric: meters (m) or centimeters (cm)
    if (roundedValue < 1) {
      // Show in centimeters for values < 1m
      const cm = roundedValue * 100;
      return `${cm.toFixed(precision)} cm`;
    }
    return `${roundedValue.toFixed(precision)} m`;
  } else {
    // Imperial: feet (ft) and inches (in)
    const feet = Math.floor(roundedValue);
    const inches = Math.round((roundedValue - feet) * 12);
    
    if (feet === 0) {
      return `${inches}"`;
    } else if (inches === 0) {
      return `${feet}'`;
    } else {
      return `${feet}' ${inches}"`;
    }
  }
}

/**
 * Get the full unit name for display
 */
export function getUnitName(unitSystem: UnitSystem, plural: boolean = false): string {
  if (unitSystem === 'metric') {
    return plural ? 'meters' : 'meter';
  } else {
    return plural ? 'feet' : 'foot';
  }
}

/**
 * Get the abbreviated unit label
 */
export function getUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'm' : 'ft';
}

/**
 * Calculate the real-world length of a wall
 */
export function getWallLength(
  startPoint: Point,
  endPoint: Point,
  settings: MeasurementSettings
): number {
  return calculateRealDistance(startPoint, endPoint, settings.pixelsPerUnit);
}

/**
 * Format a wall length for display
 */
export function formatWallLength(
  startPoint: Point,
  endPoint: Point,
  settings: MeasurementSettings
): string {
  const length = getWallLength(startPoint, endPoint, settings);
  return formatMeasurement(length, settings.unitSystem, settings.precision);
}

/**
 * Get recommended pixels per unit based on grid size
 * This helps maintain a sensible default where 1 grid unit = reasonable real size
 */
export function getRecommendedPixelsPerUnit(
  gridSize: number,
  unitSystem: UnitSystem
): number {
  // For metric: 10px grid = 1 meter means 10 pixels per meter
  // For imperial: 10px grid = 1 foot means 10 pixels per foot
  // This is a reasonable default that can be adjusted by the user
  return gridSize;
}

/**
 * Calculate the scale ratio (e.g., "1:100")
 * Used for display and export
 */
export function getScaleRatio(pixelsPerUnit: number, unitSystem: UnitSystem): string {
  // Assuming standard screen DPI of ~96 pixels per inch
  const pixelsPerInch = 96;
  const pixelsPerMeter = pixelsPerUnit * (unitSystem === 'metric' ? 1 : 0.3048);
  const inchesPerMeter = 39.3701;
  
  // Calculate how many real-world meters are represented by 1 screen inch
  const realMetersPerScreenInch = pixelsPerInch / pixelsPerMeter;
  const ratio = Math.round(inchesPerMeter / realMetersPerScreenInch);
  
  return `1:${ratio}`;
}
