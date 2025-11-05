/**
 * Game state management with history and undo/redo support
 */

import { IGameState } from './interfaces/IGame';
import { deepClone } from '../utils/deepClone';

/**
 * Manages game state with history tracking
 */
export class GameStateManager<TState extends Record<string, unknown> = Record<string, unknown>> {
  private currentState: IGameState<TState> | null = null;
  private history: IGameState<TState>[] = [];
  private redoStack: IGameState<TState>[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Set the current state
   */
  setState(state: IGameState<TState>): void {
    if (this.currentState) {
      this.history.push(deepClone(this.currentState));
    }

    this.currentState = deepClone(state);
    this.redoStack = []; // Clear redo stack on new state

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get current state (returns a clone to prevent mutations)
   */
  getCurrentState(): IGameState<TState> | null {
    return this.currentState ? deepClone(this.currentState) : null;
  }

  /**
   * Get state history
   */
  getHistory(): IGameState<TState>[] {
    return this.history.map(state => deepClone(state));
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * Undo to previous state
   */
  undo(): boolean {
    if (!this.canUndo() || !this.currentState) {
      return false;
    }

    this.redoStack.push(deepClone(this.currentState));
    this.currentState = this.history.pop()!;
    return true;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Redo to next state
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    if (this.currentState) {
      this.history.push(deepClone(this.currentState));
    }
    this.currentState = this.redoStack.pop()!;
    return true;
  }

  /**
   * Create a checkpoint
   */
  createCheckpoint(): string {
    const checkpointId = `checkpoint_${Date.now()}`;
    // Store checkpoint separately from history
    const checkpoint = this.currentState ? deepClone(this.currentState) : null;
    this.checkpoints.set(checkpointId, checkpoint);
    return checkpointId;
  }

  /**
   * Restore from checkpoint
   */
  restoreCheckpoint(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return false;
    }

    if (this.currentState) {
      this.history.push(deepClone(this.currentState));
    }
    this.currentState = deepClone(checkpoint);
    return true;
  }

  /**
   * Reset state manager
   */
  reset(): void {
    this.currentState = null;
    this.history = [];
    this.redoStack = [];
    this.checkpoints.clear();
  }

  private checkpoints = new Map<string, IGameState<TState> | null>();
}