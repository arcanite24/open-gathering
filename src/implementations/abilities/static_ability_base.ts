import { IGameState } from "../../core/game_state/interfaces";
import { IStaticAbility, IContinuousEffect, EffectLayer } from "../../core/abilities/interfaces";

/**
 * Base class for static abilities.
 * Static abilities create continuous effects that modify the game state.
 */
export abstract class StaticAbilityBase implements IStaticAbility {
  public readonly id: string;
  public readonly sourceCardInstanceId: string;
  protected readonly effect: IContinuousEffect;

  constructor(id: string, sourceCardInstanceId: string, effect: IContinuousEffect) {
    this.id = id;
    this.sourceCardInstanceId = sourceCardInstanceId;
    this.effect = effect;
  }

  /**
   * Applies the continuous effect of this static ability to the game state.
   * @param gameState The current game state.
   * @returns The new game state with the effect applied.
   */
  applyEffect(gameState: IGameState): IGameState {
    return this.effect.apply(gameState);
  }

  /**
   * Removes the continuous effect of this static ability from the game state.
   * @param gameState The current game state.
   * @returns The new game state with the effect removed.
   */
  removeEffect(gameState: IGameState): IGameState {
    return this.effect.remove(gameState);
  }

  /**
   * Gets the layer at which this static ability's effect applies.
   * @returns The layer number.
   */
  getLayer(): EffectLayer {
    return this.effect.layer;
  }
}