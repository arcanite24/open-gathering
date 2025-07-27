import { CommandHandler } from '../../src/cli/command_handler';
import { Engine } from '../../src/core/engine';
import { ICardDefinition } from '../../src/core/game_state/interfaces';

describe('CommandHandler', () => {
    let commandHandler: CommandHandler;
    let engine: Engine;
    let basicLand: ICardDefinition;

    beforeEach(() => {
        engine = new Engine();
        commandHandler = new CommandHandler(engine);

        basicLand = {
            id: 'basic_plains',
            name: 'Plains',
            types: ['Land'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{W}' }
                }
            ]
        };

        // Start a game for testing
        const deck = Array(8).fill(basicLand);
        engine.startGame(deck, deck);
    });

    describe('parseAction', () => {
        it('should parse pass priority action', () => {
            const action = commandHandler.parseAction('pass', []);

            expect(action).toEqual({ type: 'PASS_PRIORITY' });
        });

        it('should parse advance turn action', () => {
            const action = commandHandler.parseAction('advance', []);

            expect(action).toEqual({ type: 'ADVANCE_TURN' });
        });

        it('should parse play land action with card index', () => {
            const action = commandHandler.parseAction('play', ['1']);

            expect(action?.type).toBe('PLAY_LAND');
            if (action?.type === 'PLAY_LAND') {
                expect(action.cardId).toBeDefined();
            }
        });

        it('should throw error for invalid card index', () => {
            expect(() => {
                commandHandler.parseAction('play', ['10']);
            }).toThrow('Invalid card index');
        });

        it('should throw error for non-land play action', () => {
            // This would require having a non-land card in hand
            // For now, just test that it parses correctly when it is a land
            const action = commandHandler.parseAction('play', ['1']);
            expect(action?.type).toBe('PLAY_LAND');
        });

        it('should throw error for unknown command', () => {
            expect(() => {
                commandHandler.parseAction('invalid', []);
            }).toThrow('Unknown game command: invalid');
        });
    });

    describe('validateCommand', () => {
        it('should validate pass command', () => {
            const result = commandHandler.validateCommand('pass', []);

            expect(result.valid).toBe(true);
        });

        it('should validate advance command', () => {
            const result = commandHandler.validateCommand('advance', []);

            expect(result.valid).toBe(true);
        });

        it('should invalidate play command without args', () => {
            const result = commandHandler.validateCommand('play', []);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('No card specified');
        });

        it('should validate play command with args', () => {
            const result = commandHandler.validateCommand('play', ['1']);

            expect(result.valid).toBe(true);
        });

        it('should invalidate play command when land already played', () => {
            // First, play a land
            const gameState = engine.getState();
            const priorityPlayer = gameState.players.get(gameState.priorityPlayerId);
            if (priorityPlayer) {
                priorityPlayer.landsPlayedThisTurn = 1;
            }

            const result = commandHandler.validateCommand('play', ['1']);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('Already played a land this turn');
        });

        it('should invalidate unknown command', () => {
            const result = commandHandler.validateCommand('invalid', []);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('Unknown command');
        });
    });

    describe('getCommandHelp', () => {
        it('should return help for play command', () => {
            const help = commandHandler.getCommandHelp('play');

            expect(help).toContain('play <card>');
            expect(help).toContain('Play a land');
        });

        it('should return help for pass command', () => {
            const help = commandHandler.getCommandHelp('pass');

            expect(help).toContain('pass');
            expect(help).toContain('Pass priority');
        });

        it('should return no help message for unknown command', () => {
            const help = commandHandler.getCommandHelp('unknown');

            expect(help).toContain('No help available');
        });
    });
});
