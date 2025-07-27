import { IActivatedAbility, ICost, IEffect } from '../../core/abilities/interfaces';
import { TapCost } from '../costs/tap_cost';
import { AddManaEffect } from '../effects/add_mana';
import { IGameState } from '../../core/game_state/interfaces';

/**
 * Activated ability that taps a card to add mana.
 */
export class TapAddManaAbility implements IActivatedAbility {
  id: string;
  sourceCardInstanceId: string;
  costs: ICost[];
  effect: IEffect;
  private manaType: string;
  
  /**
   * Creates a new TapAddManaAbility.
   * @param id The ability ID
   * @param sourceCardInstanceId The ID of the source card instance
   * @param manaType The type of mana to add (e.g., 'W', 'U', 'B', 'R', 'G', 'C')
   */
  constructor(id: string, sourceCardInstanceId: string, manaType: string) {
    this.id = id;
    this.sourceCardInstanceId = sourceCardInstanceId;
    this.manaType = manaType;
    this.costs = [new TapCost()];
    this.effect = new AddManaEffect(manaType);
  }
  
  /**
   * Checks if the ability can be activated.
   * @param gameState The current game state
   * @param playerId The ID of the player trying to activate the ability
   * @returns True if the ability can be activated, false otherwise
   */
  canActivate(gameState: IGameState, playerId: string): boolean {
    // Get the source card instance
    const cardInstance = gameState.cardInstances.get(this.sourceCardInstanceId);
    if (!cardInstance) {
      return false;
    }
    
    // Check if the player controls the card
    if (cardInstance.controllerPlayerId !== playerId) {
      return false;
    }
    
    // Check if all costs can be paid
    for (const cost of this.costs) {
      if (!cost.canPay(gameState, this.sourceCardInstanceId)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Activates the ability.
   * @param gameState The current game state
   * @param playerId The ID of the player activating the ability
   * @param targets Optional targets for the ability
   * @returns The updated game state
   */
  activate(gameState: IGameState, playerId: string, targets?: any[]): IGameState {
    // First check if the ability can be activated
    if (!this.canActivate(gameState, playerId)) {
      return gameState;
    }
    
    // Pay all costs
    let newState = gameState;
    for (const cost of this.costs) {
      newState = cost.pay(newState, this.sourceCardInstanceId);
    }
    
    // Resolve the effect immediately (mana abilities don't use the stack)
    return this.effect.resolve(newState, { sourceCardInstanceId: this.sourceCardInstanceId, cardDefinitions: newState.cardDefinitions });
  }
}