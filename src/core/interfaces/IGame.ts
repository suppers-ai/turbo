/**
 * Core game interfaces with proper type safety
 */

/**
 * Base game state interface
 */
export interface IGameState<TState extends Record<string, unknown> = Record<string, unknown>> {
  /** Game-specific state managed by the implementation */
  gameData: TState;

  /** Current turn information */
  turnInfo: ITurnInfo;

  /** Players in the game */
  players: IPlayer[];

  /** Current game phase */
  phase: GamePhase;

  /** Whether the game is complete */
  isComplete: boolean;

  /** Winner ID if game is complete */
  winnerId?: string;
}

/**
 * Player interface
 */
export interface IPlayer {
  readonly id: string;
  readonly name: string;
  readonly type: PlayerType;
  metadata?: Record<string, unknown>;
}

/**
 * Player type enumeration
 */
export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai',
}

/**
 * Turn information
 */
export interface ITurnInfo {
  turnNumber: number;
  currentPlayerId: string;
  movesThisTurn: number;
  maxMovesPerTurn?: number;
  timeStarted: number;
}

/**
 * Game phase enumeration
 */
export enum GamePhase {
  NOT_STARTED = 'not_started',
  SETUP = 'setup',
  PLAYING = 'playing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

/**
 * Game action interface
 */
export interface IGameAction<TActionData extends Record<string, unknown> = Record<string, unknown>> {
  readonly type: string;
  readonly playerId: string;
  readonly data: TActionData;
  readonly timestamp?: number;
}

/**
 * Action validation result
 */
export interface IActionValidation {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly suggestions?: string[];
}

/**
 * Action execution result
 */
export interface IActionResult<TState extends Record<string, unknown> = Record<string, unknown>> {
  readonly success: boolean;
  readonly newState?: IGameState<TState>;
  readonly error?: Error;
  readonly sideEffects?: ISideEffect[];
}

/**
 * Side effect from an action
 */
export interface ISideEffect {
  readonly type: string;
  readonly description: string;
  readonly data?: Record<string, unknown>;
}

/**
 * Game configuration
 */
export interface IGameConfig {
  readonly players: IPlayer[];
  readonly seed?: string;
  readonly timeLimit?: number;
  readonly customRules?: Record<string, unknown>;
}

/**
 * Game controller interface
 */
export interface IGameController<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>> {
  initialize(config: IGameConfig): void;
  getState(): IGameState<TState>;
  executeAction(action: IGameAction<TAction>): IActionResult<TState>;
  endTurn(): void;
  isGameOver(): boolean;
  getWinner(): string | undefined;
  reset(): void;
}