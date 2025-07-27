import { SBAChecker } from '../../../src/core/rules/sba_checker';
import { IGameState, IPlayer, ICardInstance, IZone, ICardDefinition } from '../../../src/core/game_state/interfaces';

describe('SBAChecker', () => {
    let sbaChecker: SBAChecker;
    let gameState: IGameState;
    let cardDefinitions: Map<string, ICardDefinition>;

    beforeEach(() => {
        sbaChecker = new SBAChecker();

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

        cardDefinitions = new Map([
            ['creature-def-1', { id: 'creature-def-1', name: 'Grizzly Bears', types: ['Creature'], manaCost: '{1}{G}', cmc: 2, power: '2', toughness: '2', oracleText: '', subtypes: ['Bear'], supertypes: [] }],
            ['creature-def-2', { id: 'creature-def-2', name: 'Merfolk of the Pearl Trident', types: ['Creature'], manaCost: '{U}', cmc: 1, power: '1', toughness: '1', oracleText: '', subtypes: ['Merfolk'], supertypes: [] }],
        ]);

        const creature1: ICardInstance = {
            id: 'c1',
            definitionId: 'creature-def-1',
            definition: cardDefinitions.get('creature-def-1')!,
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
        };

        const creature2: ICardInstance = {
            id: 'c2',
            definitionId: 'creature-def-2',
            definition: cardDefinitions.get('creature-def-2')!,
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
        };

        const battlefield1: IZone = { id: 'p1-battlefield', name: 'Battlefield', cards: ['c1'], ownerPlayerId: 'p1' };
        const graveyard1: IZone = { id: 'p1-graveyard', name: 'Graveyard', cards: [], ownerPlayerId: 'p1' };
        const battlefield2: IZone = { id: 'p2-battlefield', name: 'Battlefield', cards: ['c2'], ownerPlayerId: 'p2' };
        const graveyard2: IZone = { id: 'p2-graveyard', name: 'Graveyard', cards: [], ownerPlayerId: 'p2' };

        gameState = {
            players: new Map([['p1', player1], ['p2', player2]]),
            zones: new Map([['p1-battlefield', battlefield1], ['p1-graveyard', graveyard1], ['p2-battlefield', battlefield2], ['p2-graveyard', graveyard2]]),
            cardInstances: new Map([['c1', creature1], ['c2', creature2]]),
            cardDefinitions: cardDefinitions,
            activePlayerId: 'p1',
            priorityPlayerId: 'p1',
            turn: 1,
            phase: 'Main',
            step: 'PreCombatMain',
            stackZoneId: 'stack',
            abilityRegistry: {} as any
        };

        cardDefinitions = new Map([
            ['creature-def-1', { id: 'creature-def-1', name: 'Grizzly Bears', types: ['Creature'], manaCost: '{1}{G}', cmc: 2, power: '2', toughness: '2', oracleText: '', subtypes: ['Bear'], supertypes: [] }],
            ['creature-def-2', { id: 'creature-def-2', name: 'Merfolk of the Pearl Trident', types: ['Creature'], manaCost: '{U}', cmc: 1, power: '1', toughness: '1', oracleText: '', subtypes: ['Merfolk'], supertypes: [] }],
        ]);
    });

    it('should mark a player as lost if their life is 0 or less', () => {
        const player1 = gameState.players.get('p1')!;
        const newPlayer1 = { ...player1, life: 0 };
        gameState.players.set('p1', newPlayer1);

        const newState = sbaChecker.checkAndApplySBAs(gameState, cardDefinitions);

        expect(newState.players.get('p1')?.hasLost).toBe(true);
    });

    it('should move a creature with lethal damage to the graveyard', () => {
        const creature1 = gameState.cardInstances.get('c1')!;
        const newCreature1 = { ...creature1, damageMarked: 2 };
        gameState.cardInstances.set('c1', newCreature1);

        const newState = sbaChecker.checkAndApplySBAs(gameState, cardDefinitions);

        const newCreature = newState.cardInstances.get('c1')!;
        const oldZone = newState.zones.get('p1-battlefield')!;
        const newZone = newState.zones.get('p1-graveyard')!;

        expect(newCreature.currentZoneId).toBe('p1-graveyard');
        expect(oldZone.cards).not.toContain('c1');
        expect(newZone.cards).toContain('c1');
        expect(newCreature.damageMarked).toBe(0);
    });

    it('should move a creature with toughness 0 or less to the graveyard', () => {
        cardDefinitions.set('creature-def-1', { ...cardDefinitions.get('creature-def-1')!, toughness: '0' });

        const newState = sbaChecker.checkAndApplySBAs(gameState, cardDefinitions);

        const newCreature = newState.cardInstances.get('c1')!;
        const oldZone = newState.zones.get('p1-battlefield')!;
        const newZone = newState.zones.get('p1-graveyard')!;

        expect(newCreature.currentZoneId).toBe('p1-graveyard');
        expect(oldZone.cards).not.toContain('c1');
        expect(newZone.cards).toContain('c1');
    });

    it('should handle multiple SBAs in a loop', () => {
        const player1 = gameState.players.get('p1')!;
        const newPlayer1 = { ...player1, life: -5 };
        gameState.players.set('p1', newPlayer1);

        const creature1 = gameState.cardInstances.get('c1')!;
        const newCreature1 = { ...creature1, damageMarked: 3 };
        gameState.cardInstances.set('c1', newCreature1);

        const newState = sbaChecker.checkAndApplySBAs(gameState, cardDefinitions);

        expect(newState.players.get('p1')?.hasLost).toBe(true);
        expect(newState.cardInstances.get('c1')?.currentZoneId).toBe('p1-graveyard');
    });
});
