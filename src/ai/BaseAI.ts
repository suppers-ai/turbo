/**
 * Base AI implementation with common functionality
 */

import { IAIPlayer, IAIConfig, AILevel, AsyncMethods } from './interfaces/IAI';
import { IGameState, IGameAction } from '../core/interfaces/IGame';

/**
 * Abstract base class for AI players
 */
export abstract class BaseAI<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
  implements IAIPlayer<TState, TAction> {

  protected readonly playerId: string;
  protected difficulty: AILevel;
  protected thinkingTime: { min: number; max: number };
  protected randomSeed?: string;
  protected async?: AsyncMethods;

  constructor(config: IAIConfig) {
    this.playerId = config.playerId;
    this.difficulty = config.difficulty;
    this.thinkingTime = config.thinkingTime || this.getDefaultThinkingTime(config.difficulty);
    this.randomSeed = config.randomSeed;
    this.async = config.async;
  }

  abstract chooseAction(
    state: IGameState<TState>,
    availableActions: IGameAction<TAction>[]
  ): Promise<IGameAction<TAction> | null>;

  abstract evaluateState(state: IGameState<TState>): number;

  getDifficulty(): AILevel {
    return this.difficulty;
  }

  setDifficulty(level: AILevel): void {
    this.difficulty = level;
    this.thinkingTime = this.getDefaultThinkingTime(level);
  }

  /**
   * Simulate thinking delay for better UX
   * Requires async methods to be provided in config
   */
  protected async simulateThinking(): Promise<void> {
    if (!this.async) {
      // No async methods provided - skip delay
      return Promise.resolve();
    }

    const delay = this.thinkingTime.min +
      Math.random() * (this.thinkingTime.max - this.thinkingTime.min);

    return new Promise(resolve => this.async!.setTimeout(resolve, delay));
  }

  /**
   * Add randomness based on difficulty
   */
  protected addNoise(value: number, maxNoise: number): number {
    const noiseFactor = this.getDifficultyNoiseFactor();
    const noise = (Math.random() - 0.5) * maxNoise * noiseFactor;
    return value + noise;
  }

  /**
   * Get default thinking times by difficulty
   */
  private getDefaultThinkingTime(level: AILevel): { min: number; max: number } {
    switch (level) {
      case AILevel.EASY:
        return { min: 200, max: 800 };
      case AILevel.MEDIUM:
        return { min: 300, max: 1200 };
      case AILevel.HARD:
        return { min: 500, max: 1500 };
      case AILevel.EXPERT:
        return { min: 800, max: 2000 };
    }
  }

  /**
   * Get noise factor based on difficulty (more noise = more mistakes)
   */
  private getDifficultyNoiseFactor(): number {
    switch (this.difficulty) {
      case AILevel.EASY:
        return 2.0;
      case AILevel.MEDIUM:
        return 1.0;
      case AILevel.HARD:
        return 0.5;
      case AILevel.EXPERT:
        return 0.2;
    }
  }

  /**
   * Check if this is the AI's turn
   */
  protected isMyTurn(state: IGameState<TState>): boolean {
    return state.turnInfo.currentPlayerId === this.playerId;
  }

  /**
   * Get opponent IDs
   */
  protected getOpponentIds(state: IGameState<TState>): string[] {
    return state.players
      .filter(p => p.id !== this.playerId)
      .map(p => p.id);
  }
}