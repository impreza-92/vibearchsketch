import { describe, it, expect } from 'vitest';
import { getSnappedPoint } from '../../src/utils/geometry';
import type { Vertex } from '../../src/types/spatial';

describe('getSnappedPoint', () => {
  const vertices: Vertex[] = [
    { id: 'v1', x: 100, y: 100 },
    { id: 'v2', x: 200, y: 200 },
  ];

  it('should NOT snap to grid when far from vertices and no startVertex provided (free movement)', () => {
    const cursor = { x: 112, y: 112 }; 
    const resolution = 10;
    const snapped = getSnappedPoint(cursor, resolution, vertices);
    
    // Should return raw cursor
    expect(snapped).toEqual({ x: 112, y: 112 });
  });

  it('should snap length to multiples of resolution (diagonal)', () => {
    const startVertex: Vertex = { id: 'start', x: 0, y: 0 };
    // Move diagonally. Length should be snapped.
    // Cursor at (12, 12). Dist = 16.97. Resolution 10.
    // Should snap length to 20.
    // Vector (12, 12) normalized is (0.707, 0.707).
    // Result should be (20 * 0.707, 20 * 0.707) = (14.14, 14.14).
    
    const cursor = { x: 12, y: 12 };
    const resolution = 10;
    const snapped = getSnappedPoint(cursor, resolution, vertices, 1, startVertex);
    
    const dx = snapped.x - startVertex.x;
    const dy = snapped.y - startVertex.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    expect(length).toBeCloseTo(20);
    expect(snapped.x).toBeCloseTo(14.142, 3);
    expect(snapped.y).toBeCloseTo(14.142, 3);
  });

  it('should snap to vertex when close', () => {
    const cursor = { x: 105, y: 105 }; // Distance to v1 is sqrt(50) ~= 7.07 < 10
    const resolution = 10;
    const snapped = getSnappedPoint(cursor, resolution, vertices);
    
    expect(snapped).toEqual({ x: 100, y: 100 });
  });

  it('should prioritize vertex snap over grid snap', () => {
    // Vertex at 103, 103. Grid 10.
    // Cursor 104, 104.
    // Grid snap -> 100, 100.
    // Vertex snap -> 103, 103.
    
    const customVertices: Vertex[] = [{ id: 'v3', x: 103, y: 103 }];
    const cursor = { x: 104, y: 104 };
    const resolution = 10;
    
    const snapped = getSnappedPoint(cursor, resolution, customVertices);
    expect(snapped).toEqual({ x: 103, y: 103 });
  });

  it('should respect scale for vertex snapping', () => {
    const cursor = { x: 106, y: 106 }; // Dist ~8.48
    const resolution = 10;
    
    // Scale 1: Radius 10. Should snap.
    expect(getSnappedPoint(cursor, resolution, vertices, 1)).toEqual({ x: 100, y: 100 });
    
    // Scale 2: Radius 5. Should NOT snap (return raw cursor)
    expect(getSnappedPoint(cursor, resolution, vertices, 2)).toEqual({ x: 106, y: 106 });
  });
});
