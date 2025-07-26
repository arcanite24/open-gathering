import { IGameState, IZone, ICardInstance } from '../game_state/interfaces';

/**
 * Manages the stack in the game.
 */
export class StackManager {
  /**
   * Resolves the top item on the stack.
   * @param gameState The current game state
   * @returns The updated game state
   */
  resolveTop(gameState: IGameState): IGameState {
    // Create a copy of the game state to avoid mutating the original
    const newState = this.copyGameState(gameState);
    
    // Get the stack zone
    const stackZone = newState.zones.get(newState.stackZoneId);
    if (!stackZone) {
      throw new Error('Stack zone not found');
    }
    
    // Check if the stack is empty
    if (stackZone.cards.length === 0) {
      return newState; // Nothing to resolve
    }
    
    // Get the top card instance ID from the stack (last element in the array)
    const topCardInstanceId = stackZone.cards[stackZone.cards.length - 1];
    
    // Get the corresponding card instance
    const cardInstance = newState.cardInstances.get(topCardInstanceId);
    if (!cardInstance) {
      throw new Error(`Card instance ${topCardInstanceId} not found`);
    }
    
    // For a simple creature spell: Move the CardInstance from the Stack zone to the controller's Battlefield zone
    // Remove the card from the stack
    stackZone.cards.pop();
    
    // Get the controller's battlefield zone
    const controller = newState.players.get(cardInstance.controllerPlayerId);
    if (!controller) {
      throw new Error(`Controller ${cardInstance.controllerPlayerId} not found`);
    }
    
    const battlefieldZone = newState.zones.get(controller.battlefieldZoneId);
    if (!battlefieldZone) {
      throw new Error(`Battlefield zone for player ${cardInstance.controllerPlayerId} not found`);
    }
    
    // Move the card to the battlefield
    cardInstance.currentZoneId = controller.battlefieldZoneId;
    battlefieldZone.cards.push(topCardInstanceId);
    
    // Handle summoning sickness
    // Set the turn the card entered the battlefield
    cardInstance.turnEnteredBattlefield = newState.turn;
    
    // Mark the creature as having summoning sickness
    // (This will be checked elsewhere in the game logic)
    cardInstance.hasSummoningSickness = true;
    
    return newState;
  }
  
  /**
   * Creates a deep copy of the game state.
   * @param gameState The game state to copy
   * @returns A new game state object with the same properties
   */
  private copyGameState(gameState: IGameState): IGameState {
    // Deep copy players map
    const players = new Map<string, any>();
    gameState.players.forEach((player, id) => {
      players.set(id, { 
        ...player,
        manaPool: { ...player.manaPool }
      });
    });

    // Deep copy zones map
    const zones = new Map<string, IZone>();
    gameState.zones.forEach((zone, id) => {
      zones.set(id, { 
        ...zone,
        cards: [...zone.cards] // Copy the cards array
      });
    });

    // Deep copy card instances map
    const cardInstances = new Map<string, ICardInstance>();
    gameState.cardInstances.forEach((card, id) => {
      cardInstances.set(id, { 
        ...card,
        counters: new Map(card.counters) // Copy the counters map
      });
    });

    // Return the new game state
    return {
      players,
      zones,
      cardInstances,
      activePlayerId: gameState.activePlayerId,
      priorityPlayerId: gameState.priorityPlayerId,
      turn: gameState.turn,
      phase: gameState.phase,
      step: gameState.step,
      stackZoneId: gameState.stackZoneId
    };
  }
}