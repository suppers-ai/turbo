/**
 * Turn management system
 */

import { IPlayer } from './interfaces/IGame';
import { ITurnOrderStrategy, TurnOrderStrategies } from './interfaces/IGameRules';

/**
 * Manages turn order and player rotation
 */
export class TurnManager {
  private players: IPlayer[] = [];
  private currentPlayerIndex = 0;
  private turnOrderStrategy: ITurnOrderStrategy;

  constructor(strategy?: ITurnOrderStrategy) {
    this.turnOrderStrategy = strategy || TurnOrderStrategies.sequential();
  }

  /**
   * Initialize with players
   */
  initialize(players: IPlayer[]): void {
    if (players.length < 1) {
      throw new Error('At least 1 players required');
    }

    this.players = [...players];
    this.currentPlayerIndex = 0;

    if (this.turnOrderStrategy.reset) {
      this.turnOrderStrategy.reset();
    }
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): IPlayer {
    if (this.players.length === 0) {
      throw new Error('Turn manager not initialized');
    }
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get next player
   */
  getNextPlayer(): string {
    if (this.players.length === 0) {
      throw new Error('Turn manager not initialized');
    }

    const currentPlayerId = this.players[this.currentPlayerIndex].id;
    const playerIds = this.players.map(p => p.id);
    const nextPlayerId = this.turnOrderStrategy.getNextPlayer(currentPlayerId, playerIds);

    // Update current player index
    this.currentPlayerIndex = this.players.findIndex(p => p.id === nextPlayerId);

    if (this.currentPlayerIndex === -1) {
      throw new Error(`Invalid next player ID: ${nextPlayerId}`);
    }

    return nextPlayerId;
  }

  /**
   * Set turn order strategy
   */
  setStrategy(strategy: ITurnOrderStrategy): void {
    this.turnOrderStrategy = strategy;
    if (strategy.reset) {
      strategy.reset();
    }
  }

  /**
   * Get all players
   */
  getPlayers(): IPlayer[] {
    return [...this.players];
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): IPlayer | undefined {
    return this.players.find(p => p.id === playerId);
  }

  /**
   * Reset turn manager
   */
  reset(): void {
    this.players = [];
    this.currentPlayerIndex = 0;
    if (this.turnOrderStrategy.reset) {
      this.turnOrderStrategy.reset();
    }
  }
}