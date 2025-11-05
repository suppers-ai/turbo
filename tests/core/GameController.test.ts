/**
 * Tests for GameController - the core game controller
 */

import { GameController } from '../../src/core/GameController';
import {
  IGameRules,
  IGameState,
  IGameAction,
  IActionResult,
  IActionValidation,
  IGameConfig,
  GamePhase,
  PlayerType,
} from '../../src';

/**
 * Mock game implementation for testing
 */
interface TestGameState extends Record<string, unknown> {
  players: Array<{
    id: string;
    name: string;
    health: number;
    hand: number[];
  }>;
  board: number[];
  gameOver: boolean;
}

interface TestActionData extends Record<string, unknown> {
  type: 'draw' | 'play' | 'attack' | 'end_turn';
  value?: number;
  target?: string;
}

class TestGameRules implements IGameRules<TestGameState, TestActionData> {
  createInitialState(config: IGameConfig): IGameState<TestGameState> {
    return {
      gameData: {
        players: config.players.map(p => ({
          id: p.id,
          name: p.name,
          health: 20,
          hand: [1, 2, 3]
        })),
        board: [],
        gameOver: false
      },
      turnInfo: {
        turnNumber: 1,
        currentPlayerId: config.players[0].id,
        movesThisTurn: 0,
        timeStarted: Date.now()
      },
      players: config.players,
      phase: GamePhase.PLAYING,
      isComplete: false
    };
  }

  validateAction(action: IGameAction<TestActionData>, state: IGameState<TestGameState>): IActionValidation {
    const currentPlayer = state.gameData.players.find(p => p.id === state.turnInfo.currentPlayerId);

    if (!currentPlayer || action.playerId !== currentPlayer.id) {
      return { isValid: false, reason: 'Not your turn' };
    }

    switch (action.data.type) {
      case 'draw':
        if (currentPlayer.hand.length >= 7) {
          return { isValid: false, reason: 'Hand is full' };
        }
        break;
      case 'play':
        if (!action.data.value || !currentPlayer.hand.includes(action.data.value)) {
          return { isValid: false, reason: 'Card not in hand' };
        }
        break;
      case 'attack':
        if (!action.data.value || !state.gameData.board.includes(action.data.value)) {
          return { isValid: false, reason: 'Unit not on board' };
        }
        break;
    }

    return { isValid: true };
  }

  executeAction(action: IGameAction<TestActionData>, state: IGameState<TestGameState>): IActionResult<TestGameState> {
    const newState: IGameState<TestGameState> = JSON.parse(JSON.stringify(state));
    const currentPlayer = newState.gameData.players.find(p => p.id === action.playerId);

    if (!currentPlayer) {
      return { success: false, error: new Error('Player not found') };
    }

    const sideEffects = [];

    switch (action.data.type) {
      case 'draw':
        const card = Math.floor(Math.random() * 10) + 1;
        currentPlayer.hand.push(card);
        sideEffects.push({
          type: 'card_drawn',
          description: `Player ${currentPlayer.name} drew a card`,
          data: { card }
        });
        break;

      case 'play':
        const cardIndex = currentPlayer.hand.indexOf(action.data.value!);
        if (cardIndex !== -1) {
          currentPlayer.hand.splice(cardIndex, 1);
          newState.gameData.board.push(action.data.value!);
          sideEffects.push({
            type: 'card_played',
            description: `Player ${currentPlayer.name} played card ${action.data.value}`,
            data: { card: action.data.value }
          });
        }
        break;

      case 'attack':
        const targetPlayer = newState.gameData.players.find(p => p.id === action.data.target);
        if (targetPlayer) {
          targetPlayer.health -= action.data.value || 1;
          sideEffects.push({
            type: 'damage_dealt',
            description: `Player ${currentPlayer.name} dealt ${action.data.value || 1} damage to ${targetPlayer.name}`,
            data: { target: action.data.target, damage: action.data.value || 1 }
          });
        }
        break;

      case 'end_turn':
        // Turn ending is handled by GameController.endTurn()
        return { success: true, newState, sideEffects: [] };
    }

    newState.turnInfo.movesThisTurn++;

    return {
      success: true,
      newState,
      sideEffects
    };
  }

