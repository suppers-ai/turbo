/**
 * Example: Tic-Tac-Toe implementation using TURBO
 *
 * Demonstrates how to use the refactored TURBO library
 * to create a simple turn-based game
 */

import {
  GameController,
  IGameRules,
  IGameState,
  IGameAction,
  IActionValidation,
  IActionResult,
  IGameConfig,
  GamePhase,
  PlayerType,
  RandomAI,
  AILevel,
} from '../src/index.new';

// Game-specific types
interface TicTacToeState {
  board: (string | null)[][];
  moveCount: number;
}

interface TicTacToeAction {
  row: number;
  col: number;
}

// Tic-Tac-Toe game rules implementation
class TicTacToeRules implements IGameRules<TicTacToeState, TicTacToeAction> {
  createInitialState(config: IGameConfig): IGameState<TicTacToeState> {
    return {
      gameData: {
        board: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        moveCount: 0,
      },
      turnInfo: {
        turnNumber: 1,
        currentPlayerId: config.players[0].id,
        movesThisTurn: 0,
        timeStarted: Date.now(),
      },
      players: config.players,
      phase: GamePhase.PLAYING,
      isComplete: false,
    };
  }

  validateAction(
    action: IGameAction<TicTacToeAction>,
    state: IGameState<TicTacToeState>
  ): IActionValidation {
    const { row, col } = action.data;

    // Check if it's the player's turn
    if (action.playerId !== state.turnInfo.currentPlayerId) {
      return {
        isValid: false,
        reason: "It's not your turn",
      };
    }

    // Check if position is valid
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return {
        isValid: false,
        reason: 'Invalid board position',
      };
    }

    // Check if cell is empty
    if (state.gameData.board[row][col] !== null) {
      return {
        isValid: false,
        reason: 'Cell is already occupied',
      };
    }

    return { isValid: true };
  }

  executeAction(
    action: IGameAction<TicTacToeAction>,
    state: IGameState<TicTacToeState>
  ): IActionResult<TicTacToeState> {
    const { row, col } = action.data;
    const newBoard = state.gameData.board.map(r => [...r]);
    const playerSymbol = action.playerId === state.players[0].id ? 'X' : 'O';

    // Make the move
    newBoard[row][col] = playerSymbol;

    // Create new state
    const newState: IGameState<TicTacToeState> = {
      ...state,
      gameData: {
        board: newBoard,
        moveCount: state.gameData.moveCount + 1,
      },
      turnInfo: {
        ...state.turnInfo,
        movesThisTurn: state.turnInfo.movesThisTurn + 1,
      },
    };

    return {
      success: true,
      newState,
      sideEffects: [{
        type: 'move_made',
        description: `Player ${action.playerId} placed ${playerSymbol} at (${row}, ${col})`,
        data: { row, col, symbol: playerSymbol },
      }],
    };
  }

  getValidActions(state: IGameState<TicTacToeState>): IGameAction<TicTacToeAction>[] {
    const actions: IGameAction<TicTacToeAction>[] = [];
    const currentPlayerId = state.turnInfo.currentPlayerId;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (state.gameData.board[row][col] === null) {
          actions.push({
            type: 'place_mark',
            playerId: currentPlayerId,
            data: { row, col },
            timestamp: Date.now(),
          });
        }
      }
    }

    return actions;
  }

  checkEndCondition(
    state: IGameState<TicTacToeState>
  ): { isEnded: boolean; winnerId?: string; reason?: string } {
    const board = state.gameData.board;

    // Check rows, columns, and diagonals
    const lines = [
      // Rows
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      // Columns
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      // Diagonals
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ];

    for (const line of lines) {
      const symbols = line.map(([r, c]) => board[r][c]);
      if (symbols[0] && symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        const winnerId = symbols[0] === 'X' ? state.players[0].id : state.players[1].id;
        return {
          isEnded: true,
          winnerId,
          reason: 'Three in a row!',
        };
      }
    }

    // Check for draw
    if (state.gameData.moveCount === 9) {
      return {
        isEnded: true,
        reason: 'Board is full - Draw!',
      };
    }

    return { isEnded: false };
  }

  calculateScore(state: IGameState<TicTacToeState>, playerId: string): number {
    const endCondition = this.checkEndCondition(state);
    if (endCondition.winnerId === playerId) {
      return 1;
    } else if (endCondition.winnerId && endCondition.winnerId !== playerId) {
      return -1;
    }
    return 0;
  }
}

// Example AI for Tic-Tac-Toe
class TicTacToeAI extends RandomAI<TicTacToeState, TicTacToeAction> {
  evaluateState(state: IGameState<TicTacToeState>): number {
    const rules = new TicTacToeRules();
    return rules.calculateScore(state, this.playerId);
  }
}

// Example usage function
export async function playTicTacToe() {
  // Create game
  const rules = new TicTacToeRules();
  const game = new GameController<TicTacToeState, TicTacToeAction>(rules);

  // Initialize with players
  game.initialize({
    players: [
      { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
      { id: 'player2', name: 'Bob (AI)', type: PlayerType.AI },
    ],
  });

  // Create AI player
  const ai = new TicTacToeAI({
    playerId: 'player2',
    difficulty: AILevel.MEDIUM,
  });

  // Subscribe to events
  game.on('sideEffect', (effect) => {
    console.log(effect.description);
  });

  game.on('gameEnded', ({ winnerId, reason }) => {
    if (winnerId) {
      console.log(`Game Over! Winner: ${winnerId}`);
    }
    console.log(`Reason: ${reason}`);
  });

  // Game loop
  while (!game.isGameOver()) {
    const state = game.getState();
    const currentPlayer = state.turnInfo.currentPlayerId;

    if (currentPlayer === 'player2') {
      // AI turn
      const validActions = rules.getValidActions(state);
      const aiAction = await ai.chooseAction(state, validActions);

      if (aiAction) {
        game.executeAction(aiAction);
      }
    } else {
      // Human turn (simulate for example)
      const validActions = rules.getValidActions(state);
      if (validActions.length > 0) {
        // Pick first valid action for demo
        game.executeAction(validActions[0]);
      }
    }

    // End turn after each move
    game.endTurn();
  }

  // Display final board
  const finalState = game.getState();
  console.log('\nFinal Board:');
  finalState.gameData.board.forEach(row => {
    console.log(row.map(cell => cell || '-').join(' '));
  });
}

// Run the example if called directly
if (require.main === module) {
  console.log('=== Tic-Tac-Toe Example ===\n');
  playTicTacToe().catch(console.error);
}

export { TicTacToeRules, TicTacToeAI };