
import { ITriggeredAbility, TriggerCondition, IEffect, GameEvent } from '../../core/abilities/interfaces';
import { IGameState } from '../../core/game_state/interfaces';

/**
 * Base class for triggered abilities.
 */
export abstract class TriggeredAbilityBase implements ITriggeredAbility {
  id: string;
  sourceCardInstanceId: string;
  triggerCondition: TriggerCondition;
  effect: IEffect;

  constructor(
    id: string,
    sourceCardInstanceId: string,
    triggerCondition: TriggerCondition,
    effect: IEffect
  ) {
    this.id = id;
    this.sourceCardInstanceId = sourceCardInstanceId;
    this.triggerCondition = triggerCondition;
    this.effect = effect;
  }

  /**
   * Checks if the ability should trigger based on a game event.
   * This base implementation only checks the event type.
   * Subclasses should override this to add more specific conditions.
   * @param event The game event
   * @param gameState The current game state
   * @returns True if the ability should trigger, false otherwise
   */
  checkTrigger(event: GameEvent, gameState: IGameState): boolean {
    if (event.type !== this.triggerCondition.eventType) {
      return false;
    }
    // More complex checks can be added by subclasses by overriding this method.
    return true;
  }

  /**
   * Resolves the triggered ability's effect.
   * In a real implementation, this would likely put the ability on the stack.
   * For now, we will resolve it directly for simplicity.
   * @param gameState The current game state
   * @returns The updated game state
   */
  resolve(gameState: IGameState): IGameState {
    // In a more complete engine, this would push the ability effect to the stack.
    // For now, we resolve it directly.
    return this.effect.resolve(gameState, {
      sourceCardInstanceId: this.sourceCardInstanceId,
      cardDefinitions: gameState.cardDefinitions,
    });
  }
}
