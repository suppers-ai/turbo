/**
 * Game rules interface - defines the rules and logic of a specific game
 */

import { IGameState, IGameAction, IActionValidation, IActionResult, IGameConfig } from './IGame';

/**
 * Interface for implementing game-specific rules
 */
export interface IGameRules<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Initialize the game state
   */
  createInitialState(config: IGameConfig): IGameState<TState>;

  /**
   * Validate if an action can be performed
   */
  validateAction(action: IGameAction<TAction>, state: IGameState<TState>): IActionValidation;

  /**
   * Execute an action and return the new state
   */
  executeAction(action: IGameAction<TAction>, state: IGameState<TState>): IActionResult<TState>;

  /**
   * Get all valid actions for the current state
   */
  getValidActions(state: IGameState<TState>): IGameAction<TAction>[];

  /**
   * Check if the game has ended
   */
  checkEndCondition(state: IGameState<TState>): { isEnded: boolean; winnerId?: string; reason?: string };

  /**
   * Calculate score for a player
   */
  calculateScore?(state: IGameState<TState>, playerId: string): number;

  /**
   * Get the next phase based on current state
   */
  getNextPhase?(currentPhase: string, state: IGameState<TState>): string;
}

/**
 * Turn order strategy interface
 */
export interface ITurnOrderStrategy {
  /**
   * Determine the next player
   */
  getNextPlayer(currentPlayerId: string, players: string[]): string;

  /**
   * Reset turn order (e.g., for a new round)
   */
  reset?(): void;
}

/**
 * Common turn order strategies
 */
export class TurnOrderStrategies {
  /**
   * Sequential turn order
   */
  static sequential(): ITurnOrderStrategy {
    return {
      getNextPlayer(currentPlayerId: string, players: string[]): string {
        const currentIndex = players.indexOf(currentPlayerId);
        const nextIndex = (currentIndex + 1) % players.length;
        return players[nextIndex];
      }
    };
  }

  /**
   * Random turn order
   */
  static random(): ITurnOrderStrategy {
    return {
      getNextPlayer(_currentPlayerId: string, players: string[]): string {
        return players[Math.floor(Math.random() * players.length)];
      }
    };
  }

  /**
   * Custom turn order with predefined sequence
   */
  static custom(sequence: string[]): ITurnOrderStrategy {
    let currentIndex = 0;
    return {
      getNextPlayer(): string {
        const player = sequence[currentIndex];
        currentIndex = (currentIndex + 1) % sequence.length;
        return player;
      },
      reset() {
        currentIndex = 0;
      }
    };
  }
}