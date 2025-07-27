import { CombatManager } from '../../../src/core/rules/combat_manager';
import { IGameState, IPlayer, ICardInstance, IZone, ICardDefinition } from '../../../src/core/game_state/interfaces';
import { initializeAbilityRegistry } from '../../../src/core/abilities/registry';

describe('CombatManager', () => {
    let combatManager: CombatManager;
    let gameState: IGameState;
    let cardDefinitions: Map<string, ICardDefinition>;

    beforeEach(() => {
        combatManager = new CombatManager();

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

        const attackerDefinition: ICardDefinition = {
            id: 'creature-def-1',
            name: 'Attacker Creature',
            cmc: 2,
            types: ['Creature'],
            subtypes: ['Test'],
            supertypes: [],
            manaCost: '{1}{W}',
            oracleText: 'A test attacking creature.',
            power: '2',
            toughness: '2'
        };

        const blockerDefinition: ICardDefinition = {
            id: 'creature-def-2',
            name: 'Blocker Creature',
            cmc: 3,
            types: ['Creature'],
            subtypes: ['Test'],
            supertypes: [],
            manaCost: '{2}{G}',
            oracleText: 'A test blocking creature.',
            power: '2',
            toughness: '3'
        };

        const attacker: ICardInstance = {
            id: 'c1',
            definition: attackerDefinition,
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
            isAttacking: true,
            isBlocking: false,
            blockedBy: [],
        };

        const blocker: ICardInstance = {
            id: 'c2',
            definition: blockerDefinition,
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

        gameState = {
            players: new Map([['p1', player1], ['p2', player2]]),
            zones: new Map(),
            cardInstances: new Map([['c1', attacker], ['c2', blocker]]),
            activePlayerId: 'p1',
            priorityPlayerId: 'p1',
            turn: 1,
            phase: 'Combat',
            step: 'CombatDamage',
            stackZoneId: 'stack',
            cardDefinitions: new Map([
                [attackerDefinition.id, attackerDefinition],
                [blockerDefinition.id, blockerDefinition]
            ]),
            abilityRegistry: initializeAbilityRegistry()
        };

        cardDefinitions = new Map([
            ['creature-def-1', { id: 'creature-def-1', name: 'Attacker', types: ['Creature'], power: '2', toughness: '2', oracleText: '' }],
            ['creature-def-2', { id: 'creature-def-2', name: 'Blocker', types: ['Creature'], power: '1', toughness: '3', oracleText: '' }],
            ['first-striker-def', { id: 'first-striker-def', name: 'First Striker', types: ['Creature'], power: '2', toughness: '2', oracleText: 'First strike' }],
            ['double-striker-def', { id: 'double-striker-def', name: 'Double Striker', types: ['Creature'], power: '2', toughness: '2', oracleText: 'Double strike' }],
            ['trampler-def', { id: 'trampler-def', name: 'Trampler', types: ['Creature'], power: '4', toughness: '2', oracleText: 'Trample' }],
        ]);
    });

    it('should deal damage to the defending player if attacker is unblocked', () => {
        const newState = combatManager.resolveCombatDamage(gameState, cardDefinitions);
        const defendingPlayer = newState.players.get('p2')!;
        expect(defendingPlayer.life).toBe(18);
    });

    it('should deal damage to both attacker and blocker in combat', () => {
        let attacker = gameState.cardInstances.get('c1')!;
        let blocker = gameState.cardInstances.get('c2')!;
        attacker = { ...attacker, blockedBy: ['c2'] };
        blocker = { ...blocker, isBlocking: true, blocking: 'c1' };
        gameState.cardInstances.set('c1', attacker);
        gameState.cardInstances.set('c2', blocker);

        const newState = combatManager.resolveCombatDamage(gameState, cardDefinitions);

        const finalAttacker = newState.cardInstances.get('c1')!;
        const finalBlocker = newState.cardInstances.get('c2')!;

        expect(finalAttacker.damageMarked).toBe(1);
        expect(finalBlocker.damageMarked).toBe(2);
    });

    it('should handle first strike correctly', () => {
        let attacker = gameState.cardInstances.get('c1')!;
        let blocker = gameState.cardInstances.get('c2')!;
        attacker = { ...attacker, definitionId: 'first-striker-def', hasFirstStrike: true, blockedBy: ['c2'] };
        blocker = { ...blocker, isBlocking: true, blocking: 'c1' };
        gameState.cardInstances.set('c1', attacker);
        gameState.cardInstances.set('c2', blocker);

        const newState = combatManager.resolveCombatDamage(gameState, cardDefinitions);

        const finalAttacker = newState.cardInstances.get('c1')!;
        const finalBlocker = newState.cardInstances.get('c2')!;

        expect(finalAttacker.damageMarked).toBe(0);
        expect(finalBlocker.damageMarked).toBe(2);
    });

    it('should handle double strike correctly', () => {
        let attacker = gameState.cardInstances.get('c1')!;
        let blocker = gameState.cardInstances.get('c2')!;
        attacker = { ...attacker, definitionId: 'double-striker-def', hasDoubleStrike: true, blockedBy: ['c2'] };
        blocker = { ...blocker, isBlocking: true, blocking: 'c1' };
        gameState.cardInstances.set('c1', attacker);
        gameState.cardInstances.set('c2', blocker);

        const newState = combatManager.resolveCombatDamage(gameState, cardDefinitions);

        const finalAttacker = newState.cardInstances.get('c1')!;
        const finalBlocker = newState.cardInstances.get('c2')!;

        expect(finalAttacker.damageMarked).toBe(1);
        expect(finalBlocker.damageMarked).toBe(4);
    });

    it('should handle trample correctly', () => {
        let attacker = gameState.cardInstances.get('c1')!;
        let blocker = gameState.cardInstances.get('c2')!;
        attacker = { ...attacker, definitionId: 'trampler-def', hasTrample: true, blockedBy: ['c2'] };
        blocker = { ...blocker, isBlocking: true, blocking: 'c1' };
        gameState.cardInstances.set('c1', attacker);
        gameState.cardInstances.set('c2', blocker);

        const newState = combatManager.resolveCombatDamage(gameState, cardDefinitions);

        const finalAttacker = newState.cardInstances.get('c1')!;
        const finalBlocker = newState.cardInstances.get('c2')!;
        const defendingPlayer = newState.players.get('p2')!;

        expect(finalAttacker.damageMarked).toBe(1);
        expect(finalBlocker.damageMarked).toBe(3);
        expect(defendingPlayer.life).toBe(19);
    });

    it('should handle first strike and trample correctly', () => {
        let attacker = gameState.cardInstances.get('c1')!;
        let blocker = gameState.cardInstances.get('c2')!;
        attacker = { ...attacker, definitionId: 'trampler-def', hasFirstStrike: true, hasTrample: true, blockedBy: ['c2'] };
        blocker = { ...blocker, isBlocking: true, blocking: 'c1' };
        gameState.cardInstances.set('c1', attacker);
        gameState.cardInstances.set('c2', blocker);

        const newState = combatManager.resolveCombatDamage(gameState, cardDefinitions);

        const finalAttacker = newState.cardInstances.get('c1')!;
        const finalBlocker = newState.cardInstances.get('c2')!;
        const defendingPlayer = newState.players.get('p2')!;

        expect(finalAttacker.damageMarked).toBe(0);
        expect(finalBlocker.damageMarked).toBe(3);
        expect(defendingPlayer.life).toBe(19);
    });
});