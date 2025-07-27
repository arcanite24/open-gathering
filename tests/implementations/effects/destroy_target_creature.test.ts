import { GameState } from '../../../src/core/game_state/game_state';
import { Player } from '../../../src/core/game_state/player';
import { CardInstance } from '../../../src/core/game_state/card_instance';
import { DestroyTargetCreatureEffect } from '../../../src/implementations/effects/destroy_target_creature';
import { ICardDefinition } from '../../../src/core/game_state/interfaces';
import { EffectContext } from '../../../src/core/abilities/interfaces';

describe('DestroyTargetCreatureEffect', () => {
  let gameState: GameState;
  let player1: Player;
  let player2: Player;
  let creature: CardInstance;
  let creatureDefinition: ICardDefinition;
  let cardDefinitions: Map<string, ICardDefinition>;

  beforeEach(() => {
    player1 = new Player('p1');
    player2 = new Player('p2');
    gameState = new GameState(player1, player2);

    creatureDefinition = {
      id: 'def_creature',
      name: 'Test Creature',
      cmc: 2,
      types: ['Creature'],
      subtypes: ['Test'],
      supertypes: [],
      manaCost: '{1}{B}',
      oracleText: 'A test creature.',
      power: '2',
      toughness: '2',
    };

    cardDefinitions = new Map<string, ICardDefinition>([
      [creatureDefinition.id, creatureDefinition],
    ]);

    gameState.cardDefinitions = cardDefinitions;

    creature = new CardInstance(
      'inst_creature',
      creatureDefinition,
      player1.id,
      player1.id,
      player1.battlefieldZoneId,
      gameState
    );

    gameState.cardInstances.set(creature.id, creature);
    const battlefield = gameState.getZone(player1.battlefieldZoneId)!;
    battlefield.cards.push(creature.id);
  });

  it('should destroy a target creature', () => {
    const effect = new DestroyTargetCreatureEffect();
    const context: EffectContext = {
      sourceCardInstanceId: 'source_card',
      targets: [{ cardInstanceId: creature.id }],
    };

    const newState = effect.resolve(gameState, context);

    const movedCard = newState.cardInstances.get(creature.id)!;
    const oldZone = newState.zones.get(player1.battlefieldZoneId)!;
    const newZone = newState.zones.get(player1.graveyardZoneId)!;

    expect(movedCard.currentZoneId).toBe(player1.graveyardZoneId);
    expect(oldZone.cards).not.toContain(creature.id);
    expect(newZone.cards).toContain(creature.id);
  });

  it('should not resolve if target is invalid', () => {
    const effect = new DestroyTargetCreatureEffect();
    const context: EffectContext = {
      sourceCardInstanceId: 'source_card',
      targets: [{ cardInstanceId: 'invalid_target' }],
    };

    const newState = effect.resolve(gameState, context);

    expect(newState).toBe(gameState);
  });
});
