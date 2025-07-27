
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
      for (const ability of card.triggeredAbilities) {
        if (ability && ability.checkTrigger(event, newState)) {
          newState = ability.resolve(newState);
        }
      }
    }
    return newState;
  }
}