  getValidActions(state: IGameState<TestGameState>): IGameAction<TestActionData>[] {
    const currentPlayer = state.gameData.players.find(p => p.id === state.turnInfo.currentPlayerId);
    if (!currentPlayer) return [];

    const actions: IGameAction<TestActionData>[] = [];

    // Draw action
    if (currentPlayer.hand.length < 7) {
      actions.push({
        type: 'game_action',
        playerId: currentPlayer.id,
        data: { type: 'draw' },
        timestamp: Date.now()
      });
    }

    // Play actions
    currentPlayer.hand.forEach(card => {
      actions.push({
        type: 'game_action',
        playerId: currentPlayer.id,
        data: { type: 'play', value: card },
        timestamp: Date.now()
      });
    });

    // Attack actions
    state.gameData.board.forEach(unit => {
      state.gameData.players.forEach(target => {
        if (target.id !== currentPlayer.id) {
          actions.push({
            type: 'game_action',
            playerId: currentPlayer.id,
            data: { type: 'attack', value: unit, target: target.id },
            timestamp: Date.now()
          });
        }
      });
    });

    // End turn
    actions.push({
      type: 'game_action',
      playerId: currentPlayer.id,
      data: { type: 'end_turn' },
      timestamp: Date.now()
    });

    return actions;
  }

  checkEndCondition(state: IGameState<TestGameState>): { isEnded: boolean; winnerId?: string; reason?: string } {
    // Check if any player has 0 health
    const deadPlayer = state.gameData.players.find(p => p.health <= 0);
    if (deadPlayer) {
      const winner = state.gameData.players.find(p => p.health > 0);
      return {
        isEnded: true,
        winnerId: winner?.id,
        reason: 'Player eliminated'
      };
    }

    return { isEnded: false };
  }

  calculateScore(state: IGameState<TestGameState>, playerId: string): number {
    const player = state.gameData.players.find(p => p.id === playerId);
    return player ? player.health : 0;
  }
}

