import { IGameState, ICardInstance } from "../../core/game_state/interfaces";
import { StaticAbilityBase } from "./static_ability_base";
import { PowerToughnessEffect } from "../effects/power_toughness_effect";

/**
 * A static ability that gives creatures controlled by the source's owner +N/+N.
 */
export class CreaturesGetPlusOnePlusOne extends StaticAbilityBase {
  constructor(id: string, sourceCardInstanceId: string, power: number, toughness: number) {
    const filter = (card: ICardInstance, gameState: IGameState) => {
      const sourceCard = gameState.cardInstances.get(sourceCardInstanceId);
      return sourceCard?.controllerPlayerId === card.controllerPlayerId;
    };
    const effect = new PowerToughnessEffect(power, toughness, filter);
    super(id, sourceCardInstanceId, effect);
  }
}