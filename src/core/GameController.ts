/**
 * Main game controller - manages game flow and state
 */

import {
  IGameController,
  IGameState,
  IGameAction,
  IActionResult,
  IGameConfig,
  GamePhase
} from './interfaces/IGame';
import { IGameRules } from './interfaces/IGameRules';
import { IAIPlayer } from '../ai/interfaces/IAI';
import { GameStateManager } from './GameStateManager';
import { TurnManager } from './TurnManager';
import { EventBus } from '../utils/EventBus';
import { GameEvents } from './GameEvents';

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