describe('GameController', () => {
  let game: GameController<TestGameState, TestActionData>;
  let rules: TestGameRules;

  beforeEach(() => {
    rules = new TestGameRules();
    game = new GameController(rules);
  });

  describe('Initialization', () => {
    test('should initialize game with two players', () => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };

      game.initialize(config);
      const state = game.getState();

      expect(state.gameData.players).toHaveLength(2);
      expect(state.gameData.players[0].id).toBe('player1');
      expect(state.gameData.players[1].id).toBe('player2');
      expect(state.gameData.players[0].health).toBe(20);
      expect(state.gameData.players[0].hand).toEqual([1, 2, 3]);
      expect(state.gameData.board).toEqual([]);
      expect(state.gameData.gameOver).toBe(false);
    });

    test('should set first player as current player', () => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };

      game.initialize(config);
      const state = game.getState();

      expect(state.turnInfo.currentPlayerId).toBe('player1');
      expect(state.turnInfo.turnNumber).toBe(1);
    });

    test('should throw error if not enough players', () => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN }
        ]
      };

      expect(() => game.initialize(config)).toThrow('At least 2 players are required');
    });

    test('should throw error if performing action before initialization', () => {
      const action: IGameAction<TestActionData> = {
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'draw' },
        timestamp: Date.now()
      };

      expect(() => game.executeAction(action)).toThrow('Game not initialized');
    });
  });

  describe('Action Validation', () => {
    beforeEach(() => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };
      game.initialize(config);
    });

    test('should reject action from wrong player', () => {
      const action: IGameAction<TestActionData> = {
        type: 'game_action',
        playerId: 'player2', // Not current player
        data: { type: 'draw' },
        timestamp: Date.now()
      };

      const result = game.executeAction(action);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Not your turn');
    });

    test('should reject drawing when hand is full', () => {
      // Fill the hand first
      for (let i = 0; i < 4; i++) {
        game.executeAction({
          type: 'game_action',
          playerId: 'player1',
          data: { type: 'draw' },
          timestamp: Date.now()
        });
      }

      // Try to draw when hand is full (7 cards)
      const result = game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'draw' },
        timestamp: Date.now()
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Hand is full');
    });

    test('should reject playing card not in hand', () => {
      const action: IGameAction<TestActionData> = {
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'play', value: 99 }, // Card not in hand
        timestamp: Date.now()
      };

      const result = game.executeAction(action);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Card not in hand');
    });
  });

  describe('Turn Management', () => {
    beforeEach(() => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };
      game.initialize(config);
    });

    test('should switch turns correctly', () => {
      let state = game.getState();
      expect(state.turnInfo.currentPlayerId).toBe('player1');
      expect(state.turnInfo.turnNumber).toBe(1);

      // End turn
      game.endTurn();

      state = game.getState();
      expect(state.turnInfo.currentPlayerId).toBe('player2');
      expect(state.turnInfo.turnNumber).toBe(2);

      // End turn again
      game.endTurn();

      state = game.getState();
      expect(state.turnInfo.currentPlayerId).toBe('player1');
      expect(state.turnInfo.turnNumber).toBe(3);
    });

    test('should track number of moves', () => {
      let state = game.getState();
      expect(state.turnInfo.movesThisTurn).toBe(0);

      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'draw' },
        timestamp: Date.now()
      });

      state = game.getState();
      expect(state.turnInfo.movesThisTurn).toBe(1);

      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'play', value: 1 },
        timestamp: Date.now()
      });

      state = game.getState();
      expect(state.turnInfo.movesThisTurn).toBe(2);
    });
  });

  describe('Game Flow', () => {
    beforeEach(() => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };
      game.initialize(config);
    });

    test('should play cards to board', () => {
      let state = game.getState();
      const cardToPlay = state.gameData.players[0].hand[0];

      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'play', value: cardToPlay },
        timestamp: Date.now()
      });

      state = game.getState();
      expect(state.gameData.board).toContain(cardToPlay);
      expect(state.gameData.players[0].hand).not.toContain(cardToPlay);
    });

    test('should deal damage and end game', () => {
      // Play a card first
      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'play', value: 1 },
        timestamp: Date.now()
      });

      // Attack player2 20 times to reduce health to 0
      for (let i = 0; i < 20; i++) {
        game.executeAction({
          type: 'game_action',
          playerId: 'player1',
          data: { type: 'attack', value: 1, target: 'player2' },
          timestamp: Date.now()
        });
      }

      const state = game.getState();
      expect(state.gameData.players[1].health).toBeLessThanOrEqual(0);
      expect(state.isComplete).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });

    test('should track side effects', (done) => {
      game.on('sideEffect', (effect) => {
        expect(effect).toBeDefined();
        expect(effect.type).toBe('card_drawn');
        expect(effect.description).toContain('drew a card');
        done();
      });

      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'draw' },
        timestamp: Date.now()
      });
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };
      game.initialize(config);
    });

    test('should emit events on actions', (done) => {
      game.on('actionExecuted', ({ action, result }) => {
        expect(action.data.type).toBe('draw');
        expect(result.success).toBe(true);
        done();
      });

      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'draw' },
        timestamp: Date.now()
      });
    });

    test('should handle event unsubscription', () => {
      let count = 0;
      const unsubscribe = game.on('turnStarted', () => {
        count++;
      });

      game.endTurn(); // Should trigger event
      unsubscribe(); // Unsubscribe
      game.endTurn(); // Should not trigger event

      expect(count).toBe(1);
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      const config: IGameConfig = {
        players: [
          { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
          { id: 'player2', name: 'Bob', type: PlayerType.HUMAN }
        ]
      };
      game.initialize(config);
    });

    test('should support undo/redo', () => {
      const initialState = game.getState();

      // Make a move
      game.executeAction({
        type: 'game_action',
        playerId: 'player1',
        data: { type: 'draw' },
        timestamp: Date.now()
      });

      const afterDrawState = game.getState();
      expect(afterDrawState.gameData.players[0].hand.length).toBe(4);

      // Undo
      game.undo();
      const undoState = game.getState();
      expect(undoState.gameData.players[0].hand.length).toBe(3);

      // Redo
      game.redo();
      const redoState = game.getState();
      expect(redoState.gameData.players[0].hand.length).toBe(4);
    });
  });
});