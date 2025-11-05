/**
 * TURBO - TURn-Based Operations
 * A modern, type-safe TypeScript library for turn-based game logic
 *
 * @version 2.0.0
 */

// Core exports
export { GameController } from './core/GameController';
export { GameStateManager } from './core/GameStateManager';
export { TurnManager } from './core/TurnManager';
export type { GameEvents } from './core/GameEvents';

// Interfaces
export type {
  IGameState,
  IPlayer,
  ITurnInfo,
  IGameAction,
  IActionValidation,
  IActionResult,
  ISideEffect,
  IGameConfig,
  IGameController,
} from './core/interfaces/IGame';

// Export enums as values (not just types)
export { PlayerType, GamePhase } from './core/interfaces/IGame';

export type {
  IGameRules,
  ITurnOrderStrategy,
} from './core/interfaces/IGameRules';

export { TurnOrderStrategies } from './core/interfaces/IGameRules';

// AI exports
export { BaseAI } from './ai/BaseAI';
export { RandomAI } from './ai/RandomAI';
export { GreedyAI } from './ai/GreedyAI';
export { MinimaxAI } from './ai/MinimaxAI';
export { MCTSAI } from './ai/MCTSAI';

export type {
  IAIPlayer,
  IAIConfig,
  IMCTSNode,
} from './ai/interfaces/IAI';

// Export AILevel enum as value
export { AILevel } from './ai/interfaces/IAI';

// Utility exports
export { deepClone, shallowClone } from './utils/deepClone';
export { EventBus } from './utils/EventBus';
export { SeededRandom, WeightedRandom } from './utils/Random';

// Version
export const VERSION = '2.0.0';

/**
 * Quick start example:
 *
 * ```typescript
 * import { GameController, RandomAI, AILevel } from '@bloombeasts/turbo';
 *
 * // Define your game rules
 * const rules = new MyGameRules();
 *
 * // Create game controller
 * const game = new GameController(rules);
 *
 * // Initialize with players
 * game.initialize({
 *   players: [
 *     { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
 *     { id: 'player2', name: 'Bob', type: PlayerType.AI }
 *   ]
 * });
 *
 * // Register AI
 * const ai = new RandomAI({
 *   playerId: 'player2',
 *   difficulty: AILevel.MEDIUM
 * });
 *
 * // Play the game
 * const action = { type: 'move', playerId: 'player1', data: {...} };
 * const result = game.executeAction(action);
 * ```
 */