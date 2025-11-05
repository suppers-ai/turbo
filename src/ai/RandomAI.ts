/**
 * Random AI - chooses actions randomly
 */

import { BaseAI } from './BaseAI';
import { IGameState, IGameAction } from '../core/interfaces/IGame';
import { IAIConfig } from './interfaces/IAI';

/**
 * AI that chooses random actions
 */
export class RandomAI<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
  extends BaseAI<TState, TAction> {

  constructor(config: IAIConfig) {
    super(config);
  }

  async chooseAction(
    _state: IGameState<TState>,
    availableActions: IGameAction<TAction>[]
  ): Promise<IGameAction<TAction> | null> {
    await this.simulateThinking();

    if (availableActions.length === 0) {
      return null;
    }

    // Choose random action
    const randomIndex = Math.floor(Math.random() * availableActions.length);
    return availableActions[randomIndex];
  }

  evaluateState(_state: IGameState<TState>): number {
    // Random AI doesn't evaluate, just returns random value
    return Math.random() * 100;
  }
}