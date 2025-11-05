/**
 * AI player interfaces
 */

import { IGameState, IGameAction } from '../../core/interfaces/IGame';

/**
 * Base AI player interface
 */
export interface IAIPlayer<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Choose an action based on current state
   */
  chooseAction(
    state: IGameState<TState>,
    availableActions: IGameAction<TAction>[]
  ): Promise<IGameAction<TAction> | null>;

  /**
   * Evaluate the state (higher is better for this player)
   */
  evaluateState(state: IGameState<TState>): number;

  /**
   * Get AI difficulty level
   */
  getDifficulty(): AILevel;

  /**
   * Set AI difficulty level
   */
  setDifficulty(level: AILevel): void;
}

/**
 * AI difficulty levels
 */
export enum AILevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

/**
 * AI configuration
 */
export interface IAIConfig {
  playerId: string;
  difficulty: AILevel;
  thinkingTime?: {
    min: number;
    max: number;
  };
  randomSeed?: string;
  maxDepth?: number;
  evaluationFunction?: (state: IGameState) => number;
}

/**
 * Monte Carlo Tree Search node
 */
export interface IMCTSNode<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>> {
  state: IGameState<TState>;
  action: IGameAction<TAction> | null;
  parent: IMCTSNode<TState, TAction> | null;
  children: IMCTSNode<TState, TAction>[];
  visits: number;
  totalValue: number;

  isLeaf(): boolean;
  addChild(child: IMCTSNode<TState, TAction>): void;
  getBestChild(explorationConstant: number): IMCTSNode<TState, TAction> | null;
}