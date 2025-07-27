import { IGameState, ICardInstance } from "../../core/game_state/interfaces";
import { IContinuousEffect, EffectLayer } from "../../core/abilities/interfaces";

/**
 * A continuous effect that modifies the power and/or toughness of creatures.
 */
export class PowerToughnessEffect implements IContinuousEffect {
  public readonly layer: EffectLayer = EffectLayer.PowerToughness;
  private readonly powerChange: number;
  private readonly toughnessChange: number;
  private readonly filter: (card: ICardInstance, gameState: IGameState) => boolean;

  /**
   * @param powerChange The amount to change power by.
   * @param toughnessChange The amount to change toughness by.
   * @param filter A function to determine which card instances are affected by this effect.
   */
  constructor(powerChange: number, toughnessChange: number, filter: (card: ICardInstance, gameState: IGameState) => boolean) {
    this.powerChange = powerChange;
    this.toughnessChange = toughnessChange;
    this.filter = filter;
  }

  /**
   * Applies the power/toughness modification to relevant creatures in the game state.
   * Note: This implementation directly modifies the card instance. In a more robust system,
   * effects might be stored and applied dynamically, or a snapshot/revert system used.
   * For now, we assume apply/remove are called in a controlled manner by the processor.
   * @param gameState The current game state.
   * @returns The new game state with the effect applied.
   */
  apply(gameState: IGameState): IGameState {
    const newCardInstances = new Map(gameState.cardInstances);

    for (const cardInstance of newCardInstances.values()) {
      // Only apply to creatures on the battlefield that match the filter
      const battlefieldZone = gameState.zones.get(cardInstance.currentZoneId);
      if (battlefieldZone && battlefieldZone.name === 'Battlefield' && cardInstance.types?.includes('Creature') && this.filter(cardInstance, gameState)) {
        const currentPower = parseInt(cardInstance.power || '0');
        const currentToughness = parseInt(cardInstance.toughness || '0');

        const updatedCardInstance = { ...cardInstance };
        updatedCardInstance.power = (currentPower + this.powerChange).toString();
        updatedCardInstance.toughness = (currentToughness + this.toughnessChange).toString();
        newCardInstances.set(updatedCardInstance.id, updatedCardInstance);
      }
    }

    return { ...gameState, cardInstances: newCardInstances };
  }

  /**
   * Removes the power/toughness modification from relevant creatures.
   * This is the inverse of the apply method.
   * @param gameState The current game state.
   * @returns The new game state with the effect removed.
   */
  remove(gameState: IGameState): IGameState {
    const newCardInstances = new Map(gameState.cardInstances);

    for (const cardInstance of newCardInstances.values()) {
      const battlefieldZone = gameState.zones.get(cardInstance.currentZoneId);
      if (battlefieldZone && battlefieldZone.name === 'Battlefield' && cardInstance.types?.includes('Creature') && this.filter(cardInstance, gameState)) {
        const currentPower = parseInt(cardInstance.power || '0');
        const currentToughness = parseInt(cardInstance.toughness || '0');

        const updatedCardInstance = { ...cardInstance };
        updatedCardInstance.power = (currentPower - this.powerChange).toString();
        updatedCardInstance.toughness = (currentToughness - this.toughnessChange).toString();
        newCardInstances.set(updatedCardInstance.id, updatedCardInstance);
      }
    }

    return { ...gameState, cardInstances: newCardInstances };
  }
}