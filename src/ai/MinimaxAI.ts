/**
 * Minimax AI with alpha-beta pruning
 */

import { BaseAI } from './BaseAI';
import { IGameState, IGameAction } from '../core/interfaces/IGame';
import { IAIConfig, AILevel } from './interfaces/IAI';

/**
 * AI using minimax algorithm with alpha-beta pruning
 */
export abstract class MinimaxAI<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
  extends BaseAI<TState, TAction> {

  protected maxDepth: number;

  constructor(config: IAIConfig) {
    super(config);
    this.maxDepth = config.maxDepth || this.getDepthByDifficulty(config.difficulty);
  }

  /**
   * Simulate an action and return resulting state
   * Must be implemented by specific game AI
   */
  abstract simulateAction(
    action: IGameAction<TAction>,
    state: IGameState<TState>
  ): IGameState<TState>;

  /**
   * Get available actions for a given state and player
   * Must be implemented by specific game AI
   */
  abstract getActionsForState(
    state: IGameState<TState>,
    playerId: string
  ): IGameAction<TAction>[];

  /**
   * Check if the game is over in given state
   * Must be implemented by specific game AI
   */
  abstract isTerminalState(state: IGameState<TState>): boolean;

  async chooseAction(
    state: IGameState<TState>,
    availableActions: IGameAction<TAction>[]
  ): Promise<IGameAction<TAction> | null> {
    await this.simulateThinking();

    if (availableActions.length === 0) {
      return null;
    }

    // Evaluate each action using minimax
    const evaluatedActions = availableActions.map(action => {
      const newState = this.simulateAction(action, state);
      const value = this.minimax(
        newState,
        this.maxDepth - 1,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        false // Next turn is opponent's
      );

      return {
        action,
        value: this.addNoise(value, 10),
      };
    });

    // Sort by value and return best action
    evaluatedActions.sort((a, b) => b.value - a.value);
    return evaluatedActions[0].action;
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private minimax(
    state: IGameState<TState>,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean
  ): number {
    // Terminal state or max depth reached
    if (depth === 0 || this.isTerminalState(state)) {
      return this.evaluateState(state);
    }

    const currentPlayerId = maximizingPlayer ? this.playerId : this.getOpponentIds(state)[0];
    const actions = this.getActionsForState(state, currentPlayerId);

    if (maximizingPlayer) {
      let maxEval = Number.NEGATIVE_INFINITY;

      for (const action of actions) {
        const newState = this.simulateAction(action, state);
        const evalValue = this.minimax(newState, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evalValue);
        alpha = Math.max(alpha, evalValue);

        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }

      return maxEval;
    } else {
      let minEval = Number.POSITIVE_INFINITY;

      for (const action of actions) {
        const newState = this.simulateAction(action, state);
        const evalValue = this.minimax(newState, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evalValue);
        beta = Math.min(beta, evalValue);

        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }

      return minEval;
    }
  }

  /**
   * Get search depth based on difficulty
   */
  private getDepthByDifficulty(level: AILevel): number {
    switch (level) {
      case AILevel.EASY:
        return 1;
      case AILevel.MEDIUM:
        return 2;
      case AILevel.HARD:
        return 3;
      case AILevel.EXPERT:
        return 4;
    }
  }
}