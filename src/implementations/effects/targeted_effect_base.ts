import { IGameState } from '../../core/game_state/interfaces';
import { ITargetedEffect, EffectContext, Target } from '../../core/abilities/interfaces';

export abstract class TargetedEffectBase implements ITargetedEffect {
  public abstract validateTargets(gameState: IGameState, context: EffectContext): boolean;
  
  public abstract resolve(gameState: IGameState, context: EffectContext): IGameState;
}
