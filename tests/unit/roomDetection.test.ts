import { describe, it, expect } from 'vitest';
import { updateRoomIds, generateRoomSignature } from '../../src/utils/roomDetection';
import type { Surface } from '../../src/types/spatial';

describe('Room Detection', () => {
  const createSurface = (id: string, edgeIds: string[], name: string = ''): Surface => ({
    id,
    edgeIds,
    area: 100,
    name: name || `Room ${id}`,
    centroid: { x: 0, y: 0 }
  });

  it('should generate consistent signatures', () => {
    const edges1 = ['a', 'b', 'c'];
    const edges2 = ['c', 'a', 'b'];
    expect(generateRoomSignature(edges1)).toBe(generateRoomSignature(edges2));
  });

  it('should assign new IDs sequentially starting from 1 if no existing rooms', () => {
    const newSurfaces = [
      createSurface('temp1', ['a', 'b', 'c']),
      createSurface('temp2', ['d', 'e', 'f'])
    ];
    const existingSurfaces = new Map<string, Surface>();

    const result = updateRoomIds(newSurfaces, existingSurfaces);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[0].name).toBe('Room 1');
    expect(result[1].id).toBe('2');
    expect(result[1].name).toBe('Room 2');
  });

  it('should preserve existing IDs when signatures match', () => {
    const existingSurfaces = new Map<string, Surface>();
    existingSurfaces.set('1', createSurface('1', ['a', 'b', 'c'], 'Living Room'));

    const newSurfaces = [
      createSurface('temp1', ['c', 'b', 'a']) // Same edges, different order
    ];

    const result = updateRoomIds(newSurfaces, existingSurfaces);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].name).toBe('Living Room');
  });

  it('should assign next available ID for new rooms', () => {
    const existingSurfaces = new Map<string, Surface>();
    existingSurfaces.set('1', createSurface('1', ['a', 'b', 'c']));
    existingSurfaces.set('5', createSurface('5', ['x', 'y', 'z'])); // Gap in IDs

    const newSurfaces = [
      createSurface('temp1', ['a', 'b', 'c']), // Matches Room 1
      createSurface('temp2', ['d', 'e', 'f'])  // New Room
    ];

    const result = updateRoomIds(newSurfaces, existingSurfaces);

    expect(result).toHaveLength(2);
    
    // Match Room 1
    const room1 = result.find(r => r.edgeIds.includes('a'));
    expect(room1).toBeDefined();
    expect(room1?.id).toBe('1');

    // New Room should be 6 (MaxID 5 + 1)
    const newRoom = result.find(r => r.edgeIds.includes('d'));
    expect(newRoom).toBeDefined();
    expect(newRoom?.id).toBe('6');
    expect(newRoom?.name).toBe('Room 6');
  });

  it('should handle room splitting (both parts get new IDs)', () => {
    // Original Room 1: Edges A, B, C, D
    const existingSurfaces = new Map<string, Surface>();
    existingSurfaces.set('1', createSurface('1', ['A', 'B', 'C', 'D']));

    // Split into two rooms:
    // Room X: A, B, E
    // Room Y: C, D, E
    const newSurfaces = [
      createSurface('temp1', ['A', 'B', 'E']),
      createSurface('temp2', ['C', 'D', 'E'])
    ];

    const result = updateRoomIds(newSurfaces, existingSurfaces);

    expect(result).toHaveLength(2);
    // Neither matches Room 1 signature
    // Max ID was 1. Next is 2.
    expect(result.map(r => r.id).sort()).toEqual(['2', '3']);
  });
});
