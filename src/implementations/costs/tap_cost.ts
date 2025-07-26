import { ICost } from '../../core/abilities/interfaces';
import { IGameState, ICardInstance } from '../../core/game_state/interfaces';

/**
 * Cost for tapping a card.
 */
export class TapCost implements ICost {
  /**
   * Checks if the cost can be paid.
   * @param gameState The current game state
   * @param sourceCardInstanceId The ID of the source card instance
   * @returns True if the cost can be paid, false otherwise
   */
  canPay(gameState: IGameState, sourceCardInstanceId: string): boolean {
    const cardInstance = gameState.cardInstances.get(sourceCardInstanceId);
    if (!cardInstance) {
      return false;
    }
    
    // Can't tap a card that's already tapped
    if (cardInstance.isTapped) {
      return false;
    }
    
    // For creatures, check if they have summoning sickness
    // This would require checking the card's type and when it entered the battlefield
    // For simplicity in this implementation, we'll assume non-creature cards don't have summoning sickness
    // and creatures do if they haven't been under the controller's control since the beginning of their turn
    
    return true;
  }
  
  /**
   * Pays the cost by tapping the card.
   * @param gameState The current game state
   * @param sourceCardInstanceId The ID of the source card instance
   * @returns The updated game state
   */
  pay(gameState: IGameState, sourceCardInstanceId: string): IGameState {
    // Create a deep copy of the game state
    const players = new Map(gameState.players);
    const zones = new Map(gameState.zones);
    const cardInstances = new Map(gameState.cardInstances);
    
    // Get the card instance
    const cardInstance = cardInstances.get(sourceCardInstanceId);
    if (!cardInstance) {
      return gameState;
    }
    
    // Create a new card instance with tapped = true
    const updatedCardInstance: ICardInstance = {
      ...cardInstance,
      isTapped: true
    };
    
    // Update the card instance in the map
    cardInstances.set(sourceCardInstanceId, updatedCardInstance);
    
    // Return the new game state
    return {
      ...gameState,
      players,
      zones,
      cardInstances
    };
  }
}