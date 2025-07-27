
import { TriggeredAbilityBase } from './triggered_ability_base';
import { IEffect, TriggerCondition } from '../../core/abilities/interfaces';
import { CREATURE_DIED } from '../../core/events/events';
import { GainLifeEffect } from '../effects/gain_life';

/**
 * Example triggered ability: "When this creature dies, you gain 1 life."
 */
export class WhenThisCreatureDiesGainLifeAbility extends TriggeredAbilityBase {
  constructor(id: string, sourceCardInstanceId: string) {
    const triggerCondition: TriggerCondition = {
      eventType: CREATURE_DIED,
      // In a real implementation, we might have a condition function here
      // to check if the creature that died is `sourceCardInstanceId`.
    };
    const effect: IEffect = new GainLifeEffect(1);

    super(id, sourceCardInstanceId, triggerCondition, effect);
  }
}
