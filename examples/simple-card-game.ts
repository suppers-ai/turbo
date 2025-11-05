/**
 * Example: Simple Card Game using new TURBO API
 *
 * A simple number card game where players take turns playing cards.
 * Higher card wins the trick, most tricks wins the game.
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
} from '../src';

// Game-specific state
interface SimpleGameState extends Record<string, unknown> {
  deck: number[];
  players: Array<{
    id: string;
    name: string;
    hand: number[];
    score: number;
  }>;
  lastPlayed: {
    playerId: string;
    card: number;
  } | null;
  trickWinner: string | null;
}

// Game actions
interface SimpleGameAction extends Record<string, unknown> {
  type: 'play_card' | 'pass';
  cardIndex?: number;
}

// Game rules implementation
class SimpleCardGameRules implements IGameRules<SimpleGameState, SimpleGameAction> {
  createInitialState(config: IGameConfig): IGameState<SimpleGameState> {
    // Create a deck of cards (1-10, four of each)
    const deck: number[] = [];
    for (let i = 1; i <= 10; i++) {
      for (let j = 0; j < 4; j++) {
        deck.push(i);
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Create player states
    const players = config.players.map(p => ({
      id: p.id,
      name: p.name,
      hand: [] as number[],
      score: 0,
    }));

    // Deal 5 cards to each player
    players.forEach(player => {
      for (let i = 0; i < 5; i++) {
        const card = deck.pop();
        if (card !== undefined) {
          player.hand.push(card);
        }
      }
    });

    return {
      gameData: {
        deck,
        players,
        lastPlayed: null,
        trickWinner: null,
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
    action: IGameAction<SimpleGameAction>,
    state: IGameState<SimpleGameState>
  ): IActionValidation {
    const player = state.gameData.players.find(p => p.id === action.playerId);

    if (!player) {
      return { isValid: false, reason: 'Player not found' };
    }

    if (action.playerId !== state.turnInfo.currentPlayerId) {
      return { isValid: false, reason: 'Not your turn' };
    }

    if (action.data.type === 'play_card') {
      const cardIndex = action.data.cardIndex;
      if (cardIndex === undefined || cardIndex < 0 || cardIndex >= player.hand.length) {
        return { isValid: false, reason: 'Invalid card index' };
      }
    }

    return { isValid: true };
  }

  executeAction(
    action: IGameAction<SimpleGameAction>,
    state: IGameState<SimpleGameState>
  ): IActionResult<SimpleGameState> {
    const newState: IGameState<SimpleGameState> = JSON.parse(JSON.stringify(state));
    const player = newState.gameData.players.find(p => p.id === action.playerId);

    if (!player) {
      return { success: false, error: new Error('Player not found') };
    }

    const sideEffects = [];

    if (action.data.type === 'play_card' && action.data.cardIndex !== undefined) {
      const card = player.hand.splice(action.data.cardIndex, 1)[0];

      if (!newState.gameData.lastPlayed) {
        // First player to play
        newState.gameData.lastPlayed = { playerId: player.id, card };
        sideEffects.push({
          type: 'card_played',
          description: `${player.name} played ${card}`,
          data: { playerId: player.id, card },
        });
      } else {
        // Second player responds
        const firstCard = newState.gameData.lastPlayed.card;
        const firstPlayerId = newState.gameData.lastPlayed.playerId;

        if (card > firstCard) {
          player.score++;
          newState.gameData.trickWinner = player.id;
          sideEffects.push({
            type: 'trick_won',
            description: `${player.name} won the trick with ${card} vs ${firstCard}`,
            data: { winner: player.id, winningCard: card },
          });
        } else {
          const firstPlayer = newState.gameData.players.find(p => p.id === firstPlayerId);
          if (firstPlayer) {
            firstPlayer.score++;
            newState.gameData.trickWinner = firstPlayerId;
            sideEffects.push({
              type: 'trick_won',
              description: `${firstPlayer.name} won the trick with ${firstCard} vs ${card}`,
              data: { winner: firstPlayerId, winningCard: firstCard },
            });
          }
        }

        // Reset for next trick
        newState.gameData.lastPlayed = null;
      }
    } else if (action.data.type === 'pass') {
      // Player passes
      if (newState.gameData.lastPlayed) {
        // Award trick to first player
        const firstPlayerId = newState.gameData.lastPlayed.playerId;
        const firstPlayer = newState.gameData.players.find(p => p.id === firstPlayerId);
        if (firstPlayer) {
          firstPlayer.score++;
          newState.gameData.trickWinner = firstPlayerId;
          sideEffects.push({
            type: 'trick_won',
            description: `${firstPlayer.name} won by default (opponent passed)`,
            data: { winner: firstPlayerId },
          });
        }
        newState.gameData.lastPlayed = null;
      }
    }

    newState.turnInfo.movesThisTurn++;

    return {
      success: true,
      newState,
      sideEffects,
    };
  }

  getValidActions(state: IGameState<SimpleGameState>): IGameAction<SimpleGameAction>[] {
    const currentPlayer = state.gameData.players.find(
      p => p.id === state.turnInfo.currentPlayerId
    );

    if (!currentPlayer) return [];

    const actions: IGameAction<SimpleGameAction>[] = [];

    // Add play card actions
    currentPlayer.hand.forEach((_, index) => {
      actions.push({
        type: 'game_action',
        playerId: currentPlayer.id,
        data: { type: 'play_card', cardIndex: index },
        timestamp: Date.now(),
      });
    });

    // Add pass action
    actions.push({
      type: 'game_action',
      playerId: currentPlayer.id,
      data: { type: 'pass' },
      timestamp: Date.now(),
    });

    return actions;
  }

  checkEndCondition(
    state: IGameState<SimpleGameState>
  ): { isEnded: boolean; winnerId?: string; reason?: string } {
    // Check if someone has won (scored 3 tricks)
    const winner = state.gameData.players.find(p => p.score >= 3);
    if (winner) {
      return {
        isEnded: true,
        winnerId: winner.id,
        reason: `${winner.name} won with ${winner.score} tricks!`,
      };
    }

    // Check if all cards have been played
    const allEmpty = state.gameData.players.every(p => p.hand.length === 0);
    if (allEmpty) {
      // Find player with highest score
      const topPlayer = state.gameData.players.reduce((best, player) =>
        player.score > best.score ? player : best
      );
      return {
        isEnded: true,
        winnerId: topPlayer.id,
        reason: `Game over! ${topPlayer.name} won with ${topPlayer.score} tricks!`,
      };
    }

    return { isEnded: false };
  }

  calculateScore?(state: IGameState<SimpleGameState>, playerId: string): number {
    const player = state.gameData.players.find(p => p.id === playerId);
    return player ? player.score : 0;
  }
}

// Simple AI for the card game
class SimpleCardAI extends RandomAI<SimpleGameState, SimpleGameAction> {
  evaluateState(state: IGameState<SimpleGameState>): number {
    const player = state.gameData.players.find(p => p.id === this.playerId);
    return player ? player.score * 10 : 0;
  }

  async chooseAction(
    state: IGameState<SimpleGameState>,
    availableActions: IGameAction<SimpleGameAction>[]
  ): Promise<IGameAction<SimpleGameAction> | null> {
    // Simple strategy: play highest card when going first, play lowest when responding
    const player = state.gameData.players.find(p => p.id === this.playerId);
    if (!player || player.hand.length === 0) {
      return null;
    }

    await this.simulateThinking();

    if (!state.gameData.lastPlayed) {
      // Going first - play highest card
      const maxCard = Math.max(...player.hand);
      const cardIndex = player.hand.indexOf(maxCard);
      const action = availableActions.find(
        a => a.data.type === 'play_card' && a.data.cardIndex === cardIndex
      );
      return action || availableActions[0];
    } else {
      // Responding - play lowest card that wins, or lowest card if can't win
      const opponentCard = state.gameData.lastPlayed.card;
      const winningCards = player.hand.filter(c => c > opponentCard).sort((a, b) => a - b);

      if (winningCards.length > 0) {
        const cardIndex = player.hand.indexOf(winningCards[0]);
        const action = availableActions.find(
          a => a.data.type === 'play_card' && a.data.cardIndex === cardIndex
        );
        return action || availableActions[0];
      } else {
        // Can't win - play lowest card
        const minCard = Math.min(...player.hand);
        const cardIndex = player.hand.indexOf(minCard);
        const action = availableActions.find(
          a => a.data.type === 'play_card' && a.data.cardIndex === cardIndex
        );
        return action || availableActions[0];
      }
    }
  }
}

// Usage example
async function playGame() {
  const rules = new SimpleCardGameRules();
  const game = new GameController<SimpleGameState, SimpleGameAction>(rules);

  // Initialize game
  game.initialize({
    players: [
      { id: 'player1', name: 'Alice', type: PlayerType.HUMAN },
      { id: 'player2', name: 'Bob (AI)', type: PlayerType.AI },
    ],
  });

  // Create AI player
  const ai = new SimpleCardAI({
    playerId: 'player2',
    difficulty: AILevel.MEDIUM,
  });

  // Subscribe to events
  game.on('sideEffect', effect => {
    console.log(`[${effect.type}] ${effect.description}`);
  });

  game.on('turnStarted', ({ playerId }) => {
    const state = game.getState();
    const player = state.gameData.players.find(p => p.id === playerId);
    if (player) {
      console.log(`\n--- ${player.name}'s turn (Hand: ${player.hand.join(', ')}) ---`);
    }
  });

  game.on('gameEnded', ({ winnerId, reason }) => {
    console.log(`\n🎉 Game Over! ${reason}`);
  });

  // Game loop
  while (!game.isGameOver()) {
    const state = game.getState();
    const currentPlayerId = state.turnInfo.currentPlayerId;

    if (currentPlayerId === 'player2') {
      // AI turn
      const validActions = rules.getValidActions(state);
      const aiAction = await ai.chooseAction(state, validActions);

      if (aiAction) {
        game.executeAction(aiAction);
      }
    } else {
      // Human turn (simulate for demo)
      const validActions = rules.getValidActions(state);

      // For demo: play first card
      const playAction = validActions.find(a => a.data.type === 'play_card');
      if (playAction) {
        game.executeAction(playAction);
      }
    }

    // Check if we should end the turn
    const updatedState = game.getState();
    if (!updatedState.gameData.lastPlayed || updatedState.gameData.trickWinner) {
      game.endTurn();

      // Reset trick winner for next round
      if (updatedState.gameData.trickWinner) {
        const nextState = game.getState();
        nextState.gameData.trickWinner = null;
      }
    }
  }
}

// Run the example
if (require.main === module) {
  console.log('=== Simple Card Game Example ===\n');
  playGame().catch(console.error);
}

export { SimpleCardGameRules, SimpleCardAI };