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
    const card = gameState.getCardInstance(target.cardInstanceId);
    if (!card) {
      return false;
    }
    const zone = gameState.getZone(card.currentZoneId);
    if (!zone || zone.name !== 'Battlefield') {
      return false;
    }
    const cardDefinition = context.cardDefinitions.get(card.definitionId);
    if (!cardDefinition || !cardDefinition.types.includes('Creature')) {
      return false;
    }
    return true;
  }

  public resolve(gameState: IGameState, context: EffectContext): IGameState {
    if (!this.validateTargets(gameState, context)) {
      return gameState;
    }

    // Deep clone the game state to maintain immutability
    const newState = structuredClone(gameState);

    const targetCardId = context.targets![0].cardInstanceId!;
    const card = newState.cardInstances.get(targetCardId);
    if (!card) {
      // Should not happen if validateTargets passed
      return gameState;
    }

    const owner = newState.players.get(card.ownerPlayerId);
    if (!owner) {
      return gameState;
    }

    const battlefieldZone = newState.zones.get(card.currentZoneId) as Zone;
    const graveyardZone = newState.zones.get(owner.graveyardZoneId) as Zone;

    // Modify the cloned state
    battlefieldZone.cards = battlefieldZone.cards.filter(id => id !== card.id);
    graveyardZone.cards.push(card.id);
    card.currentZoneId = graveyardZone.id;

    // Update the maps in the new state
    newState.zones.set(battlefieldZone.id, battlefieldZone);
    newState.zones.set(graveyardZone.id, graveyardZone);
    newState.cardInstances.set(card.id, card);

    return newState;
  }
}