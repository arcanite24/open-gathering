import { GameStateDisplay } from '../../src/cli/game_state_display';
import { IGameState, IPlayer, IZone, ICardDefinition, ICardInstance } from '../../src/core/game_state/interfaces';
import { AbilityRegistry, initializeAbilityRegistry } from '../../src/core/abilities/registry';

describe('GameStateDisplay', () => {
    let display: GameStateDisplay;
    let mockGameState: IGameState;
    let mockPlayer1: IPlayer;
    let mockPlayer2: IPlayer;

    beforeEach(() => {
        display = new GameStateDisplay();

        // Create mock players
        mockPlayer1 = {
            id: 'player1',
            life: 20,
            manaPool: { W: 2, U: 0, B: 0, R: 1, G: 0, C: 0, generic: 0 },
            handZoneId: 'hand1',
            libraryZoneId: 'library1',
            graveyardZoneId: 'graveyard1',
            exileZoneId: 'exile1',
            battlefieldZoneId: 'battlefield1',
            landsPlayedThisTurn: 1,
            hasLost: false
        };

        mockPlayer2 = {
            id: 'player2',
            life: 18,
            manaPool: { W: 0, U: 1, B: 0, R: 0, G: 1, C: 0, generic: 0 },
            handZoneId: 'hand2',
            libraryZoneId: 'library2',
            graveyardZoneId: 'graveyard2',
            exileZoneId: 'exile2',
            battlefieldZoneId: 'battlefield2',
            landsPlayedThisTurn: 0,
            hasLost: false
        };

        // Create mock zones
        const zones = new Map<string, IZone>();
        zones.set('hand1', { id: 'hand1', name: 'Hand', cards: ['card1', 'card2'], ownerPlayerId: 'player1' });
        zones.set('hand2', { id: 'hand2', name: 'Hand', cards: ['card3'], ownerPlayerId: 'player2' });
        zones.set('battlefield1', { id: 'battlefield1', name: 'Battlefield', cards: ['card4'], ownerPlayerId: 'player1' });
        zones.set('battlefield2', { id: 'battlefield2', name: 'Battlefield', cards: [], ownerPlayerId: 'player2' });
        zones.set('library1', { id: 'library1', name: 'Library', cards: ['card5', 'card6'], ownerPlayerId: 'player1' });
        zones.set('library2', { id: 'library2', name: 'Library', cards: ['card7'], ownerPlayerId: 'player2' });
        zones.set('graveyard1', { id: 'graveyard1', name: 'Graveyard', cards: [], ownerPlayerId: 'player1' });
        zones.set('graveyard2', { id: 'graveyard2', name: 'Graveyard', cards: ['card8'], ownerPlayerId: 'player2' });
        zones.set('stack', { id: 'stack', name: 'Stack', cards: [], ownerPlayerId: 'game' });

        // Create mock card definitions
        const cardDef1: ICardDefinition = {
            id: 'plains',
            name: 'Plains',
            types: ['Land'],
            abilities: []
        };

        const cardDef2: ICardDefinition = {
            id: 'bear',
            name: 'Grizzly Bears',
            types: ['Creature'],
            subtypes: ['Bear'],
            power: '2',
            toughness: '2',
            manaCost: '{1}{G}',
            cmc: 2
        };

        // Create mock card instances
        const cardInstances = new Map<string, ICardInstance>();

        cardInstances.set('card1', {
            id: 'card1',
            definition: cardDef1,
            definitionId: 'plains',
            ownerPlayerId: 'player1',
            controllerPlayerId: 'player1',
            currentZoneId: 'hand1',
            isTapped: false,
            damageMarked: 0,
            counters: new Map(),
            staticAbilities: [],
            triggeredAbilities: [],
            activatedAbilities: []
        });

        cardInstances.set('card4', {
            id: 'card4',
            definition: cardDef2,
            definitionId: 'bear',
            ownerPlayerId: 'player1',
            controllerPlayerId: 'player1',
            currentZoneId: 'battlefield1',
            isTapped: true,
            damageMarked: 1,
            counters: new Map(),
            staticAbilities: [],
            triggeredAbilities: [],
            activatedAbilities: [],
            isAttacking: false,
            isBlocking: false
        });

        // Create mock game state
        mockGameState = {
            players: new Map([
                ['player1', mockPlayer1],
                ['player2', mockPlayer2]
            ]),
            zones,
            cardInstances,
            cardDefinitions: new Map([
                ['plains', cardDef1],
                ['bear', cardDef2]
            ]),
            activePlayerId: 'player1',
            priorityPlayerId: 'player2',
            turn: 3,
            phase: 'Main',
            step: 'PreCombatMain',
            stackZoneId: 'stack',
            abilityRegistry: initializeAbilityRegistry()
        };
    });

    describe('showGameState', () => {
        it('should display game state without errors', () => {
            // Mock console.log to capture output
            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            display.showGameState(mockGameState);

            expect(logSpy).toHaveBeenCalled();

            // Check that basic information is displayed
            const output = logSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('TURN 3');
            expect(output).toContain('Main Phase');
            expect(output).toContain('PLAYER1');
            expect(output).toContain('PLAYER2');
            expect(output).toContain('Life: 20');
            expect(output).toContain('Life: 18');

            logSpy.mockRestore();
        });

        it('should show mana pool when player has mana', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            display.showGameState(mockGameState);

            const output = logSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Mana Pool');

            logSpy.mockRestore();
        });

        it('should show battlefield cards with status', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            display.showGameState(mockGameState);

            const output = logSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Grizzly Bears');
            expect(output).toContain('TAPPED');
            expect(output).toContain('1 DMG');

            logSpy.mockRestore();
        });
    });

    describe('showCompactState', () => {
        it('should display compact state information', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            display.showCompactState(mockGameState);

            expect(logSpy).toHaveBeenCalled();

            const output = logSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Turn 3');
            expect(output).toContain('player1: 20 life');
            expect(output).toContain('player2: 18 life');

            logSpy.mockRestore();
        });
    });

    describe('showAvailableActions', () => {
        it('should show available actions for priority player', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            display.showAvailableActions(mockGameState);

            expect(logSpy).toHaveBeenCalled();

            const output = logSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Available actions for player2');
            expect(output).toContain('pass');

            logSpy.mockRestore();
        });

        it('should show play land action when available', () => {
            // Modify game state so priority player hasn't played a land
            mockGameState.priorityPlayerId = 'player1';
            mockPlayer1.landsPlayedThisTurn = 0;

            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            display.showAvailableActions(mockGameState);

            const output = logSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('play <card_index>');

            logSpy.mockRestore();
        });
    });
});
