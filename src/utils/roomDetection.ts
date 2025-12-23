import type { Surface } from '../types/spatial';

/**
 * Generates a unique signature for a room based on its edges.
 * The signature is a sorted, comma-separated string of edge IDs.
 * This allows identifying the same room even if the edge order in the definition changes,
 * as long as the set of edges defining the room remains the same.
 */
export function generateRoomSignature(edgeIds: string[]): string {
  return [...edgeIds].sort().join(',');
}

/**
 * Updates the IDs and properties of newly detected surfaces by matching them
 * against existing surfaces using their edge signatures.
 * 
 * Strategy:
 * 1. Calculate signatures for all new surfaces.
 * 2. Calculate signatures for all existing surfaces.
 * 3. Match new surfaces to existing ones based on signature.
 * 4. If a match is found, preserve the ID and custom properties (name, fill).
 * 5. If no match is found, assign a new ID based on the maximum existing ID + 1.
 * 
 * @param newSurfaces The list of surfaces detected by the geometry algorithm (with temporary IDs)
 * @param existingSurfaces The map of currently known surfaces
 * @returns A new list of surfaces with stable IDs and preserved properties
 */
export function updateRoomIds(
  newSurfaces: Surface[],
  existingSurfaces: Map<string, Surface>
): Surface[] {
  // 1. Index existing surfaces by signature
  const existingBySignature = new Map<string, Surface>();
  let maxId = 0;

  existingSurfaces.forEach((surface) => {
    const signature = generateRoomSignature(surface.edgeIds);
    existingBySignature.set(signature, surface);

    // Track max ID for generating new ones
    // Assumes IDs are numeric strings "1", "2", etc.
    // If they are UUIDs, this logic might need adjustment, but requirements say "sequential integers"
    const idNum = parseInt(surface.id, 10);
    if (!isNaN(idNum) && idNum > maxId) {
      maxId = idNum;
    }
  });

  // 2. Process new surfaces
  const resultSurfaces: Surface[] = [];
  
  // We need to assign new IDs for unmatched rooms.
  // We'll start from maxId + 1 and increment.
  let nextId = maxId + 1;

  for (const newSurface of newSurfaces) {
    const signature = generateRoomSignature(newSurface.edgeIds);
    const existing = existingBySignature.get(signature);

    if (existing) {
      // Match found! Preserve ID and properties
      resultSurfaces.push({
        ...newSurface, // Keep geometric data (area, centroid) from new calculation
        id: existing.id,
        name: existing.name,
      });
      
      // Remove from map to prevent double matching (though unlikely with unique signatures)
      existingBySignature.delete(signature);
    } else {
      // No match found. This is a new room.
      // Assign new sequential ID
      const newId = nextId.toString();
      nextId++;

      resultSurfaces.push({
        ...newSurface,
        id: newId,
        name: `Room ${newId}`,
        // Keep calculated area/centroid
      });
    }
  }

  return resultSurfaces;
}
