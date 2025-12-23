/**
 * Command Pattern Implementation for Undo/Redo Functionality
 * 
 * This module implements the Command pattern to provide robust undo/redo
 * functionality for all drawing operations. Each command encapsulates an
 * action and its inverse, allowing for reliable state rollback.
 */

import type { Point, Wall, Room } from '../types/floorplan';
import { FloorplanGraph } from './floorplanGraph';

/**
 * Base Command interface
 * All commands must implement execute() and undo() methods
 */
export interface Command {
  /** Execute the command, modifying the state */
  execute(state: CommandState): CommandState;
  
  /** Undo the command, reverting the state */
  undo(state: CommandState): CommandState;
  
  /** Get a description of this command for debugging */
  getDescription(): string;
}

/**
 * State interface that commands operate on
 * Uses FloorplanGraph for data operations
 */
export interface CommandState {
  graph: FloorplanGraph;
  selectedIds: Set<string>;
}

/**
 * Command to add a point to the floorplan
 */
export class AddPointCommand implements Command {
  private point: Point;

  constructor(point: Point) {
    this.point = point;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.addPoint(this.point);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.removePoint(this.point.id);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Add point at (${this.point.x}, ${this.point.y})`;
  }
}

/**
 * Command to draw a wall with its endpoints
 * This is the atomic command for drawing a wall, which may involve:
 * - Creating 0, 1, or 2 new points (if reusing existing points)
 * - Creating 1 wall connecting the points
 * 
 * This ensures that drawing a wall is a single undoable operation
 */
export class DrawWallCommand implements Command {
  private startPoint: Point;
  private endPoint: Point;
  private wall: Wall;
  private startPointExisted: boolean;
  private endPointExisted: boolean;
  private createdRooms: Room[] = [];

  constructor(startPoint: Point, endPoint: Point, wall: Wall, startPointExists: boolean, endPointExists: boolean) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.wall = wall;
    this.startPointExisted = startPointExists;
    this.endPointExisted = endPointExists;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Add start point if it didn't exist
    if (!this.startPointExisted) {
      newGraph.addPoint(this.startPoint);
    }
    
    // Add end point if it didn't exist
    if (!this.endPointExisted) {
      newGraph.addPoint(this.endPoint);
    }
    
    // Add wall and track newly created rooms
    this.createdRooms = newGraph.addWall(this.wall);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Remove the wall
    newGraph.removeWall(this.wall.id);
    
    // Remove end point if it was created by this command
    if (!this.endPointExisted) {
      newGraph.removePoint(this.endPoint.id);
    }
    
    // Remove start point if it was created by this command
    if (!this.startPointExisted) {
      newGraph.removePoint(this.startPoint.id);
    }

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    const startDesc = this.startPointExisted ? 'existing' : 'new';
    const endDesc = this.endPointExisted ? 'existing' : 'new';
    const roomsInfo = this.createdRooms.length > 0 ? ` (created ${this.createdRooms.length} room${this.createdRooms.length > 1 ? 's' : ''})` : '';
    return `Draw wall from ${startDesc} point to ${endDesc} point${roomsInfo}`;
  }
}

/**
 * Command to add a wall to the floorplan
 * Automatically detects and creates rooms
 * 
 * Note: For interactive wall drawing, use DrawWallCommand instead.
 * This is for programmatic wall addition when points already exist.
 */
export class AddWallCommand implements Command {
  private createdRooms: Room[] = [];
  private wall: Wall;

  constructor(wall: Wall) {
    this.wall = wall;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Add wall and track newly created rooms
    this.createdRooms = newGraph.addWall(this.wall);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Remove the wall
    newGraph.removeWall(this.wall.id);
    
    // Remove rooms that were created by this wall
    this.createdRooms.forEach(room => {
      newGraph.removeRoom(room.id);
    });

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Add wall from point ${this.wall.startPointId} to ${this.wall.endPointId}`;
  }
}

/**
 * Command to remove a wall from the floorplan
 */
export class RemoveWallCommand implements Command {
  private removedWall: Wall | null = null;
  private affectedRooms: Map<string, Room> = new Map();
  private wallId: string;

  constructor(wallId: string) {
    this.wallId = wallId;
  }

  execute(state: CommandState): CommandState {
    const wall = state.graph.getWall(this.wallId);
    if (!wall) return state;

    this.removedWall = wall;

    const newGraph = state.graph.clone();
    
    // Remove wall and store affected rooms
    this.affectedRooms = newGraph.removeWall(this.wallId);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.removedWall) return state;

    const newGraph = state.graph.clone();
    
    // Restore the wall (without auto room detection)
    newGraph.getWalls().set(this.wallId, this.removedWall);
    
    // Restore affected rooms
    this.affectedRooms.forEach((room) => {
      newGraph.addRoom(room);
    });

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Remove wall ${this.wallId}`;
  }
}

/**
 * Command to split a wall at a point
 */
export class SplitWallCommand implements Command {
  private originalWall: Wall | null = null;
  private affectedRooms: Map<string, Room> = new Map();
  private wallId: string;
  private splitPoint: Point;
  private wall1: Wall;
  private wall2: Wall;

  constructor(
    wallId: string,
    splitPoint: Point,
    wall1: Wall,
    wall2: Wall
  ) {
    this.wallId = wallId;
    this.splitPoint = splitPoint;
    this.wall1 = wall1;
    this.wall2 = wall2;
  }

  execute(state: CommandState): CommandState {
    const wallToSplit = state.graph.getWall(this.wallId);
    if (!wallToSplit) return state;

    this.originalWall = wallToSplit;

    const newGraph = state.graph.clone();

    // Store affected rooms before modification
    const affectedRoomsList = newGraph.getRoomsContainingWall(this.wallId);
    affectedRoomsList.forEach(room => {
      this.affectedRooms.set(room.id, room);
    });

    // Add the split point
    newGraph.addPoint(this.splitPoint);

    // Remove the original wall
    newGraph.removeWall(this.wallId);

    // Add the two new walls with room detection
    newGraph.addWall(this.wall1);
    newGraph.addWall(this.wall2);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.originalWall) return state;

    const newGraph = state.graph.clone();

    // Remove the split point (this also removes connected walls)
    newGraph.removePoint(this.splitPoint.id);

    // Restore the original wall
    newGraph.getWalls().set(this.wallId, this.originalWall);

    // Restore original rooms
    this.affectedRooms.forEach((room) => {
      newGraph.addRoom(room);
    });

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Split wall ${this.wallId} at point (${this.splitPoint.x}, ${this.splitPoint.y})`;
  }
}

