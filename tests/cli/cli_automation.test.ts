import { CLI } from '../../src/cli/cli';
import { GameStateDisplay } from '../../src/cli/game_state_display';
import { IGameState } from '../../src/core/game_state/interfaces';
import { Phase, Step } from '../../src/core/rules/turn_manager';

// Mock external dependencies
jest.mock('fs');
jest.mock('readline');
jest.mock('../../src/cli/game_state_display');

// Mock the apiRequest method
const mockApiRequest = jest.fn();
CLI.prototype['apiRequest'] = mockApiRequest;

describe('CLI Automation Commands', () => {
    let cli: CLI;
    let mockDisplay: jest.Mocked<GameStateDisplay>;
    let mockGameState: IGameState;

    const createMockGameState = (turn: number = 1, phase: Phase = Phase.Beginning, step: Step = Step.Untap): IGameState => ({
        players: new Map([
            ['player1', { id: 'player1', life: 20, manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 }, handZoneId: 'hand1', libraryZoneId: 'lib1', graveyardZoneId: 'grave1', exileZoneId: 'exile1', battlefieldZoneId: 'battlefield1', landsPlayedThisTurn: 0, hasLost: false }],
            ['player2', { id: 'player2', life: 20, manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 }, handZoneId: 'hand2', libraryZoneId: 'lib2', graveyardZoneId: 'grave2', exileZoneId: 'exile2', battlefieldZoneId: 'battlefield2', landsPlayedThisTurn: 0, hasLost: false }]
        ]),
        zones: new Map(),
        cardInstances: new Map(),
        cardDefinitions: new Map(),
        abilityRegistry: {} as any,
        activePlayerId: 'player1',
        priorityPlayerId: 'player1',
        turn,
        phase,
        step,
        stackZoneId: 'stack'
    });

    beforeEach(() => {
        mockDisplay = new GameStateDisplay() as jest.Mocked<GameStateDisplay>;
        cli = new CLI({ enableHistory: false });
        (cli as any).display = mockDisplay;
        (cli as any).gameId = 'game1';
        mockGameState = createMockGameState();
        (cli as any).gameState = mockGameState;

        mockApiRequest.mockClear();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('next-turn command', () => {
        it('should advance through steps until next turn', async () => {
            let turn = 1;
            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_TURN') {
                    turn = 2;
                }
                return { gameState: { ...mockGameState, turn } };
            });

            await (cli as any).handleCommand('next-turn');

            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'PASS_PRIORITY' }
            }));
            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'ADVANCE_TURN' }
            }));
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });
});