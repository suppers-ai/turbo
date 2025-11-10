/**
 * TURBO - TURn-Based Operations
 * Standalone TypeScript Bundle (https://github.com/suppers-ai/turbo)
 *
 * This file contains the complete Turbo library in a single standalone TypeScript file.
 * All code is wrapped in the Turbo namespace to avoid global scope pollution.
 *
 * Usage:
 *   // Access types and classes via the Turbo namespace
 *   const game = new Turbo.GameController(rules);
 *   const ai = new Turbo.RandomAI(config);
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated: 2025-11-10T08:09:57.402Z
 * Files: 16
 *
 * @version 2.0.0
 * @license MIT
 */

/* eslint-disable */
/* tslint:disable */

// ==================== Turbo Namespace ====================

namespace Turbo {

  // ==================== Library Code ====================

  // ==================== src\core\interfaces\IGame.ts ====================

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

  // ==================== src\core\interfaces\IGameRules.ts ====================

  /**
   * Game rules interface - defines the rules and logic of a specific game
   */


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

  // ==================== src\ai\interfaces\IAI.ts ====================

  /**
   * AI player interfaces
   */


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
   * Platform async methods interface
   * Provides setTimeout, setInterval, clearTimeout, clearInterval
   */
  export interface AsyncMethods {
    setTimeout: (callback: (...args: any[]) => void, timeout?: number) => number;
    clearTimeout: (id: number) => void;
    setInterval: (callback: (...args: any[]) => void, timeout?: number) => number;
    clearInterval: (id: number) => void;
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
    async?: AsyncMethods;
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

  // ==================== src\utils\deepClone.ts ====================

  /**
   * Deep clone an object using manual cloning for consistency across all platforms
   * (Avoids structuredClone to ensure compatibility with all environments)
   */
  export function deepClone<T>(obj: T): T {
    return manualDeepClone(obj);
  }

  /**
   * Manual deep clone implementation
   */
  function manualDeepClone<T>(obj: T, visited = new WeakMap()): T {
    // Handle primitives and null
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle circular references
    if (visited.has(obj as unknown as object)) {
      return visited.get(obj as unknown as object) as T;
    }

    // Handle Date
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    // Handle RegExp
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as unknown as T;
    }

    // Handle Array
    if (Array.isArray(obj)) {
      const cloned: unknown[] = [];
      visited.set(obj, cloned as unknown as T);

      for (let i = 0; i < obj.length; i++) {
        cloned[i] = manualDeepClone(obj[i], visited);
      }

      return cloned as unknown as T;
    }

    // Handle Map
    if (obj instanceof Map) {
      const cloned = new Map();
      visited.set(obj, cloned as unknown as T);

      obj.forEach((value, key) => {
        cloned.set(
          manualDeepClone(key, visited),
          manualDeepClone(value, visited)
        );
      });

      return cloned as unknown as T;
    }

    // Handle Set
    if (obj instanceof Set) {
      const cloned = new Set();
      visited.set(obj, cloned as unknown as T);

      obj.forEach(value => {
        cloned.add(manualDeepClone(value, visited));
      });

      return cloned as unknown as T;
    }

