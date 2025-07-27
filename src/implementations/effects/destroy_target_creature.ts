import { IGameState, ICardInstance, ICardDefinition } from '../../core/game_state/interfaces';
import { EffectContext } from '../../core/abilities/interfaces';
import { TargetedEffectBase } from './targeted_effect_base';
import { Zone } from '../../core/game_state/zone';

export class DestroyTargetCreatureEffect extends TargetedEffectBase {
  public validateTargets(gameState: IGameState, context: EffectContext): boolean {
    if (!context.targets || context.targets.length !== 1) {
      return false;
    }
    const target = context.targets[0];
    if (!target.cardInstanceId) {
      return false;
    }
    const card = gameState.cardInstances.get(target.cardInstanceId);
    if (!card) {
      return false;
    }
    const zone = gameState.zones.get(card.currentZoneId);
    if (!zone || zone.name !== 'Battlefield') {
      return false;
    }
    const cardDefinition = gameState.cardDefinitions.get(card.definitionId);
    if (!cardDefinition || !cardDefinition.types || !cardDefinition.types.includes('Creature')) {
      return false;
    }
    return true;
  }

  public resolve(gameState: IGameState, context: EffectContext): IGameState {
    if (!this.validateTargets(gameState, context)) {
      return gameState;
    }

    const targetCardId = context.targets![0].cardInstanceId!;
    const originalCard = gameState.cardInstances.get(targetCardId);
    if (!originalCard) {
      return gameState;
    }

    const owner = gameState.players.get(originalCard.ownerPlayerId);
    if (!owner) {
      return gameState;
    }

    const originalBattlefield = gameState.zones.get(originalCard.currentZoneId) as Zone;
    const originalGraveyard = gameState.zones.get(owner.graveyardZoneId) as Zone;

    // Create new card and zone objects for the ones that are changing
    const newCard = { ...originalCard, currentZoneId: originalGraveyard.id };
    const newBattlefield = {
        ...originalBattlefield,
        cards: originalBattlefield.cards.filter(id => id !== originalCard.id)
    };
    const newGraveyard = {
        ...originalGraveyard,
        cards: [...originalGraveyard.cards, originalCard.id]
    };

    // Create new maps for cardInstances and zones
    const newCardInstances = new Map(gameState.cardInstances);
    newCardInstances.set(newCard.id, newCard);

    const newZones = new Map(gameState.zones);
    newZones.set(newBattlefield.id, newBattlefield);
    newZones.set(newGraveyard.id, newGraveyard);

    // Return the new game state
    return {
        ...gameState,
        cardInstances: newCardInstances,
        zones: newZones,
    };
  }
}