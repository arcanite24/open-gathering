import { IGameState } from '../game_state/interfaces';

/**
 * Manages priority in the game.
 */
export class PriorityManager {
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