    // Handle plain objects
    const cloned: Record<string, unknown> = {};
    visited.set(obj as unknown as object, cloned as unknown as T);

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = manualDeepClone(obj[key], visited);
      }
    }

    return cloned as T;
  }

  /**
   * Create a shallow clone of an object
   */
  export function shallowClone<T extends Record<string, unknown>>(obj: T): T {
    if (Array.isArray(obj)) {
      return [...obj] as unknown as T;
    }

    return { ...obj };
  }

  // ==================== src\core\GameStateManager.ts ====================

  /**
   * Game state management with history and undo/redo support
   */


  /**
   * Manages game state with history tracking
   */
  export class GameStateManager<TState extends Record<string, unknown> = Record<string, unknown>> {
    private currentState: IGameState<TState> | null = null;
    private history: IGameState<TState>[] = [];
    private redoStack: IGameState<TState>[] = [];
    private readonly maxHistorySize: number;

    constructor(maxHistorySize = 100) {
      this.maxHistorySize = maxHistorySize;
    }

    /**
     * Set the current state
     */
    setState(state: IGameState<TState>): void {
      if (this.currentState) {
        this.history.push(deepClone(this.currentState));
      }

      this.currentState = deepClone(state);
      this.redoStack = []; // Clear redo stack on new state

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
    }

    /**
     * Get current state (returns a clone to prevent mutations)
     */
    getCurrentState(): IGameState<TState> | null {
      return this.currentState ? deepClone(this.currentState) : null;
    }

    /**
     * Get state history
     */
    getHistory(): IGameState<TState>[] {
      return this.history.map(state => deepClone(state));
    }

    /**
     * Check if undo is possible
     */
    canUndo(): boolean {
      return this.history.length > 0;
    }

    /**
     * Undo to previous state
     */
    undo(): boolean {
      if (!this.canUndo() || !this.currentState) {
        return false;
      }

      this.redoStack.push(deepClone(this.currentState));
      this.currentState = this.history.pop()!;
      return true;
    }

    /**
     * Check if redo is possible
     */
    canRedo(): boolean {
      return this.redoStack.length > 0;
    }

    /**
     * Redo to next state
     */
    redo(): boolean {
      if (!this.canRedo()) {
        return false;
      }

      if (this.currentState) {
        this.history.push(deepClone(this.currentState));
      }
      this.currentState = this.redoStack.pop()!;
      return true;
    }

    /**
     * Create a checkpoint
     */
    createCheckpoint(): string {
      const checkpointId = `checkpoint_${Date.now()}`;
      // Store checkpoint separately from history
      const checkpoint = this.currentState ? deepClone(this.currentState) : null;
      this.checkpoints.set(checkpointId, checkpoint);
      return checkpointId;
    }

    /**
     * Restore from checkpoint
     */
    restoreCheckpoint(checkpointId: string): boolean {
      const checkpoint = this.checkpoints.get(checkpointId);
      if (!checkpoint) {
        return false;
      }

      if (this.currentState) {
        this.history.push(deepClone(this.currentState));
      }
      this.currentState = deepClone(checkpoint);
      return true;
    }

    /**
     * Reset state manager
     */
    reset(): void {
      this.currentState = null;
      this.history = [];
      this.redoStack = [];
      this.checkpoints.clear();
    }

    private checkpoints = new Map<string, IGameState<TState> | null>();
  }

  // ==================== src\core\TurnManager.ts ====================

  /**
   * Turn management system
   */


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
      if (players.length < 2) {
        throw new Error('At least 2 players required');
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

  // ==================== src\utils\EventBus.ts ====================

  /**
   * Type-safe event bus for game events
   */

  type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

  /**
   * Type-safe event emitter
   */
  export class EventBus<TEvents extends Record<string, unknown>> {
    private listeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();
    private onceListeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

    /**
     * Subscribe to an event
     */
    on<K extends keyof TEvents>(
      event: K,
      handler: EventHandler<TEvents[K]>
    ): () => void {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }

      const handlers = this.listeners.get(event)!;
      handlers.add(handler as EventHandler<unknown>);

      // Return unsubscribe function
      return () => {
        handlers.delete(handler as EventHandler<unknown>);

        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      };
    }

    /**
     * Subscribe to an event once
     */
    once<K extends keyof TEvents>(
      event: K,
      handler: EventHandler<TEvents[K]>
    ): void {
      if (!this.onceListeners.has(event)) {
        this.onceListeners.set(event, new Set());
      }

      this.onceListeners.get(event)!.add(handler as EventHandler<unknown>);
    }

    /**
     * Emit an event
     */
    emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
      // Handle regular listeners
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${String(event)}:`, error);
          }
        });
      }

      // Handle once listeners
      const onceHandlers = this.onceListeners.get(event);
      if (onceHandlers) {
        onceHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in once handler for ${String(event)}:`, error);
          }
        });

        this.onceListeners.delete(event);
      }
    }

    /**
     * Emit an event asynchronously
     */
    async emitAsync<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
      const handlers = this.listeners.get(event);
      const onceHandlers = this.onceListeners.get(event);

      const allHandlers = [
        ...(handlers ? Array.from(handlers) : []),
        ...(onceHandlers ? Array.from(onceHandlers) : []),
      ];

      await Promise.all(
        allHandlers.map(async handler => {
          try {
            await handler(data);
          } catch (error) {
            console.error(`Error in async handler for ${String(event)}:`, error);
          }
        })
      );

      if (onceHandlers) {
        this.onceListeners.delete(event);
      }
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event?: keyof TEvents): void {
      if (event) {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
      } else {
        this.listeners.clear();
        this.onceListeners.clear();
      }
    }

    /**
     * Get listener count for an event
     */
    listenerCount(event: keyof TEvents): number {
      const regular = this.listeners.get(event)?.size || 0;
      const once = this.onceListeners.get(event)?.size || 0;
      return regular + once;
    }

    /**
     * Check if there are any listeners for an event
     */
    hasListeners(event: keyof TEvents): boolean {
      return this.listenerCount(event) > 0;
    }
  }

  // ==================== src\core\GameEvents.ts ====================

  /**
   * Game event definitions
   */


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

  // ==================== src\core\GameController.ts ====================

  /**
   * Main game controller - manages game flow and state
   */


  /**
   * Core game controller implementation
   */
  export class GameController<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
    implements IGameController<TState, TAction> {

    private readonly rules: IGameRules<TState, TAction>;
    private readonly stateManager: GameStateManager<TState>;
    private readonly turnManager: TurnManager;
    private readonly eventBus: EventBus<GameEvents<TState>> = new EventBus() as EventBus<GameEvents<TState>>;
    private readonly aiPlayers: Map<string, IAIPlayer<TState, TAction>> = new Map();
    private config: IGameConfig | null = null;

    constructor(rules: IGameRules<TState, TAction>) {
      this.rules = rules;
      this.stateManager = new GameStateManager<TState>();
      this.turnManager = new TurnManager();
    }

    /**
     * Initialize a new game
     */
    initialize(config: IGameConfig): void {
      this.validateConfig(config);

      this.config = config;
      const initialState = this.rules.createInitialState(config);

      this.stateManager.setState(initialState);
      this.turnManager.initialize(config.players);

      this.eventBus.emit('gameStarted', { state: initialState, config });
      this.eventBus.emit('turnStarted', {
        playerId: initialState.turnInfo.currentPlayerId,
        turnNumber: initialState.turnInfo.turnNumber
      });
    }

    /**
     * Get current game state
     */
    getState(): IGameState<TState> {
      const state = this.stateManager.getCurrentState();
      if (!state) {
        throw new Error('Game not initialized');
      }
      return state;
    }

    /**
     * Execute a game action
     */
    executeAction(action: IGameAction<TAction>): IActionResult<TState> {
      const currentState = this.getState();

      // Validate action
      const validation = this.rules.validateAction(action, currentState);
      if (!validation.isValid) {
        return {
          success: false,
          error: new Error(validation.reason || 'Invalid action'),
        };
      }

      // Execute action
      const result = this.rules.executeAction(action, currentState);

      if (result.success && result.newState) {
        // Update state
        this.stateManager.setState(result.newState);

        // Emit events
        this.eventBus.emit('actionExecuted', { action, result, state: result.newState });

        if (result.sideEffects) {
          result.sideEffects.forEach(effect => {
            this.eventBus.emit('sideEffect', effect);
          });
        }

        // Check end condition
        const endCheck = this.rules.checkEndCondition(result.newState);
        if (endCheck.isEnded) {
          this.handleGameEnd(endCheck.winnerId, endCheck.reason);
        }
      }

      return result;
    }

    /**
     * End the current turn
     */
    endTurn(): void {
      const currentState = this.getState();

      if (currentState.isComplete) {
        return;
      }

      const currentPlayerId = currentState.turnInfo.currentPlayerId;
      const nextPlayerId = this.turnManager.getNextPlayer();
      const currentTurnNumber = currentState.turnInfo.turnNumber;

      // Update state with new turn info
      const newState: IGameState<TState> = {
        ...currentState,
        turnInfo: {
          ...currentState.turnInfo,
          currentPlayerId: nextPlayerId,
          turnNumber: currentTurnNumber + 1,
          movesThisTurn: 0,
          timeStarted: Date.now(),
        },
      };

      this.stateManager.setState(newState);

      // Emit events
      this.eventBus.emit('turnEnded', {
        playerId: currentPlayerId,
        turnNumber: currentTurnNumber
      });

      this.eventBus.emit('turnStarted', {
        playerId: nextPlayerId,
        turnNumber: currentTurnNumber + 1
      });
    }

    /**
     * Check if the game is over
     */
    isGameOver(): boolean {
      return this.getState().isComplete;
    }

    /**
     * Get the winner
     */
    getWinner(): string | undefined {
      const state = this.getState();
      return state.isComplete ? state.winnerId : undefined;
    }

    /**
     * Reset the game
     */
    reset(): void {
      this.stateManager.reset();
      this.turnManager.reset();
      this.config = null;
      this.eventBus.emit('gameReset', {});
    }

    /**
     * Subscribe to game events
     */
    on<K extends keyof GameEvents<TState>>(
      event: K,
      handler: (data: GameEvents<TState>[K]) => void
    ): () => void {
      return this.eventBus.on(event, handler);
    }

    /**
     * Get available actions for the current state
     */
    getAvailableActions(): IGameAction<TAction>[] {
      const currentState = this.getState();
      return this.rules.getValidActions(currentState);
    }

    /**
     * Register an AI player
     */
    registerAI(playerId: string, ai: IAIPlayer<TState, TAction>): void {
      this.aiPlayers.set(playerId, ai);
    }

    /**
     * Unregister an AI player
     */
    unregisterAI(playerId: string): void {
      this.aiPlayers.delete(playerId);
    }

    /**
     * Check if a player is controlled by AI
     */
    isAIPlayer(playerId: string): boolean {
      return this.aiPlayers.has(playerId);
    }

    /**
     * Execute AI turn for the current player
     */
    async executeAITurn(): Promise<void> {
      const currentState = this.getState();
      const currentPlayerId = currentState.turnInfo.currentPlayerId;
      const ai = this.aiPlayers.get(currentPlayerId);

      if (!ai) {
        throw new Error(`No AI registered for player ${currentPlayerId}`);
      }

      const availableActions = this.getAvailableActions();
      const action = await ai.chooseAction(currentState, availableActions);

      if (action) {
        this.executeAction(action);
      }
    }

    /**
     * Get the complete winner information, checking if complete
     */
    isComplete(): boolean {
      return this.getState().isComplete;
    }

    /**
     * Perform an action (legacy method name for compatibility)
     */
    performAction(action: IGameAction<TAction>): IActionResult<TState> {
      return this.executeAction(action);
    }

    /**
     * Get action history
     */
    getActionHistory() {
      return this.stateManager.getHistory();
    }

    /**
     * Undo last action
     */
    undo(): boolean {
      const success = this.stateManager.undo();
      if (success) {
        this.eventBus.emit('actionUndone', { state: this.getState() });
      }
      return success;
    }

    /**
     * Redo previously undone action
     */
    redo(): boolean {
      const success = this.stateManager.redo();
      if (success) {
        this.eventBus.emit('actionRedone', { state: this.getState() });
      }
      return success;
    }

    private validateConfig(config: IGameConfig): void {
      if (!config.players || config.players.length < 2) {
        throw new Error('At least 2 players are required');
      }

      const playerIds = new Set(config.players.map(p => p.id));
      if (playerIds.size !== config.players.length) {
        throw new Error('Player IDs must be unique');
      }
    }

    private handleGameEnd(winnerId?: string, reason?: string): void {
      const state = this.getState();
      const endState: IGameState<TState> = {
        ...state,
        isComplete: true,
        winnerId,
        phase: GamePhase.COMPLETED,
      };

      this.stateManager.setState(endState);
      this.eventBus.emit('gameEnded', { winnerId, reason, state: endState });
    }
  }

  // ==================== src\ai\BaseAI.ts ====================

  /**
   * Base AI implementation with common functionality
   */


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

  // ==================== src\ai\RandomAI.ts ====================

  /**
   * Random AI - chooses actions randomly
   */


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

  // ==================== src\ai\GreedyAI.ts ====================

  /**
   * Greedy AI - chooses action with best immediate value
   */


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

  // ==================== src\ai\MinimaxAI.ts ====================

  /**
   * Minimax AI with alpha-beta pruning
   */


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

  // ==================== src\ai\MCTSAI.ts ====================

  /**
   * Monte Carlo Tree Search AI
   */


  /**
   * MCTS Node implementation
   */
  class MCTSNode<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
    implements IMCTSNode<TState, TAction> {

    state: IGameState<TState>;
    action: IGameAction<TAction> | null;
    parent: MCTSNode<TState, TAction> | null;
    children: MCTSNode<TState, TAction>[] = [];
    visits = 0;
    totalValue = 0;

    constructor(
      state: IGameState<TState>,
      action: IGameAction<TAction> | null = null,
      parent: MCTSNode<TState, TAction> | null = null
    ) {
      this.state = state;
      this.action = action;
      this.parent = parent;
    }

    isLeaf(): boolean {
      return this.children.length === 0;
    }

    addChild(child: MCTSNode<TState, TAction>): void {
      this.children.push(child);
    }

    getBestChild(explorationConstant: number): MCTSNode<TState, TAction> | null {
      if (this.children.length === 0) {
        return null;
      }

      let bestChild = this.children[0];
      let bestValue = this.getUCB1Value(bestChild, explorationConstant);

      for (const child of this.children) {
        const value = this.getUCB1Value(child, explorationConstant);
        if (value > bestValue) {
          bestValue = value;
          bestChild = child;
        }
      }

      return bestChild;
    }

    private getUCB1Value(child: MCTSNode<TState, TAction>, c: number): number {
      if (child.visits === 0) {
        return Number.POSITIVE_INFINITY;
      }

      const exploitation = child.totalValue / child.visits;
      const exploration = c * Math.sqrt(Math.log(this.visits) / child.visits);
      return exploitation + exploration;
    }
  }

  /**
   * AI using Monte Carlo Tree Search
   */
  export abstract class MCTSAI<TState extends Record<string, unknown> = Record<string, unknown>, TAction extends Record<string, unknown> = Record<string, unknown>>
    extends BaseAI<TState, TAction> {

    protected iterations: number;
    protected explorationConstant = 1.414;

    constructor(config: IAIConfig) {
      super(config);
      this.iterations = this.getIterationsByDifficulty(config.difficulty);
    }

    /**
     * Simulate a random playout from given state
     * Must be implemented by specific game AI
     */
    abstract simulatePlayout(state: IGameState<TState>): number;

    /**
     * Get available actions for a given state and player
     * Must be implemented by specific game AI
     */
    abstract getActionsForState(
      state: IGameState<TState>,
      playerId: string
    ): IGameAction<TAction>[];

    /**
     * Simulate an action and return resulting state
     * Must be implemented by specific game AI
     */
    abstract simulateAction(
      action: IGameAction<TAction>,
      state: IGameState<TState>
    ): IGameState<TState>;

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

      // Create root node
      const root = new MCTSNode<TState, TAction>(state);

      // Run MCTS iterations
      for (let i = 0; i < this.iterations; i++) {
        let node = root;

        // Selection - traverse tree to leaf
        while (!node.isLeaf() && !this.isTerminalState(node.state)) {
          const best = node.getBestChild(this.explorationConstant);
          if (!best) break;
          node = best;
        }

        // Expansion - add child if not terminal
        if (!this.isTerminalState(node.state)) {
          node = this.expand(node);
        }

        // Simulation - random playout
        const value = this.simulatePlayout(node.state);

        // Backpropagation - update values up the tree
        this.backpropagate(node, value);
      }

      // Choose action with most visits
      let bestChild = root.children[0];
      for (const child of root.children) {
        if (child.visits > bestChild.visits) {
          bestChild = child;
        }
      }

      return bestChild?.action || null;
    }

    /**
     * Expand node by adding all possible children
     */
    private expand(node: MCTSNode<TState, TAction>): MCTSNode<TState, TAction> {
      const currentPlayerId = node.state.turnInfo.currentPlayerId;
      const actions = this.getActionsForState(node.state, currentPlayerId);

      // Add all possible children
      for (const action of actions) {
        const newState = this.simulateAction(action, node.state);
        const child = new MCTSNode(newState, action, node);
        node.addChild(child);
      }

      // Return random child for simulation
      if (node.children.length > 0) {
        return node.children[Math.floor(Math.random() * node.children.length)];
      }

      return node;
    }

    /**
     * Backpropagate value up the tree
     */
    private backpropagate(node: MCTSNode<TState, TAction> | null, value: number): void {
      while (node !== null) {
        node.visits++;
        node.totalValue += value;
        node = node.parent;
      }
    }

    /**
     * Get iterations based on difficulty
     */
    private getIterationsByDifficulty(level: AILevel): number {
      switch (level) {
        case AILevel.EASY:
          return 100;
        case AILevel.MEDIUM:
          return 500;
        case AILevel.HARD:
          return 1000;
        case AILevel.EXPERT:
          return 2000;
      }
    }
  }

  // ==================== src\utils\Random.ts ====================

  /**
   * Random number generation utilities with seeding support
   */

  /**
   * Seeded random number generator using xorshift algorithm
   */
  export class SeededRandom {
    private seed: number;

    constructor(seed: string | number) {
      this.seed = typeof seed === 'string' ? this.hashString(seed) : seed;
    }

    /**
     * Generate a random number between 0 and 1
     */
    next(): number {
      this.seed = (this.seed * 9301 + 49297) % 233280;
      return this.seed / 233280;
    }

    /**
     * Generate a random integer between min and max (inclusive)
     */
    nextInt(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate a random boolean
     */
    nextBoolean(probability = 0.5): boolean {
      return this.next() < probability;
    }

    /**
     * Shuffle an array
     */
    shuffle<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i);
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    /**
     * Pick a random element from an array
     */
    pick<T>(array: T[]): T | undefined {
      if (array.length === 0) return undefined;
      return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * Pick multiple random elements without replacement
     */
    pickMultiple<T>(array: T[], count: number): T[] {
      const shuffled = this.shuffle(array);
      return shuffled.slice(0, Math.min(count, array.length));
    }

    /**
     * Generate a normally distributed random number (Box-Muller transform)
     */
    gaussian(mean = 0, stdDev = 1): number {
      let u1 = 0;
      let u2 = 0;

      while (u1 === 0) u1 = this.next(); // Converting [0,1) to (0,1)
      while (u2 === 0) u2 = this.next();

      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return z0 * stdDev + mean;
    }

    private hashString(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    }
  }

  /**
   * Weighted random selector
   */
  export class WeightedRandom<T> {
    private items: Array<{ item: T; weight: number }>;
    private totalWeight: number;

    constructor(items: Array<{ item: T; weight: number }>) {
      this.items = items;
      this.totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    }

    /**
     * Select a random item based on weights
     */
    select(random: () => number = Math.random): T | undefined {
      if (this.items.length === 0 || this.totalWeight === 0) {
        return undefined;
      }

      let randomValue = random() * this.totalWeight;

      for (const { item, weight } of this.items) {
        randomValue -= weight;
        if (randomValue <= 0) {
          return item;
        }
      }

      return this.items[this.items.length - 1].item;
    }

    /**
     * Update weight for an item
     */
    updateWeight(item: T, newWeight: number): void {
      const entry = this.items.find(e => e.item === item);
      if (entry) {
        this.totalWeight = this.totalWeight - entry.weight + newWeight;
        entry.weight = newWeight;
      }
    }

    /**
     * Add a new item with weight
     */
    add(item: T, weight: number): void {
      this.items.push({ item, weight });
      this.totalWeight += weight;
    }

    /**
     * Remove an item
     */
    remove(item: T): boolean {
      const index = this.items.findIndex(e => e.item === item);
      if (index !== -1) {
        this.totalWeight -= this.items[index].weight;
        this.items.splice(index, 1);
        return true;
      }
      return false;
    }
  }

  // ==================== src\index.ts ====================

  /**
   * TURBO - TURn-Based Operations
   * A modern, type-safe TypeScript library for turn-based game logic
   *
   * @version 2.0.0
   */

  // Core exports

  // Interfaces

  // Export enums as values (not just types)



  // AI exports


  // Export AILevel enum as value

  // Utility exports

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

}

// Export the namespace as a module
export { Turbo };

// Make Turbo available globally
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Turbo = Turbo;
}
