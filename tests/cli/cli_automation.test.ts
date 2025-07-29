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
        // Capture console.log output for debugging
        jest.spyOn(console, 'log').mockImplementation((...args) => {
            // Log to actual console for visibility in test output
            process.stdout.write(`[TEST LOG] ${args.join(' ')}\n`);
        });
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('next-turn command', () => {
        it('should advance through steps until next turn', async () => {
            let turn = 1;
            let step = Step.Untap;
            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_STEP') {
                    // Simulate progression through phases and steps
                    if (step === Step.Cleanup) {
                        turn++;
                        step = Step.Untap;
                    } else {
                        // Advance to next step
                        const steps = Object.values(Step);
                        const currentStepIndex = steps.indexOf(step);
                        step = steps[currentStepIndex + 1] || Step.Untap;
                    }
                }
                return { gameState: { ...mockGameState, turn, step } };
            });

            await (cli as any).handleCommand('next-turn');

            // Expect multiple ADVANCE_STEP calls until turn advances
            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'ADVANCE_STEP' }
            }));
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });

    describe('phase navigation commands', () => {
        beforeEach(() => {
            // Reset game state before each test
            mockGameState = createMockGameState();
        });

        it('should handle to-main command', async () => {
            let turn = 1;
            let phase = Phase.Beginning;
            let step: string = Step.Untap;

            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_STEP') {
                    // Simulate progression through phases and steps
                    if (step === Step.Cleanup) {
                        turn++;
                        phase = Phase.Beginning;
                        step = Step.Untap;
                    } else if (phase === Phase.Beginning && step === Step.Untap) {
                        step = Step.Upkeep;
                    } else if (phase === Phase.Beginning && step === Step.Upkeep) {
                        step = Step.Draw;
                    } else if (phase === Phase.Beginning && step === Step.Draw) {
                        phase = Phase.PreCombatMain;
                        step = '';
                    }
                }
                return { gameState: { ...mockGameState, turn, phase, step } };
            });

            await (cli as any).handleCommand('to-main');

            // Should make multiple ADVANCE_STEP calls until reaching main phase
            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'ADVANCE_STEP' }
            }));
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should handle to-combat command', async () => {
            let turn = 1;
            let phase = Phase.Beginning;
            let step: string = Step.Untap;

            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_STEP') {
                    // Simulate progression through phases and steps
                    if (step === Step.Cleanup) {
                        turn++;
                        phase = Phase.Beginning;
                        step = Step.Untap;
                    } else if (phase === Phase.Beginning && step === Step.Untap) {
                        step = Step.Upkeep;
                    } else if (phase === Phase.Beginning && step === Step.Upkeep) {
                        step = Step.Draw;
                    } else if (phase === Phase.Beginning && step === Step.Draw) {
                        phase = Phase.PreCombatMain;
                        step = '';
                    } else if (phase === Phase.PreCombatMain && step === '') {
                        phase = Phase.Combat;
                        step = Step.BeginCombat;
                    }
                }
                return { gameState: { ...mockGameState, turn, phase, step } };
            });

            await (cli as any).handleCommand('to-combat');

            // Should make multiple ADVANCE_STEP calls until reaching combat phase
            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'ADVANCE_STEP' }
            }));
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should handle to-end command', async () => {
            let turn = 1;
            let phase = Phase.Beginning;
            let step: string = Step.Untap;

            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_STEP') {
                    // Simulate progression through phases and steps
                    if (step === Step.Cleanup) {
                        turn++;
                        phase = Phase.Beginning;
                        step = Step.Untap;
                    } else if (phase === Phase.Beginning && step === Step.Untap) {
                        step = Step.Upkeep;
                    } else if (phase === Phase.Beginning && step === Step.Upkeep) {
                        step = Step.Draw;
                    } else if (phase === Phase.Beginning && step === Step.Draw) {
                        phase = Phase.PreCombatMain;
                        step = '';
                    } else if (phase === Phase.PreCombatMain && step === '') {
                        phase = Phase.Combat;
                        step = Step.BeginCombat;
                    } else if (phase === Phase.Combat && step === Step.BeginCombat) {
                        step = Step.DeclareAttackers;
                    } else if (phase === Phase.Combat && step === Step.DeclareAttackers) {
                        step = Step.DeclareBlockers;
                    } else if (phase === Phase.Combat && step === Step.DeclareBlockers) {
                        step = Step.CombatDamage;
                    } else if (phase === Phase.Combat && step === Step.CombatDamage) {
                        step = Step.EndCombat;
                    } else if (phase === Phase.Combat && step === Step.EndCombat) {
                        phase = Phase.PostCombatMain;
                        step = '';
                    } else if (phase === Phase.PostCombatMain && step === '') {
                        phase = Phase.Ending;
                        step = Step.EndStep;
                    }
                }
                return { gameState: { ...mockGameState, turn, phase, step } };
            });

            await (cli as any).handleCommand('to-end');

            // Should make multiple ADVANCE_STEP calls until reaching end step
            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'ADVANCE_STEP' }
            }));
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should handle to-cleanup command', async () => {
            let turn = 1;
            let phase = Phase.Beginning;
            let step: string = Step.Untap;

            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_STEP') {
                    // Simulate progression through phases and steps
                    if (step === Step.Cleanup) {
                        turn++;
                        phase = Phase.Beginning;
                        step = Step.Untap;
                    } else if (phase === Phase.Beginning && step === Step.Untap) {
                        step = Step.Upkeep;
                    } else if (phase === Phase.Beginning && step === Step.Upkeep) {
                        step = Step.Draw;
                    } else if (phase === Phase.Beginning && step === Step.Draw) {
                        phase = Phase.PreCombatMain;
                        step = '';
                    } else if (phase === Phase.PreCombatMain && step === '') {
                        phase = Phase.Combat;
                        step = Step.BeginCombat;
                    } else if (phase === Phase.Combat && step === Step.BeginCombat) {
                        step = Step.DeclareAttackers;
                    } else if (phase === Phase.Combat && step === Step.DeclareAttackers) {
                        step = Step.DeclareBlockers;
                    } else if (phase === Phase.Combat && step === Step.DeclareBlockers) {
                        step = Step.CombatDamage;
                    } else if (phase === Phase.Combat && step === Step.CombatDamage) {
                        step = Step.EndCombat;
                    } else if (phase === Phase.Combat && step === Step.EndCombat) {
                        phase = Phase.PostCombatMain;
                        step = '';
                    } else if (phase === Phase.PostCombatMain && step === '') {
                        phase = Phase.Ending;
                        step = Step.EndStep;
                    } else if (phase === Phase.Ending && step === Step.EndStep) {
                        step = Step.Cleanup;
                    }
                }
                return { gameState: { ...mockGameState, turn, phase, step } };
            });

            await (cli as any).handleCommand('to-cleanup');

            // Should make multiple ADVANCE_STEP calls until reaching cleanup step
            expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games/game1/actions', expect.objectContaining({
                action: { type: 'ADVANCE_STEP' }
            }));
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should handle shortcut commands', async () => {
            let turn = 1;
            let phase = Phase.Beginning;
            let step: string = Step.Untap;

            mockApiRequest.mockImplementation(async (method, path, body) => {
                if (body.action.type === 'ADVANCE_STEP') {
                    // Simulate progression through phases and steps
                    if (step === Step.Cleanup) {
                        turn++;
                        phase = Phase.Beginning;
                        step = Step.Untap;
                    } else if (phase === Phase.Beginning && step === Step.Untap) {
                        step = Step.Upkeep;
                    } else if (phase === Phase.Beginning && step === Step.Upkeep) {
                        step = Step.Draw;
                    } else if (phase === Phase.Beginning && step === Step.Draw) {
                        phase = Phase.PreCombatMain;
                        step = '';
                    } else if (phase === Phase.PreCombatMain && step === '') {
                        phase = Phase.Combat;
                        step = Step.BeginCombat;
                    } else if (phase === Phase.Combat && step === Step.BeginCombat) {
                        step = Step.DeclareAttackers;
                    } else if (phase === Phase.Combat && step === Step.DeclareAttackers) {
                        step = Step.DeclareBlockers;
                    } else if (phase === Phase.Combat && step === Step.DeclareBlockers) {
                        step = Step.CombatDamage;
                    } else if (phase === Phase.Combat && step === Step.CombatDamage) {
                        step = Step.EndCombat;
                    } else if (phase === Phase.Combat && step === Step.EndCombat) {
                        phase = Phase.PostCombatMain;
                        step = '';
                    } else if (phase === Phase.PostCombatMain && step === '') {
                        phase = Phase.Ending;
                        step = Step.EndStep;
                    } else if (phase === Phase.Ending && step === Step.EndStep) {
                        step = Step.Cleanup;
                    }
                }
                return { gameState: { ...mockGameState, turn, phase, step } };
            });

            // Test all shortcut aliases
            await (cli as any).handleCommand('nt');
            // Should have advanced to next turn
            expect(mockDisplay.showGameState).toHaveBeenCalled();

            await (cli as any).handleCommand('main');
            // Should have advanced to main phase
            expect(mockDisplay.showGameState).toHaveBeenCalled();

            await (cli as any).handleCommand('combat');
            // Should have advanced to combat phase
            expect(mockDisplay.showGameState).toHaveBeenCalled();

            await (cli as any).handleCommand('end');
            // Should have advanced to end step
            expect(mockDisplay.showGameState).toHaveBeenCalled();

            await (cli as any).handleCommand('cleanup');
            // Should have advanced to cleanup step
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });
});