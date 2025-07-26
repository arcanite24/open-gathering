import { IGameState } from '../game_state/interfaces';
import { StackManager } from './stack_manager';

/**
 * Manages priority in the game.
 */
export class PriorityManager {
  private stackManager: StackManager;
  
  constructor() {
    this.stackManager = new StackManager();
  }
  
  /**
   * Passes priority to the next player.
   * @param gameState The current game state
   * @returns The updated game state
   */
  passPriority(gameState: IGameState): IGameState {
    // Create a copy of the game state to avoid mutating the original
    const newState = this.copyGameState(gameState);
    
    // Get player IDs
    const playerIds = Array.from(newState.players.keys());
    
    // Store the player who currently has priority
    const previousPriorityPlayerId = newState.priorityPlayerId;
    
    // If there are only two players, we can simply switch between them
    if (playerIds.length === 2) {
      // Switch priority to the other player
      newState.priorityPlayerId = 
        newState.priorityPlayerId === playerIds[0] ? playerIds[1] : playerIds[0];
    } else {
      // For more than 2 players, cycle through them
      const currentIndex = playerIds.indexOf(newState.priorityPlayerId);
      newState.priorityPlayerId = playerIds[(currentIndex + 1) % playerIds.length];
    }
    
    // Check if both players have passed priority in succession and the stack is not empty
    // This is a simplified check - in a full implementation we would need to track passes
    const stackZone = newState.zones.get(newState.stackZoneId);
    if (stackZone && stackZone.cards.length > 0) {
      // If the non-active player passes, and the active player already had priority,
      // resolve the top of the stack
      if (previousPriorityPlayerId !== newState.activePlayerId && 
          newState.priorityPlayerId === newState.activePlayerId) {
        return this.stackManager.resolveTop(newState);
      }
    }
    
    return newState;
  }
  
  /**
   * Sets priority to the active player.
   * @param gameState The current game state
   * @returns The updated game state
   */
  setActivePlayerPriority(gameState: IGameState): IGameState {
    // Create a copy of the game state to avoid mutating the original
    const newState = this.copyGameState(gameState);
    
    // Set priority to the active player
    newState.priorityPlayerId = newState.activePlayerId;
    
    return newState;
  }
  
  /**
   * Creates a shallow copy of the game state.
   * @param gameState The game state to copy
   * @returns A new game state object with the same properties
   */
  private copyGameState(gameState: IGameState): IGameState {
    return {
      players: new Map(gameState.players),
      zones: new Map(gameState.zones),
      cardInstances: new Map(gameState.cardInstances),
      activePlayerId: gameState.activePlayerId,
      priorityPlayerId: gameState.priorityPlayerId,
      turn: gameState.turn,
      phase: gameState.phase,
      step: gameState.step,
      stackZoneId: gameState.stackZoneId
    };
  }
}