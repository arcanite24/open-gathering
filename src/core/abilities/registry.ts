import { IAbility } from './interfaces';
import { IGameState } from '../game_state/interfaces';
import { TapAddManaAbility } from '../../implementations/abilities/activated_tap_add_mana';
import { WhenThisCreatureDiesGainLifeAbility } from '../../implementations/abilities/specific_triggered_abilities';

/**
 * Type for factory functions that create ability instances.
 */
export type AbilityFactory = (
  params: any,
  sourceCardInstanceId: string,
  gameState: IGameState
) => IAbility | null;

/**
 * Registry for ability implementations.
 */
export class AbilityRegistry {
  /** Map of ability keys to factory functions */
  private registry: Map<string, AbilityFactory> = new Map();

  /**
   * Registers an ability factory function.
   * @param key The ability key
   * @param factory The factory function
   */
  registerAbility(key: string, factory: AbilityFactory): void {
    this.registry.set(key, factory);
  }

  /**
   * Creates an ability instance using a registered factory.
   * @param key The ability key
   * @param params Parameters for the ability
   * @param sourceCardInstanceId The ID of the source card instance
   * @param gameState The current game state
   * @returns The created ability instance, or null if key is not registered
   */
  createAbilityInstance(
    key: string,
    params: any,
    sourceCardInstanceId: string,
    gameState: IGameState
  ): IAbility | null {
    const factory = this.registry.get(key);
    if (!factory) {
      return null;
    }

    return factory(params, sourceCardInstanceId, gameState);
  }

  /**
   * Checks if an ability key is registered.
   * @param key The ability key
   * @returns True if the key is registered, false otherwise
   */
  isRegistered(key: string): boolean {
    return this.registry.has(key);
  }
}

/**
 * Initializes the ability registry with default abilities.
 * @returns A new instance of AbilityRegistry with default abilities registered
 */
export function initializeAbilityRegistry(): AbilityRegistry {
  const registry = new AbilityRegistry();

  // Register the tap add mana ability
  registry.registerAbility('inherent_ability_tap_add_mana', (params, sourceCardInstanceId, gameState) => {
    // Generate a unique ID for the ability
    const id = `ability_${sourceCardInstanceId}_${Date.now()}`;

    // Get the mana type from params
    const manaType = params.mana.replace(/[{}]/g, ''); // Remove braces if present

    // Create and return the ability
    return new TapAddManaAbility(id, sourceCardInstanceId, manaType);
  });

  // Register the when this creature dies gain 1 life ability
  registry.registerAbility('when_this_creature_dies_gain_life', (params, sourceCardInstanceId, gameState) => {
    // Generate a unique ID for the ability
    const id = `ability_${sourceCardInstanceId}_${Date.now()}`;

    // Create and return the ability
    return new WhenThisCreatureDiesGainLifeAbility(id, sourceCardInstanceId);
  });

  return registry;
}