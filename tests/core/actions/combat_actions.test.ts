import { declareAttackers, declareBlockers } from '../../../src/core/actions/combat_actions';
import { IGameState, IPlayer, IZone, ICardInstance } from '../../../src/core/game_state/interfaces';
import { initializeAbilityRegistry } from '../../../src/core/abilities/registry';

describe('Combat Actions', () => {
    let gameState: IGameState;

    beforeEach(() => {
        const player1: IPlayer = {
            id: 'p1',
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
            handZoneId: 'p1-hand',
            libraryZoneId: 'p1-library',
            graveyardZoneId: 'p1-graveyard',
            exileZoneId: 'p1-exile',
            battlefieldZoneId: 'p1-battlefield',
            landsPlayedThisTurn: 0,
            hasLost: false,
        };

        const player2: IPlayer = {
            id: 'p2',
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
            handZoneId: 'p2-hand',
            libraryZoneId: 'p2-library',
            graveyardZoneId: 'p2-graveyard',
            exileZoneId: 'p2-exile',
            battlefieldZoneId: 'p2-battlefield',
            landsPlayedThisTurn: 0,
            hasLost: false,
        };

        const creatureDef1 = {
            id: 'creature-def-1',
            name: 'Test Creature 1',
            cmc: 2,
            types: ['Creature'],
            subtypes: ['Test'],
            supertypes: [],
            manaCost: '{1}{W}',
            oracleText: 'A test creature.',
            power: '2',
            toughness: '2'
        };

        const creatureDef2 = {
            id: 'creature-def-2',
            name: 'Test Creature 2',
            cmc: 3,
            types: ['Creature'],
            subtypes: ['Test'],
            supertypes: [],
            manaCost: '{2}{B}',
            oracleText: 'Another test creature.',
            power: '2',
            toughness: '3'
        };

        const creature1: ICardInstance = {
            id: 'c1',
            definition: creatureDef1,
            definitionId: 'creature-def-1',
            ownerPlayerId: 'p1',
            controllerPlayerId: 'p1',
            currentZoneId: 'p1-battlefield',
            isTapped: false,
            damageMarked: 0,
            counters: new Map(),
            staticAbilities: [],
            triggeredAbilities: [],
            activatedAbilities: [],
            turnEnteredBattlefield: 1,
            isAttacking: false,
            isBlocking: false,
            blockedBy: [],
        };

        const creature2: ICardInstance = {
            id: 'c2',
            definition: creatureDef2,
            definitionId: 'creature-def-2',
            ownerPlayerId: 'p2',
            controllerPlayerId: 'p2',
            currentZoneId: 'p2-battlefield',
            isTapped: false,
            damageMarked: 0,
            counters: new Map(),
            staticAbilities: [],
            triggeredAbilities: [],
            activatedAbilities: [],
            turnEnteredBattlefield: 1,
            isAttacking: false,
            isBlocking: false,
            blockedBy: [],
        };

        const battlefield1: IZone = { id: 'p1-battlefield', name: 'Battlefield', cards: ['c1'], ownerPlayerId: 'p1' };
        const battlefield2: IZone = { id: 'p2-battlefield', name: 'Battlefield', cards: ['c2'], ownerPlayerId: 'p2' };

        gameState = {
            players: new Map([['p1', player1], ['p2', player2]]),
            zones: new Map([['p1-battlefield', battlefield1], ['p2-battlefield', battlefield2]]),
            cardInstances: new Map([['c1', creature1], ['c2', creature2]]),
            activePlayerId: 'p1',
            priorityPlayerId: 'p1',
            turn: 1,
            phase: 'Combat',
            step: 'DeclareAttackers',
            stackZoneId: 'stack',
            cardDefinitions: new Map([
                [creatureDef1.id, creatureDef1],
                [creatureDef2.id, creatureDef2]
            ]),
            abilityRegistry: initializeAbilityRegistry()
        };
    });

    describe('declareAttackers', () => {
        it('should allow the active player to declare attackers', () => {
            const newState = declareAttackers(gameState, 'p1', ['c1']);
            expect(newState.cardInstances.get('c1')?.isAttacking).toBe(true);
        });

        it('should throw an error if a non-active player tries to declare attackers', () => {
            expect(() => declareAttackers(gameState, 'p2', ['c2'])).toThrow('Only the active player can declare attackers.');
        });

        it('should throw an error if declared outside of the declare attackers step', () => {
            gameState.step = 'BeginCombat';
            expect(() => declareAttackers(gameState, 'p1', ['c1'])).toThrow('Attackers can only be declared in the Declare Attackers step.');
        });
    });

    describe('declareBlockers', () => {
        beforeEach(() => {
            gameState = declareAttackers(gameState, 'p1', ['c1']);
            gameState.step = 'DeclareBlockers';
        });

        it('should allow a player to declare blockers', () => {
            const newState = declareBlockers(gameState, 'p2', [{ blockerId: 'c2', attackerId: 'c1' }]);
            const blocker = newState.cardInstances.get('c2');
            const attacker = newState.cardInstances.get('c1');
            expect(blocker?.isBlocking).toBe(true);
            expect(blocker?.blocking).toBe('c1');
            expect(attacker?.blockedBy).toContain('c2');
        });

        it('should throw an error if declared outside of the declare blockers step', () => {
            gameState.step = 'CombatDamage';
            expect(() => declareBlockers(gameState, 'p2', [{ blockerId: 'c2', attackerId: 'c1' }])).toThrow('Blockers can only be declared in the Declare Blockers step.');
        });

        it('should throw an error if blocking a non-attacking creature', () => {
            const attacker = gameState.cardInstances.get('c1')!;
            gameState.cardInstances.set('c1', { ...attacker, isAttacking: false });
            expect(() => declareBlockers(gameState, 'p2', [{ blockerId: 'c2', attackerId: 'c1' }])).toThrow('Card c1 is not a valid attacker to block.');
        });
    });
});
