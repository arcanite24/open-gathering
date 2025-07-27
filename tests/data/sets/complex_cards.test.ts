import { CardInstance } from '../../../src/core/game_state/card_instance';
import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { IGameState, ICardDefinition, ICardInstance, IPlayer, IZone } from '../../../src/core/game_state/interfaces';
import { AbilityRegistry, initializeAbilityRegistry } from '../../../src/core/abilities/registry';
import complexCards from '../../../data/sets/complex_cards.json';

describe('Complex Cards Data', () => {
    let gameState: IGameState;
    let player1: IPlayer;
    let player2: IPlayer;
    let battlefield1: IZone;
    let battlefield2: IZone;
    let abilityRegistry: AbilityRegistry;

    beforeEach(() => {
        player1 = new Player('player1');
        player2 = new Player('player2');
        battlefield1 = new Zone(player1.battlefieldZoneId, 'Battlefield', player1.id);
        battlefield2 = new Zone(player2.battlefieldZoneId, 'Battlefield', player2.id);

        abilityRegistry = initializeAbilityRegistry();

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

    it('should have valid JSON structure for all complex cards', () => {
        expect(Array.isArray(complexCards)).toBe(true);
        expect(complexCards.length).toBeGreaterThan(0);

        complexCards.forEach((card) => {
            expect(card).toHaveProperty('id');
            expect(card).toHaveProperty('name');
            expect(card).toHaveProperty('types');
            expect(typeof card.id).toBe('string');
            expect(typeof card.name).toBe('string');
            expect(Array.isArray(card.types)).toBe(true);
        });
    });

    it('should create card instances for creatures with abilities', () => {
        const benalishMarshal = complexCards.find(card => card.id === 'benalish_marshal');
        expect(benalishMarshal).toBeDefined();
        expect(benalishMarshal?.abilities).toHaveLength(1);
        expect(benalishMarshal?.abilities?.[0].key).toBe('creatures_get_plus_one_plus_one');

        const cardInstance = new CardInstance(
            'test_marshal',
            benalishMarshal as ICardDefinition,
            player1.id,
            player1.id,
            battlefield1.id,
            gameState
        );

        expect(cardInstance.staticAbilities).toHaveLength(1);
        expect(cardInstance.staticAbilities[0].id).toContain('ability_');
    });

    it('should create card instances for creatures with triggered abilities', () => {
        const graveyardSpecter = complexCards.find(card => card.id === 'graveyard_specter');
        expect(graveyardSpecter).toBeDefined();
        expect(graveyardSpecter?.abilities).toHaveLength(1);
        expect(graveyardSpecter?.abilities?.[0].key).toBe('when_this_creature_dies_gain_life');

        const cardInstance = new CardInstance(
            'test_specter',
            graveyardSpecter as ICardDefinition,
            player1.id,
            player1.id,
            battlefield1.id,
            gameState
        );

        expect(cardInstance.triggeredAbilities).toHaveLength(1);
        expect(cardInstance.triggeredAbilities[0].id).toContain('ability_');
    });

    it('should create card instances for creatures with activated abilities', () => {
        const llanowarElves = complexCards.find(card => card.id === 'llanowar_elves');
        expect(llanowarElves).toBeDefined();
        expect(llanowarElves?.abilities).toHaveLength(1);
        expect(llanowarElves?.abilities?.[0].key).toBe('inherent_ability_tap_add_mana');

        const cardInstance = new CardInstance(
            'test_elves',
            llanowarElves as ICardDefinition,
            player1.id,
            player1.id,
            battlefield1.id,
            gameState
        );

        expect(cardInstance.activatedAbilities).toHaveLength(1);
        expect(cardInstance.activatedAbilities[0].id).toContain('ability_');
    });

    it('should have correct power and toughness for creatures', () => {
        const serraAngel = complexCards.find(card => card.id === 'serra_angel');
        expect(serraAngel).toBeDefined();
        expect(serraAngel?.power).toBe('4');
        expect(serraAngel?.toughness).toBe('4');
        expect(serraAngel?.types).toContain('Creature');
        expect(serraAngel?.subtypes).toContain('Angel');

        const llanowarElves = complexCards.find(card => card.id === 'llanowar_elves');
        expect(llanowarElves).toBeDefined();
        expect(llanowarElves?.power).toBe('1');
        expect(llanowarElves?.toughness).toBe('1');
        expect(llanowarElves?.types).toContain('Creature');
        expect(llanowarElves?.subtypes).toContain('Elf');
        expect(llanowarElves?.subtypes).toContain('Druid');
    });

    it('should have correct mana costs for all cards', () => {
        const lightningBolt = complexCards.find(card => card.id === 'lightning_bolt');
        expect(lightningBolt).toBeDefined();
        expect(lightningBolt?.manaCost).toBe('{R}');
        expect(lightningBolt?.cmc).toBe(1);

        const counterspell = complexCards.find(card => card.id === 'counterspell');
        expect(counterspell).toBeDefined();
        expect(counterspell?.manaCost).toBe('{U}{U}');
        expect(counterspell?.cmc).toBe(2);

        const serraAngel = complexCards.find(card => card.id === 'serra_angel');
        expect(serraAngel).toBeDefined();
        expect(serraAngel?.manaCost).toBe('{3}{W}{W}');
        expect(serraAngel?.cmc).toBe(5);
    });

    it('should include enchantments with static abilities', () => {
        const crusade = complexCards.find(card => card.id === 'crusade');
        expect(crusade).toBeDefined();
        expect(crusade?.types).toContain('Enchantment');
        expect(crusade?.abilities).toHaveLength(1);
        expect(crusade?.abilities?.[0].key).toBe('creatures_get_plus_one_plus_one');

        const badMoon = complexCards.find(card => card.id === 'bad_moon');
        expect(badMoon).toBeDefined();
        expect(badMoon?.types).toContain('Enchantment');
        expect(badMoon?.abilities).toHaveLength(1);
        expect(badMoon?.abilities?.[0].key).toBe('creatures_get_plus_one_plus_one');
    });

    it('should include instants with effects', () => {
        const lightningBolt = complexCards.find(card => card.id === 'lightning_bolt');
        expect(lightningBolt).toBeDefined();
        expect(lightningBolt?.types).toContain('Instant');
        expect(lightningBolt?.effects).toHaveLength(1);
        expect(lightningBolt?.effects?.[0].key).toBe('deal_damage');

        const counterspell = complexCards.find(card => card.id === 'counterspell');
        expect(counterspell).toBeDefined();
        expect(counterspell?.types).toContain('Instant');
        expect(counterspell?.effects).toHaveLength(1);
        expect(counterspell?.effects?.[0].key).toBe('counter_target_spell');
    });

    it('should reference only existing ability keys', () => {
        const registeredAbilities = ['inherent_ability_tap_add_mana', 'when_this_creature_dies_gain_life', 'creatures_get_plus_one_plus_one'];

        complexCards.forEach((card) => {
            if (card.abilities) {
                card.abilities.forEach((ability) => {
                    expect(registeredAbilities).toContain(ability.key);
                });
            }
        });
    });
});
