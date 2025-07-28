import { CLI } from '../../src/cli/cli';
import { Engine } from '../../src/core/engine';
import { GameStateDisplay } from '../../src/cli/game_state_display';
import { Phase, Step } from '../../src/core/rules/turn_manager';
import * as fs from 'fs';
import * as path from 'path';

// Mock external dependencies
jest.mock('fs');
jest.mock('readline');
jest.mock('../../src/cli/game_state_display');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CLI Automation Commands', () => {
    let cli: CLI;
    let mockEngine: jest.Mocked<Engine>;
    let mockDisplay: jest.Mocked<GameStateDisplay>;

    // Mock game state
    const createMockGameState = (turn: number = 1, phase: Phase = Phase.Beginning, step: Step = Step.Untap) => ({
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
        // Mock the display methods
        mockDisplay = {
            showGameState: jest.fn(),
            formatGameState: jest.fn().mockReturnValue('Mock game state'),
            showPhaseInfo: jest.fn(),
            showPlayerInfo: jest.fn(),
            showZoneContents: jest.fn()
        } as any;

        // Create CLI instance with mocked dependencies
        cli = new CLI({ enableHistory: false });

        // Replace internal components with mocks
        (cli as any).engine = {
            getState: jest.fn().mockReturnValue(createMockGameState()),
            submitAction: jest.fn(),
            startGame: jest.fn()
        };

        (cli as any).display = mockDisplay;
        (cli as any).gameStarted = true;

        mockEngine = (cli as any).engine;

        // Mock fs.existsSync to return true for deck files
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify([
            { id: 'forest', name: 'Forest', types: ['Land'], subtypes: ['Forest'] }
        ]));

        // Mock console methods
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'clear').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe('next-turn command', () => {
        it('should advance through all steps until next turn', async () => {
            // Setup: Start at turn 1, Beginning phase, Untap step
            let currentTurn = 1;
            const states = [
                createMockGameState(1, Phase.Beginning, Step.Untap),
                createMockGameState(1, Phase.Beginning, Step.Upkeep),
                createMockGameState(1, Phase.Beginning, Step.Draw),
                createMockGameState(1, Phase.PreCombatMain, Step.Untap),
                createMockGameState(1, Phase.Combat, Step.BeginCombat),
                createMockGameState(1, Phase.Combat, Step.DeclareAttackers),
                createMockGameState(1, Phase.PostCombatMain, Step.Untap),
                createMockGameState(1, Phase.Ending, Step.EndStep),
                createMockGameState(1, Phase.Ending, Step.Cleanup),
                createMockGameState(2, Phase.Beginning, Step.Untap) // Next turn
            ];

            let stateIndex = 0;
            mockEngine.getState.mockImplementation(() => {
                const state = states[Math.min(stateIndex, states.length - 1)];
                return state;
            });

            mockEngine.submitAction.mockImplementation(() => {
                stateIndex++;
            });

            await (cli as any).handleCommand('next-turn');

            // Should have called submitAction multiple times to advance
            expect(mockEngine.submitAction).toHaveBeenCalledWith('player1', { type: 'PASS_PRIORITY' });
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should stop at maximum action limit to prevent infinite loops', async () => {
            // Setup: Mock a state that never advances
            mockEngine.getState.mockReturnValue(createMockGameState(1, Phase.Beginning, Step.Untap));
            mockEngine.submitAction.mockImplementation(() => {
                // Do nothing - state doesn't change
            });

            await (cli as any).handleCommand('next-turn');

            // Should hit the limit and stop (each advanceOneStep calls submitAction once for automatic steps)
            expect(mockEngine.submitAction).toHaveBeenCalledTimes(100); // 100 steps * 1 call per step for automatic steps
        });
    });

    describe('to-main command', () => {
        it('should advance to PreCombatMain phase', async () => {
            const states = [
                createMockGameState(1, Phase.Beginning, Step.Untap),
                createMockGameState(1, Phase.Beginning, Step.Upkeep),
                createMockGameState(1, Phase.Beginning, Step.Draw),
                createMockGameState(1, Phase.PreCombatMain, Step.Untap)
            ];

            let stateIndex = 0;
            mockEngine.getState.mockImplementation(() => {
                const state = states[Math.min(stateIndex, states.length - 1)];
                return state;
            });

            mockEngine.submitAction.mockImplementation(() => {
                stateIndex++;
                return true;
            });

            await (cli as any).handleCommand('to-main');

            expect(mockEngine.submitAction).toHaveBeenCalled();
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should work when already in main phase', async () => {
            mockEngine.getState.mockReturnValue(createMockGameState(1, Phase.PreCombatMain, Step.Untap));

            await (cli as any).handleCommand('to-main');

            // Should not call submitAction if already in main phase
            expect(mockEngine.submitAction).not.toHaveBeenCalled();
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });

    describe('to-combat command', () => {
        it('should advance to Combat phase', async () => {
            const states = [
                createMockGameState(1, Phase.PreCombatMain, Step.Untap),
                createMockGameState(1, Phase.Combat, Step.BeginCombat)
            ];

            let stateIndex = 0;
            mockEngine.getState.mockImplementation(() => {
                const state = states[Math.min(stateIndex, states.length - 1)];
                return state;
            });

            mockEngine.submitAction.mockImplementation(() => {
                stateIndex++;
                return true;
            });

            await (cli as any).handleCommand('to-combat');

            expect(mockEngine.submitAction).toHaveBeenCalled();
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });

        it('should not advance if already in combat phase', async () => {
            mockEngine.getState.mockReturnValue(createMockGameState(1, Phase.Combat, Step.BeginCombat));

            await (cli as any).handleCommand('to-combat');

            expect(mockEngine.submitAction).not.toHaveBeenCalled();
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });

    describe('to-end command', () => {
        it('should advance to End step', async () => {
            const states = [
                createMockGameState(1, Phase.PostCombatMain, Step.Untap),
                createMockGameState(1, Phase.Ending, Step.EndStep)
            ];

            let stateIndex = 0;
            mockEngine.getState.mockImplementation(() => {
                const state = states[Math.min(stateIndex, states.length - 1)];
                return state;
            });

            mockEngine.submitAction.mockImplementation(() => {
                stateIndex++;
                return true;
            });

            await (cli as any).handleCommand('to-end');

            expect(mockEngine.submitAction).toHaveBeenCalled();
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });

    describe('to-cleanup command', () => {
        it('should advance to Cleanup step', async () => {
            const states = [
                createMockGameState(1, Phase.Ending, Step.EndStep),
                createMockGameState(1, Phase.Ending, Step.Cleanup)
            ];

            let stateIndex = 0;
            mockEngine.getState.mockImplementation(() => {
                const state = states[Math.min(stateIndex, states.length - 1)];
                return state;
            });

            mockEngine.submitAction.mockImplementation(() => {
                stateIndex++;
                return true;
            });

            await (cli as any).handleCommand('to-cleanup');

            expect(mockEngine.submitAction).toHaveBeenCalled();
            expect(mockDisplay.showGameState).toHaveBeenCalled();
        });
    });

    describe('automation command validation', () => {
        it('should require game to be started', async () => {
            (cli as any).gameStarted = false;

            await (cli as any).handleCommand('next-turn');

            expect(console.log).toHaveBeenCalledWith('No game started. Use "new-game" to start a new game.');
            expect(mockEngine.submitAction).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockEngine.submitAction.mockImplementation(() => {
                throw new Error('Test error');
            });

            // The error should be caught and handled by advanceOneStep returning false
            await (cli as any).handleCommand('next-turn');

            // Since advanceOneStep returns false immediately on error,
            // the automation should stop without showing an error message
            // For automatic steps like Untap, it calls ADVANCE_TURN directly
            expect(mockEngine.submitAction).toHaveBeenCalledWith('player1', { type: 'ADVANCE_TURN' });
        });
    });

    describe('advanceOneStep helper method', () => {
        it('should return true when state changes', async () => {
            const initialState = createMockGameState(1, Phase.Beginning, Step.Untap);
            const finalState = createMockGameState(1, Phase.Beginning, Step.Upkeep);

            // Mock the sequence for automatic step: initial -> final
            mockEngine.getState
                .mockReturnValueOnce(initialState)      // Initial state capture
                .mockReturnValueOnce(finalState)        // Final state check
                .mockReturnValue(finalState);           // Any additional calls

            const result = await (cli as any).advanceOneStep();

            expect(result).toBe(true);
            // For Untap step (automatic), should only call ADVANCE_TURN once
            expect(mockEngine.submitAction).toHaveBeenCalledTimes(1);
            expect(mockEngine.submitAction).toHaveBeenNthCalledWith(1, 'player1', { type: 'ADVANCE_TURN' });
        });

        it('should return true when state changes for priority steps', async () => {
            const initialState = createMockGameState(1, Phase.Beginning, Step.Upkeep);
            const finalState = createMockGameState(1, Phase.Beginning, Step.Draw);

            // Mock the sequence for a successful advancement
            mockEngine.getState
                .mockReturnValueOnce(initialState)      // Initial state capture
                .mockReturnValueOnce(initialState)      // First loop check
                .mockReturnValueOnce(initialState)      // After first pass, state doesn't change yet
                .mockReturnValueOnce(initialState)      // State check
                .mockReturnValueOnce(initialState)      // After second pass, still no change
                .mockReturnValueOnce(initialState)      // State check
                .mockReturnValueOnce(finalState)        // Final state check - now different
                .mockReturnValue(finalState);           // Any additional calls

            const result = await (cli as any).advanceOneStep();

            expect(result).toBe(true);
            // The exact number of calls depends on the implementation, just verify it worked
            expect(mockEngine.submitAction).toHaveBeenCalled();
            expect(mockEngine.submitAction).toHaveBeenCalledWith('player1', { type: 'PASS_PRIORITY' });
        });

        it('should return false when state does not change', async () => {
            const sameState = createMockGameState(1, Phase.Beginning, Step.Untap);

            mockEngine.getState.mockReturnValue(sameState);

            const result = await (cli as any).advanceOneStep();

            expect(result).toBe(false);
        });

        it('should return false when submitAction throws error', async () => {
            mockEngine.submitAction.mockImplementation(() => {
                throw new Error('Cannot advance');
            });

            const result = await (cli as any).advanceOneStep();

            expect(result).toBe(false);
        });
    });

    describe('isInMainPhase helper method', () => {
        it('should return true for PreCombatMain phase', () => {
            mockEngine.getState.mockReturnValue(createMockGameState(1, Phase.PreCombatMain, Step.Untap));

            const result = (cli as any).isInMainPhase();

            expect(result).toBe(true);
        });

        it('should return true for PostCombatMain phase', () => {
            mockEngine.getState.mockReturnValue(createMockGameState(1, Phase.PostCombatMain, Step.Untap));

            const result = (cli as any).isInMainPhase();

            expect(result).toBe(true);
        });

        it('should return false for other phases', () => {
            mockEngine.getState.mockReturnValue(createMockGameState(1, Phase.Combat, Step.BeginCombat));

            const result = (cli as any).isInMainPhase();

            expect(result).toBe(false);
        });
    });

    describe('isAutomaticStep helper method', () => {
        it('should return true for Untap step', () => {
            const gameState = createMockGameState(1, Phase.Beginning, Step.Untap);

            const result = (cli as any).isAutomaticStep(gameState);

            expect(result).toBe(true);
        });

        it('should return true for Cleanup step', () => {
            const gameState = createMockGameState(1, Phase.Ending, Step.Cleanup);

            const result = (cli as any).isAutomaticStep(gameState);

            expect(result).toBe(true);
        });

        it('should return false for Upkeep step', () => {
            const gameState = createMockGameState(1, Phase.Beginning, Step.Upkeep);

            const result = (cli as any).isAutomaticStep(gameState);

            expect(result).toBe(false);
        });

        it('should return false for Draw step', () => {
            const gameState = createMockGameState(1, Phase.Beginning, Step.Draw);

            const result = (cli as any).isAutomaticStep(gameState);

            expect(result).toBe(false);
        });

        it('should return false for main phases', () => {
            const gameState = createMockGameState(1, Phase.PreCombatMain, Step.Upkeep);

            const result = (cli as any).isAutomaticStep(gameState);

            expect(result).toBe(false);
        });
    });
});
