/**
 * Greedy AI - chooses action with best immediate value
 */

import { BaseAI } from './BaseAI';
import { IGameState, IGameAction } from '../core/interfaces/IGame';
import { IAIConfig } from './interfaces/IAI';

/**
 * AI that chooses the action with best immediate value
 */
export abstract class GreedyAI<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
  extends BaseAI<TState, TAction> {

  constructor(config: IAIConfig) {
    super(config);
  }

  /**
   * Evaluate an action's immediate value
   * Must be implemented by specific game AI
   */
  abstract evaluateAction(
    action: IGameAction<TAction>,
    state: IGameState<TState>
  ): number;

  async chooseAction(
    state: IGameState<TState>,
    availableActions: IGameAction<TAction>[]
  ): Promise<IGameAction<TAction> | null> {
    await this.simulateThinking();

    if (availableActions.length === 0) {
      return null;
    }

    // Evaluate all actions
    const evaluatedActions = availableActions.map(action => ({
      action,
      value: this.evaluateAction(action, state),
    }));

    // Add some noise based on difficulty
    evaluatedActions.forEach(ea => {
      ea.value = this.addNoise(ea.value, 20);
    });

    // Sort by value (descending) and pick best
    evaluatedActions.sort((a, b) => b.value - a.value);
    return evaluatedActions[0].action;
  }
}