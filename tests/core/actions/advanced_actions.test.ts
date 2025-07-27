import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { CardInstance } from '../../../src/core/game_state/card_instance';
import { IGameState, ICardDefinition, ICardInstance, IPlayer, IZone } from '../../../src/core/game_state/interfaces';
import { AbilityRegistry, initializeAbilityRegistry } from '../../../src/core/abilities/registry';
import { TapAddManaAbility } from '../../../src/implementations/abilities/activated_tap_add_mana';
import {
    canActivateAbility,
    activateAbility,
    canTarget,
    canTargetPlayer,
    getValidTargets,
    getValidPlayerTargets,
    validateTargets,
    createCardTarget,
    createPlayerTarget
} from '../../../src/core/actions/advanced_actions';

describe('Advanced Actions', () => {
    let gameState: IGameState;
    let player1: IPlayer;
    let player2: IPlayer;
    let battlefield1: IZone;
    let battlefield2: IZone;
    let hand1: IZone;
    let abilityRegistry: AbilityRegistry;

    // Helper function to create a mock card definition
    const mockCardDefinition = (id: string, types: string[], abilities: any[] = []): ICardDefinition => ({
        id,
        name: `Card ${id}`,
        types,
        abilities,
    });

    // Helper function to create a card instance on the battlefield
    const createCardOnBattlefield = (id: string, definition: ICardDefinition, owner: IPlayer, controller: IPlayer): ICardInstance => {
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

    beforeEach(() => {
        player1 = new Player('player1');
        player2 = new Player('player2');
        battlefield1 = new Zone(player1.battlefieldZoneId, 'Battlefield', player1.id);
        battlefield2 = new Zone(player2.battlefieldZoneId, 'Battlefield', player2.id);
        hand1 = new Zone(player1.handZoneId, 'Hand', player1.id);

        abilityRegistry = initializeAbilityRegistry();

        gameState = {
            players: new Map([
                [player1.id, player1],
                [player2.id, player2],
            ]),
            zones: new Map([
                [battlefield1.id, battlefield1],
                [battlefield2.id, battlefield2],
                [hand1.id, hand1],
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

    describe('canActivateAbility', () => {
        it('should return true when player can activate their own ability', () => {
            const landDef = mockCardDefinition('plains', ['Land'], [
                { key: 'inherent_ability_tap_add_mana', parameters: { mana: '{W}' } }
            ]);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            expect(land.activatedAbilities).toHaveLength(1);
            const abilityId = land.activatedAbilities[0].id;

            const result = canActivateAbility(gameState, player1.id, land.id, abilityId);
            expect(result).toBe(true);
        });

        it('should return false when player does not control the card', () => {
            const landDef = mockCardDefinition('plains', ['Land'], [
                { key: 'inherent_ability_tap_add_mana', parameters: { mana: '{W}' } }
            ]);
            const land = createCardOnBattlefield('plains_1', landDef, player2, player2);

            expect(land.activatedAbilities).toHaveLength(1);
            const abilityId = land.activatedAbilities[0].id;

            const result = canActivateAbility(gameState, player1.id, land.id, abilityId);
            expect(result).toBe(false);
        });

        it('should return false when card does not exist', () => {
            const result = canActivateAbility(gameState, player1.id, 'nonexistent', 'ability1');
            expect(result).toBe(false);
        });

        it('should return false when ability does not exist', () => {
            const landDef = mockCardDefinition('plains', ['Land']);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            const result = canActivateAbility(gameState, player1.id, land.id, 'nonexistent_ability');
            expect(result).toBe(false);
        });

        it('should return false when ability cannot be activated (e.g., already tapped)', () => {
            const landDef = mockCardDefinition('plains', ['Land'], [
                { key: 'inherent_ability_tap_add_mana', parameters: { mana: '{W}' } }
            ]);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            // Tap the land
            land.isTapped = true;

            expect(land.activatedAbilities).toHaveLength(1);
            const abilityId = land.activatedAbilities[0].id;

            const result = canActivateAbility(gameState, player1.id, land.id, abilityId);
            expect(result).toBe(false);
        });
    });

    describe('activateAbility', () => {
        it('should successfully activate an ability', () => {
            const landDef = mockCardDefinition('plains', ['Land'], [
                { key: 'inherent_ability_tap_add_mana', parameters: { mana: '{W}' } }
            ]);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            expect(land.activatedAbilities).toHaveLength(1);
            const abilityId = land.activatedAbilities[0].id;

            const result = activateAbility(gameState, player1.id, land.id, abilityId);

            expect(result.success).toBe(true);
            expect(result.gameState).toBeDefined();
            expect(result.error).toBeUndefined();

            // Check that the land is now tapped
            const updatedLand = result.gameState!.cardInstances.get(land.id);
            expect(updatedLand?.isTapped).toBe(true);

            // Check that mana was added
            const updatedPlayer = result.gameState!.players.get(player1.id);
            expect(updatedPlayer?.manaPool.W).toBe(1);
        });

        it('should fail when ability cannot be activated', () => {
            const landDef = mockCardDefinition('plains', ['Land'], [
                { key: 'inherent_ability_tap_add_mana', parameters: { mana: '{W}' } }
            ]);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            // Tap the land first
            land.isTapped = true;

            expect(land.activatedAbilities).toHaveLength(1);
            const abilityId = land.activatedAbilities[0].id;

            const result = activateAbility(gameState, player1.id, land.id, abilityId);

            expect(result.success).toBe(false);
            expect(result.gameState).toBeUndefined();
            expect(result.error).toBeDefined();
        });

        it('should fail when card does not exist', () => {
            const result = activateAbility(gameState, player1.id, 'nonexistent', 'ability1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot activate ability');
        });
    });

    describe('canTarget', () => {
        it('should return true for valid creature target', () => {
            const creatureDef = mockCardDefinition('bear', ['Creature']);
            const creature = createCardOnBattlefield('bear_1', creatureDef, player1, player1);

            const result = canTarget(gameState, player1.id, creature.id, 'creature');
            expect(result).toBe(true);
        });

        it('should return false for invalid creature target (not a creature)', () => {
            const landDef = mockCardDefinition('plains', ['Land']);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            const result = canTarget(gameState, player1.id, land.id, 'creature');
            expect(result).toBe(false);
        });

        it('should return true for permanent target (any card on battlefield)', () => {
            const landDef = mockCardDefinition('plains', ['Land']);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            const result = canTarget(gameState, player1.id, land.id, 'permanent');
            expect(result).toBe(true);
        });

        it('should return false for card not on battlefield', () => {
            const cardDef = mockCardDefinition('card', ['Creature']);
            const cardInHand = new CardInstance('card_1', cardDef, player1.id, player1.id, hand1.id, gameState);
            gameState.cardInstances.set(cardInHand.id, cardInHand);
            hand1.cards.push(cardInHand.id);

            const result = canTarget(gameState, player1.id, cardInHand.id, 'creature');
            expect(result).toBe(false);
        });
    });

    describe('canTargetPlayer', () => {
        it('should return true for valid player target', () => {
            const result = canTargetPlayer(gameState, player1.id, player2.id);
            expect(result).toBe(true);
        });

        it('should return false for nonexistent player', () => {
            const result = canTargetPlayer(gameState, player1.id, 'nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('getValidTargets', () => {
        it('should return all creatures when looking for creature targets', () => {
            const creature1Def = mockCardDefinition('bear', ['Creature']);
            const creature2Def = mockCardDefinition('elf', ['Creature']);
            const landDef = mockCardDefinition('plains', ['Land']);

            const creature1 = createCardOnBattlefield('bear_1', creature1Def, player1, player1);
            const creature2 = createCardOnBattlefield('elf_1', creature2Def, player2, player2);
            createCardOnBattlefield('plains_1', landDef, player1, player1);

            const targets = getValidTargets(gameState, player1.id, 'creature');
            expect(targets).toHaveLength(2);
            expect(targets).toContain(creature1.id);
            expect(targets).toContain(creature2.id);
        });

        it('should respect controller restrictions', () => {
            const creature1Def = mockCardDefinition('bear', ['Creature']);
            const creature2Def = mockCardDefinition('elf', ['Creature']);

            const creature1 = createCardOnBattlefield('bear_1', creature1Def, player1, player1);
            const creature2 = createCardOnBattlefield('elf_1', creature2Def, player2, player2);

            const selfTargets = getValidTargets(gameState, player1.id, 'creature', 'self');
            expect(selfTargets).toHaveLength(1);
            expect(selfTargets).toContain(creature1.id);

            const opponentTargets = getValidTargets(gameState, player1.id, 'creature', 'opponent');
            expect(opponentTargets).toHaveLength(1);
            expect(opponentTargets).toContain(creature2.id);
        });
    });

    describe('getValidPlayerTargets', () => {
        it('should return all players when no restriction', () => {
            const targets = getValidPlayerTargets(gameState, player1.id);
            expect(targets).toHaveLength(2);
            expect(targets).toContain(player1.id);
            expect(targets).toContain(player2.id);
        });

        it('should respect player restrictions', () => {
            const selfTargets = getValidPlayerTargets(gameState, player1.id, 'self');
            expect(selfTargets).toHaveLength(1);
            expect(selfTargets).toContain(player1.id);

            const opponentTargets = getValidPlayerTargets(gameState, player1.id, 'opponent');
            expect(opponentTargets).toHaveLength(1);
            expect(opponentTargets).toContain(player2.id);
        });
    });

    describe('validateTargets', () => {
        it('should validate correct targets', () => {
            const creatureDef = mockCardDefinition('bear', ['Creature']);
            const creature = createCardOnBattlefield('bear_1', creatureDef, player1, player1);

            const targets = [createCardTarget(creature.id)];
            const requirements = [{ type: 'creature', count: 1 }];

            const result = validateTargets(gameState, player1.id, targets, requirements);
            expect(result).toBe(true);
        });

        it('should reject incorrect target types', () => {
            const landDef = mockCardDefinition('plains', ['Land']);
            const land = createCardOnBattlefield('plains_1', landDef, player1, player1);

            const targets = [createCardTarget(land.id)];
            const requirements = [{ type: 'creature', count: 1 }];

            const result = validateTargets(gameState, player1.id, targets, requirements);
            expect(result).toBe(false);
        });

        it('should reject wrong number of targets', () => {
            const creatureDef = mockCardDefinition('bear', ['Creature']);
            const creature = createCardOnBattlefield('bear_1', creatureDef, player1, player1);

            const targets = [createCardTarget(creature.id)];
            const requirements = [{ type: 'creature', count: 2 }];

            const result = validateTargets(gameState, player1.id, targets, requirements);
            expect(result).toBe(false);
        });
    });

    describe('target creation helpers', () => {
        it('should create card targets correctly', () => {
            const target = createCardTarget('card123');
            expect(target.type).toBe('card');
            expect(target.cardInstanceId).toBe('card123');
        });

        it('should create player targets correctly', () => {
            const target = createPlayerTarget('player123');
            expect(target.type).toBe('player');
            expect(target.playerId).toBe('player123');
        });
    });
});
