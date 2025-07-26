import { IAbility } from './interfaces';
import { IGameState } from '../game_state/interfaces';
import { TapAddManaAbility } from '../../implementations/abilities/activated_tap_add_mana';

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
  private static registry: Map<string, AbilityFactory> = new Map();
  
  /**
   * Registers an ability factory function.
   * @param key The ability key
   * @param factory The factory function
   */
  static registerAbility(key: string, factory: AbilityFactory): void {
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
  static createAbilityInstance(
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
  static isRegistered(key: string): boolean {
    return this.registry.has(key);
  }
}

// Register the tap add mana ability
AbilityRegistry.registerAbility('inherent_ability_tap_add_mana', (params, sourceCardInstanceId, gameState) => {
  // Generate a unique ID for the ability
  const id = `ability_${sourceCardInstanceId}_${Date.now()}`;
  
  // Get the mana type from params
  const manaType = params.mana.replace(/[{}]/g, ''); // Remove braces if present
  
  // Create and return the ability
  return new TapAddManaAbility(id, sourceCardInstanceId, manaType);
});