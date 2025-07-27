import { CardInstance } from '../../../src/core/game_state/card_instance';
import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { IGameState, ICardDefinition, ICardInstance, IPlayer, IZone } from '../../../src/core/game_state/interfaces';
import { AbilityRegistry, initializeAbilityRegistry } from '../../../src/core/abilities/registry';
import { ContinuousEffectProcessor } from '../../../src/core/rules/continuous_effect_processor';
import { EffectLayer, IContinuousEffect } from '../../../src/core/abilities/interfaces';
import { StaticAbilityBase } from '../../../src/implementations/abilities/static_ability_base';

// Helper function to create a mock card definition
const mockCardDefinition = (id: string, types: string[], power?: string, toughness?: string, abilities: any[] = []): ICardDefinition => ({
  id,
  name: `Card ${id}`,
  types,
  power,
  toughness,
  abilities,
});

describe('Static Abilities and ContinuousEffectProcessor', () => {
  let gameState: IGameState;
  let player1: IPlayer;
  let player2: IPlayer;
  let battlefield1: IZone;
  let battlefield2: IZone;
  let abilityRegistry: AbilityRegistry;
  let continuousEffectProcessor: ContinuousEffectProcessor;

  beforeEach(() => {
    player1 = new Player('player1');
    player2 = new Player('player2');
    battlefield1 = new Zone(player1.battlefieldZoneId, 'Battlefield', player1.id);
    battlefield2 = new Zone(player2.battlefieldZoneId, 'Battlefield', player2.id);

    abilityRegistry = initializeAbilityRegistry();
    continuousEffectProcessor = new ContinuousEffectProcessor();

    gameState = {
      players: new Map([
        [player1.id, player1],
        [player2.id, player2],
      ]),
      zones: new Map([
        [battlefield1.id, battlefield1],
        [battlefield2.id, battlefield2],
      ]),
      cardInstances: new Map(),
      cardDefinitions: new Map(),
      activePlayerId: player1.id,
      priorityPlayerId: player1.id,
      turn: 1,
      phase: 'Main',
      step: 'PreCombatMain',
      stackZoneId: 'stack',
      abilityRegistry,
    };
  });

  const createCreature = (id: string, definition: ICardDefinition, owner: IPlayer, controller: IPlayer): ICardInstance => {
    const zoneId = controller.id === player1.id ? battlefield1.id : battlefield2.id;
    const instance = new CardInstance(
      id,
      definition,
      owner.id,
      controller.id,
      zoneId,
      gameState
    );
    gameState.cardInstances.set(instance.id, instance);
    const zone = gameState.zones.get(zoneId);
    if (zone) {
      zone.cards.push(instance.id);
    }
    return instance;
  };

  it('should apply a static ability effect from a creature to other creatures', () => {
    const lordDef = mockCardDefinition('lord', ['Creature'], '1', '1', [
      { key: 'creatures_get_plus_one_plus_one', parameters: { power: 1, toughness: 1 } },
    ]);
    const lord = createCreature('lord_1', lordDef, player1, player1);

    const creature1Def = mockCardDefinition('bear', ['Creature'], '2', '2');
    const creature1 = createCreature('bear_1', creature1Def, player1, player1);

    const creature2Def = mockCardDefinition('goblin', ['Creature'], '1', '1');
    const creature2 = createCreature('goblin_1', creature2Def, player2, player2);

    const newGameState = continuousEffectProcessor.applyContinuousEffects(gameState);

    const updatedLord = newGameState.cardInstances.get(lord.id);
    const updatedCreature1 = newGameState.cardInstances.get(creature1.id);
    const updatedCreature2 = newGameState.cardInstances.get(creature2.id);

    // Lord affects itself and player1's other creature
    expect(updatedLord?.power).toBe('2');
    expect(updatedLord?.toughness).toBe('2');
    expect(updatedCreature1?.power).toBe('3');
    expect(updatedCreature1?.toughness).toBe('3');

    // Player2's creature is unaffected
    expect(updatedCreature2?.power).toBe('1');
    expect(updatedCreature2?.toughness).toBe('1');
  });

  it('should remove a static ability effect when the source is removed', () => {
    const lordDef = mockCardDefinition('lord', ['Creature'], '1', '1', [
      { key: 'creatures_get_plus_one_plus_one', parameters: { power: 1, toughness: 1 } },
    ]);
    const lord = createCreature('lord_1', lordDef, player1, player1);

    const creatureDef = mockCardDefinition('bear', ['Creature'], '2', '2');
    const creature = createCreature('bear_1', creatureDef, player1, player1);

    // Apply effects with the lord on the battlefield
    let newGameState = continuousEffectProcessor.applyContinuousEffects(gameState);
    let updatedCreature = newGameState.cardInstances.get(creature.id);
    expect(updatedCreature?.power).toBe('3');
    expect(updatedCreature?.toughness).toBe('3');

    // Remove the lord
    newGameState.cardInstances.delete(lord.id);
    const lordZone = newGameState.zones.get(lord.currentZoneId);
    if (lordZone) {
      lordZone.cards = lordZone.cards.filter(id => id !== lord.id);
    }

    // Re-apply effects
    newGameState = continuousEffectProcessor.applyContinuousEffects(newGameState);
    updatedCreature = newGameState.cardInstances.get(creature.id);

    // Effect should be gone
    expect(updatedCreature?.power).toBe('2');
    expect(updatedCreature?.toughness).toBe('2');
  });

  // Mock effect-creating functions for the layer test
  const createTypeChangeEffect = (filter: (card: ICardInstance) => boolean): IContinuousEffect => ({
    layer: EffectLayer.Type,
    apply: (gs: IGameState): IGameState => {
      const newCardInstances = new Map(gs.cardInstances);
      for (const card of newCardInstances.values()) {
        if (filter(card)) {
          const newCard = { ...card, types: ['Artifact', ...(card.types || [])] };
          newCardInstances.set(card.id, newCard);
        }
      }
      return { ...gs, cardInstances: newCardInstances };
    },
    remove: (gs: IGameState) => gs, // Not used in this test structure
  });

  const createPtChangeEffect = (filter: (card: ICardInstance) => boolean): IContinuousEffect => ({
    layer: EffectLayer.PowerToughness,
    apply: (gs: IGameState): IGameState => {
      const newCardInstances = new Map(gs.cardInstances);
      for (const card of newCardInstances.values()) {
        if (filter(card) && card.types?.includes('Artifact')) {
          const newCard = { ...card, power: '5', toughness: '5' };
          newCardInstances.set(card.id, newCard);
        }
      }
      return { ...gs, cardInstances: newCardInstances };
    },
    remove: (gs: IGameState) => gs, // Not used in this test structure
  });

  it('should apply effects in correct layer order', () => {
    const sourceDef = mockCardDefinition('source', ['Enchantment']);
    const source = createCreature('source_1', sourceDef, player1, player1);

    const targetDef = mockCardDefinition('target', ['Creature'], '1', '1');
    const target = createCreature('target_1', targetDef, player1, player1);

    const filter = (card: ICardInstance) => card.id === target.id;

    const ability1 = new StaticAbilityBase('type_change', source.id, createTypeChangeEffect(filter));
    const ability2 = new StaticAbilityBase('pt_change', source.id, createPtChangeEffect(filter));

    source.staticAbilities.push(ability1, ability2);

    const newGameState = continuousEffectProcessor.applyContinuousEffects(gameState);
    const updatedTarget = newGameState.cardInstances.get(target.id);

    expect(updatedTarget?.types).toContain('Artifact');
    expect(updatedTarget?.power).toBe('5');
    expect(updatedTarget?.toughness).toBe('5');
  });
});
