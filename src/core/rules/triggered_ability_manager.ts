
import { EventBus } from '../events/event_bus';
import { GameEvent } from '../events/event_types';
import { IGameState, ICardInstance } from '../game_state/interfaces';
import { ITriggeredAbility } from '../abilities/interfaces';

export class TriggeredAbilityManager {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.eventBus.subscribe('*', this.handleEvent.bind(this));
  }

  private handleEvent(event: GameEvent, gameState: IGameState): IGameState {
    let newState = gameState;
    for (const card of gameState.cardInstances.values()) {
      for (const abilityId of card.triggeredAbilities) {
        // This is a simplification. We would need a way to get the ability object from its ID.
        // Assuming card instance has the full ability objects for now.
        const ability = (card as any).abilities.find((a: ITriggeredAbility) => a.id === abilityId);
        if (ability && ability.checkTrigger(event, newState)) {
          newState = ability.resolve(newState);
        }
      }
    }
    return newState;
  }
}