/**
 * Command to add a room to the floorplan
 */
export class AddRoomCommand implements Command {
  private room: Room;

  constructor(room: Room) {
    this.room = room;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.addRoom(this.room);

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    newGraph.removeRoom(this.room.id);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Add room "${this.room.name}"`;
  }
}

/**
 * Command to update a room's properties
 */
export class UpdateRoomCommand implements Command {
  private previousRoom: Room | null = null;
  private roomId: string;
  private updates: Partial<Room>;

  constructor(
    roomId: string,
    updates: Partial<Room>
  ) {
    this.roomId = roomId;
    this.updates = updates;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Update room and store previous state
    this.previousRoom = newGraph.updateRoom(this.roomId, this.updates) || null;

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.previousRoom) return state;

    const newGraph = state.graph.clone();
    newGraph.getRooms().set(this.roomId, this.previousRoom);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Update room ${this.roomId}`;
  }
}

/**
 * Command to remove a room from the floorplan
 */
export class RemoveRoomCommand implements Command {
  private removedRoom: Room | null = null;
  private roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    this.removedRoom = newGraph.removeRoom(this.roomId) || null;

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.removedRoom) return state;

    const newGraph = state.graph.clone();
    newGraph.addRoom(this.removedRoom);

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Remove room ${this.roomId}`;
  }
}

/**
 * Command to detect all rooms in the floorplan
 */
export class DetectRoomsCommand implements Command {
  private previousRooms: Map<string, Room> = new Map();
  private detectedRooms: Room[] = [];

  execute(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Store previous rooms for undo
    this.previousRooms = newGraph.getRooms();

    // Detect all rooms in the current floorplan
    this.detectedRooms = newGraph.detectAllRooms();
    
    if (this.detectedRooms.length === 0) return state;

    return {
      ...state,
      graph: newGraph,
    };
  }

  undo(state: CommandState): CommandState {
    const newGraph = state.graph.clone();
    
    // Restore previous rooms
    newGraph.restore(
      newGraph.getPoints(),
      newGraph.getWalls(),
      this.previousRooms
    );

    return {
      ...state,
      graph: newGraph,
    };
  }

  getDescription(): string {
    return `Detect rooms (found ${this.detectedRooms.length} rooms)`;
  }
}

/**
 * Command to clear all elements from the floorplan
 */
export class ClearAllCommand implements Command {
  private previousState: CommandState | null = null;

  execute(state: CommandState): CommandState {
    // Store entire state for undo
    this.previousState = {
      graph: state.graph.clone(),
      selectedIds: new Set(state.selectedIds),
    };

    // Create a new empty graph
    const clearedGraph = state.graph.clone();
    clearedGraph.clear();

    return {
      graph: clearedGraph,
      selectedIds: new Set(),
    };
  }

  undo(state: CommandState): CommandState {
    if (!this.previousState) return state;

    return {
      graph: this.previousState.graph.clone(),
      selectedIds: new Set(this.previousState.selectedIds),
    };
  }

  getDescription(): string {
    return 'Clear all';
  }
}

/**
 * Composite command that executes multiple commands as a single action
 * Useful for operations that need to be undone together
 */
export class CompositeCommand implements Command {
  private commands: Command[];
  private description: string;

  constructor(
    commands: Command[],
    description: string
  ) {
    this.commands = commands;
    this.description = description;
  }

  execute(state: CommandState): CommandState {
    let currentState = state;
    for (const command of this.commands) {
      currentState = command.execute(currentState);
    }
    return currentState;
  }

  undo(state: CommandState): CommandState {
    let currentState = state;
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      currentState = this.commands[i].undo(currentState);
    }
    return currentState;
  }

  getDescription(): string {
    return this.description;
  }
}

/**
 * Command History Manager
 * Manages the undo/redo stack and command execution
 */
export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;

  /**
   * Execute a command and add it to history
   */
  execute(command: Command, state: CommandState): CommandState {
    // Remove any commands after current index (when executing after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Execute the command
    const newState = command.execute(state);

    // Add to history
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    console.log(`Executed: ${command.getDescription()}`);
    return newState;
  }

  /**
   * Undo the last command
   */
  undo(state: CommandState): CommandState | null {
    if (!this.canUndo()) return null;

    const command = this.history[this.currentIndex];
    const newState = command.undo(state);
    this.currentIndex--;

    console.log(`Undone: ${command.getDescription()}`);
    return newState;
  }

  /**
   * Redo the next command
   */
  redo(state: CommandState): CommandState | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    const newState = command.execute(state);

    console.log(`Redone: ${command.getDescription()}`);
    return newState;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get the current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get a description of the command that would be undone
   */
  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].getDescription();
  }

  /**
   * Get a description of the command that would be redone
   */
  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].getDescription();
  }
}
