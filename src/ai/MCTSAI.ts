/**
 * Monte Carlo Tree Search AI
 */

import { BaseAI } from './BaseAI';
import { IGameState, IGameAction } from '../core/interfaces/IGame';
import { IAIConfig, AILevel, IMCTSNode } from './interfaces/IAI';

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