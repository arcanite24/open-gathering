
import { IEffect, EffectContext } from '../../core/abilities/interfaces';
import { IGameState } from '../../core/game_state/interfaces';

/**
 * Effect that causes a player to gain life.
 */
export class GainLifeEffect implements IEffect {
  private lifeToGain: number;

  constructor(lifeToGain: number) {
    this.lifeToGain = lifeToGain;
  }

  resolve(gameState: IGameState, context: EffectContext): IGameState {
    const controller = gameState.players.get(
      gameState.cardInstances.get(context.sourceCardInstanceId)!.controllerPlayerId
    );

    if (!controller) {
      return gameState;
    }

    const newPlayers = new Map(gameState.players);
    const newPlayer = { ...controller, life: controller.life + this.lifeToGain };
    newPlayers.set(controller.id, newPlayer);

    return {
      ...gameState,
      players: newPlayers,
    };
  }
}
