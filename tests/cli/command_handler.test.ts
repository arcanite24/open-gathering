import { CommandHandler } from '../../src/cli/command_handler';
import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../../src/core/game_state/interfaces';
import { Action } from '../../src/core/game_state/interfaces';

describe('CommandHandler', () => {
    let commandHandler: CommandHandler;
    let mockGameState: IGameState;
    let player1: IPlayer;
    let handZone: IZone;
    let cardInHand: ICardInstance;

    beforeEach(() => {
        commandHandler = new CommandHandler();

        cardInHand = {
            id: 'card1',
            definitionId: 'def1',
            definition: { id: 'def1', name: 'Plains', types: ['Land'] } as ICardDefinition,
            ownerPlayerId: 'player1',
            controllerPlayerId: 'player1',
            currentZoneId: 'hand1',
            isTapped: false,
            damageMarked: 0,
            counters: new Map(),
            staticAbilities: [],
            triggeredAbilities: [],
            activatedAbilities: [],
        };

        handZone = {
            id: 'hand1',
            name: 'Hand',
            ownerPlayerId: 'player1',
            cards: ['card1'],
        };

        player1 = {
            id: 'player1',
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
            handZoneId: 'hand1',
            libraryZoneId: 'lib1',
            graveyardZoneId: 'grave1',
            exileZoneId: 'exile1',
            battlefieldZoneId: 'battlefield1',
            landsPlayedThisTurn: 0,
            hasLost: false,
        };

        mockGameState = {
            players: new Map([['player1', player1]]),
            zones: new Map([['hand1', handZone]]),
            cardInstances: new Map([['card1', cardInHand]]),
            cardDefinitions: new Map(),
            activePlayerId: 'player1',
            priorityPlayerId: 'player1',
            turn: 1,
            phase: 'Main',
            step: 'Pre-Combat Main',
            stackZoneId: 'stack',
            abilityRegistry: {} as any,
        };
    });

    describe('parseAction', () => {
        it('should parse pass priority action', () => {
            const action = commandHandler.parseAction('pass', [], mockGameState);
            expect(action).toEqual({ type: 'PASS_PRIORITY' });
        });

        it('should parse advance turn action', () => {
            const action = commandHandler.parseAction('advance', [], mockGameState);
            expect(action).toEqual({ type: 'ADVANCE_TURN' });
        });

        it('should parse play land action with card index', () => {
            const action = commandHandler.parseAction('play', ['1'], mockGameState);
            expect(action?.type).toBe('PLAY_LAND');
            if (action?.type === 'PLAY_LAND') {
                expect(action.cardId).toBe('card1');
            }
        });

        it('should throw error for invalid card index', () => {
            expect(() => {
                commandHandler.parseAction('play', ['10'], mockGameState);
            }).toThrow('Invalid card number');
        });

        it('should throw error for non-land play action', () => {
            const nonLandCard = { ...cardInHand, id: 'card2', definition: { ...cardInHand.definition, id: 'def2', name: 'Creature', types: ['Creature'] } };
            mockGameState.cardInstances.set('card2', nonLandCard);
            mockGameState.zones.get('hand1')!.cards.push('card2');
            expect(() => {
                commandHandler.parseAction('play', ['2'], mockGameState);
            }).toThrow('Cannot play Creature - only lands can be played with the play command');
        });

        it('should throw error for unknown command', () => {
            expect(() => {
                commandHandler.parseAction('invalid', [], mockGameState);
            }).toThrow('Unknown game command: invalid');
        });
    });
});