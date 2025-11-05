/**
 * Game event definitions
 */

import { IGameState, IGameAction, IActionResult, IGameConfig, ISideEffect } from './interfaces/IGame';

/**
 * Game events type map
 */
export interface GameEvents<TState extends Record<string, unknown> = Record<string, unknown>> {
  [key: string]: unknown; // Index signature for EventBus compatibility

  gameStarted: {
    state: IGameState<TState>;
    config: IGameConfig;
  };

  gameEnded: {
    winnerId?: string;
    reason?: string;
    state: IGameState<TState>;
  };

  gameReset: Record<string, never>;

  turnStarted: {
    playerId: string;
    turnNumber: number;
  };

  turnEnded: {
    playerId: string;
    turnNumber: number;
  };

  actionExecuted: {
    action: IGameAction;
    result: IActionResult<TState>;
    state: IGameState<TState>;
  };

  actionUndone: {
    state: IGameState<TState>;
  };

  actionRedone: {
    state: IGameState<TState>;
  };

  sideEffect: ISideEffect;

  phaseChanged: {
    oldPhase: string;
    newPhase: string;
    state: IGameState<TState>;
  };

  error: {
    error: Error;
    context?: string;
  };
}