import { IGameState, ICardInstance } from "../game_state/interfaces";
import { IStaticAbility, EffectLayer } from "../abilities/interfaces";

/**
 * Manages the application of continuous effects from static abilities.
 * Effects are applied in a specific layer order as per MTG rules.
 */
export class ContinuousEffectProcessor {
  /**
   * Applies all active continuous effects to the game state in the correct layer order.
   * @param gameState The current game state.
   * @returns The new game state with all continuous effects applied.
   */
  public applyContinuousEffects(gameState: IGameState): IGameState {
    let newGameState = { ...gameState };

    // Reset all cards to their base state before applying effects
    const newCardInstances = new Map<string, ICardInstance>();
    for (const card of newGameState.cardInstances.values()) {
      const cardDefinition = card.definition;
      const baseCard = {
        ...card,
        power: cardDefinition.power,
        toughness: cardDefinition.toughness,
        types: [...(cardDefinition.types || [])],
        subtypes: [...(cardDefinition.subtypes || [])],
        supertypes: [...(cardDefinition.supertypes || [])],
        colors: [...(cardDefinition.colors || [])],
        abilities: [...(cardDefinition.abilities || [])],
      };
      newCardInstances.set(card.id, baseCard as ICardInstance);
    }
    newGameState.cardInstances = newCardInstances;

    // 1. Gather all active static abilities from cards on the battlefield
    const activeStaticAbilities: IStaticAbility[] = [];
    for (const cardInstance of newGameState.cardInstances.values()) {
      const battlefieldZone = newGameState.zones.get(cardInstance.currentZoneId);
      if (battlefieldZone && battlefieldZone.name === 'Battlefield') {
        activeStaticAbilities.push(...cardInstance.staticAbilities);
      }
    }

    // 2. Group abilities by layer
    const abilitiesByLayer = new Map<EffectLayer, IStaticAbility[]>();
    for (const ability of activeStaticAbilities) {
      const layer = ability.getLayer();
      if (!abilitiesByLayer.has(layer)) {
        abilitiesByLayer.set(layer, []);
      }
      abilitiesByLayer.get(layer)?.push(ability);
    }

    // 3. Apply effects layer by layer, in ascending order
    const sortedLayers = Array.from(abilitiesByLayer.keys()).sort((a, b) => a - b);

    for (const layer of sortedLayers) {
      const abilitiesInLayer = abilitiesByLayer.get(layer);
      if (abilitiesInLayer) {
        // Within a layer, effects are applied in timestamp order (not implemented yet, simple iteration for now)
        for (const ability of abilitiesInLayer) {
          newGameState = ability.applyEffect(newGameState);
        }
      }
    }

    return newGameState;
  }

  /**
   * Removes all continuous effects from the game state.
   * This is typically used to get a 'clean' state before re-applying effects.
   * @param gameState The current game state.
   * @returns The new game state with all continuous effects removed.
   */
  public removeContinuousEffects(gameState: IGameState): IGameState {
    let newGameState = gameState;

    // Iterate through all card instances and remove their static abilities' effects
    // This assumes that applyEffect and removeEffect are idempotent or handle state correctly.
    // For a full implementation, a more robust snapshot/revert mechanism might be needed.
    for (const cardInstance of newGameState.cardInstances.values()) {
      for (const ability of cardInstance.staticAbilities) {
        newGameState = ability.removeEffect(newGameState);
      }
    }
    return newGameState;
  }
}
