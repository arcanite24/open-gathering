import { IEffect, EffectContext } from '../../core/abilities/interfaces';
import { IGameState } from '../../core/game_state/interfaces';

/**
 * Effect that adds mana to a player's mana pool.
 */
export class AddManaEffect implements IEffect {
  private manaType: string;
  
  /**
   * Creates a new AddManaEffect.
   * @param manaType The type of mana to add (e.g., 'W', 'U', 'B', 'R', 'G', 'C')
   */
  constructor(manaType: string) {
    this.manaType = manaType;
  }
  
  /**
   * Resolves the effect by adding mana to the controller's mana pool.
   * @param gameState The current game state
   * @param context The effect context
   * @returns The updated game state
   */
  resolve(gameState: IGameState, context: EffectContext): IGameState {
    // Create a deep copy of the game state
    const players = new Map(gameState.players);
    const zones = new Map(gameState.zones);
    const cardInstances = new Map(gameState.cardInstances);
    
    // Get the source card instance
    const sourceCardInstance = cardInstances.get(context.sourceCardInstanceId);
    if (!sourceCardInstance) {
      return gameState;
    }
    
    // Get the controller
    const controller = players.get(sourceCardInstance.controllerPlayerId);
    if (!controller) {
      return gameState;
    }
    
    // Create an updated controller with the mana added
    const updatedController = {
      ...controller,
      manaPool: {
        ...controller.manaPool
      }
    };
    
    // Add the mana
    switch (this.manaType) {
      case 'W':
        updatedController.manaPool.W++;
        break;
      case 'U':
        updatedController.manaPool.U++;
        break;
      case 'B':
        updatedController.manaPool.B++;
        break;
      case 'R':
        updatedController.manaPool.R++;
        break;
      case 'G':
        updatedController.manaPool.G++;
        break;
      case 'C':
        updatedController.manaPool.C++;
        break;
      default:
        // Handle generic mana or other cases if needed
        break;
    }
    
    // Update the controller in the players map
    players.set(sourceCardInstance.controllerPlayerId, updatedController);
    
    // Return the new game state
    return {
      ...gameState,
      players,
      zones,
      cardInstances
    };
  }
}