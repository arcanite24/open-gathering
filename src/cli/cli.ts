import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { Engine, Action } from '../core/engine';
import { IGameState, ICardDefinition, IPlayer, IZone, ICardInstance } from '../core/game_state/interfaces';
import { GameStateDisplay } from './game_state_display';
import { CommandHandler } from './command_handler';
import { allScenarios, getScenario, Scenario } from './scenarios/scenarios';

export interface CLIOptions {
    enableHistory?: boolean;
    historyFile?: string;
    enableAutocomplete?: boolean;
}

export class CLI {
    private engine: Engine;
    private rl: readline.Interface;
    private display: GameStateDisplay;
    private commandHandler: CommandHandler;
    private options: CLIOptions;
    private commandHistory: string[] = [];
    private gameStarted: boolean = false;

    constructor(options: CLIOptions = {}) {
        this.engine = new Engine();
        this.display = new GameStateDisplay();
        this.commandHandler = new CommandHandler(this.engine);
        this.options = {
            enableHistory: true,
            historyFile: '.mtg-cli-history',
            enableAutocomplete: true,
            ...options
        };

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: this.options.enableAutocomplete ? this.completer.bind(this) : undefined,
            history: []
        });

        this.loadHistory();
    }

    /**
     * Start the interactive CLI session
     */
    async start(): Promise<void> {
        console.log('='.repeat(60));
        console.log('    Magic: The Gathering Engine CLI');
        console.log('='.repeat(60));
        console.log();

        if (!this.gameStarted) {
            console.log('No game loaded. Use "new-game" to start a new game or "load <file>" to load a saved game.');
            console.log('Type "help" for available commands or "quit" to exit.');
        } else {
            console.log('Game loaded successfully!');
            this.display.showGameState(this.engine.getState());
        }

        console.log();
        await this.commandLoop();
    }

    /**
     * Start a new game with specified decks
     */
    async newGame(player1DeckName: string = 'basic', player2DeckName: string = 'basic'): Promise<void> {
        try {
            const player1Deck = await this.loadDeck(player1DeckName);
            const player2Deck = await this.loadDeck(player2DeckName);

            this.engine.startGame(player1Deck, player2Deck);
            this.gameStarted = true;

            console.log(`Started new game with decks: ${player1DeckName} vs ${player2DeckName}`);
        } catch (error) {
            console.error('Failed to start new game:', (error as Error).message);
        }
    }

    /**
     * Load a saved game state
     */
    async loadGame(filename: string): Promise<void> {
        try {
            const fullPath = path.resolve(filename);
            if (!fs.existsSync(fullPath)) {
                throw new Error(`File not found: ${fullPath}`);
            }

            const savedState = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            // Note: In a full implementation, we'd need to reconstruct the engine state
            // For now, this is a placeholder
            console.log(`Game loaded from ${filename}`);
            this.gameStarted = true;
        } catch (error) {
            console.error('Failed to load game:', (error as Error).message);
        }
    }

    /**
     * Load a predefined scenario
     */
    async loadScenario(scenarioName: string): Promise<void> {
        try {
            const scenario = getScenario(scenarioName);
            if (!scenario) {
                console.log(`Scenario not found: ${scenarioName}`);
                console.log('Available scenarios:');
                this.listScenarios();
                return;
            }

            this.engine.startGame(scenario.player1Deck, scenario.player2Deck);
            this.gameStarted = true;

            console.log(`Loaded scenario: ${scenario.name}`);
            console.log(`Description: ${scenario.description}`);

            // Execute initial actions if provided
            if (scenario.initialActions && scenario.initialActions.length > 0) {
                console.log('Executing initial actions...');
                for (const actionStr of scenario.initialActions) {
                    try {
                        await this.handleCommand(actionStr);
                    } catch (error) {
                        console.error(`Failed to execute initial action "${actionStr}":`, (error as Error).message);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load scenario:', (error as Error).message);
        }
    }

    /**
     * List all available scenarios
     */
    listScenarios(): void {
        console.log('Available scenarios:');
        console.log();
        allScenarios.forEach((scenario, index) => {
            console.log(`  ${index + 1}. ${scenario.name}`);
            console.log(`     ${scenario.description}`);
            console.log();
        });
    }
    /**
     * Save the current game state
     */
    async saveGame(filename: string): Promise<void> {
        if (!this.gameStarted) {
            console.log('No game to save. Start a new game first.');
            return;
        }

        try {
            const gameState = this.engine.getState();
            const saveData = {
                gameState: this.serializeGameState(gameState),
                timestamp: new Date().toISOString()
            };

            fs.writeFileSync(filename, JSON.stringify(saveData, null, 2));
            console.log(`Game saved to ${filename}`);
        } catch (error) {
            console.error('Failed to save game:', (error as Error).message);
        }
    }

    /**
     * Main command loop
     */
    private async commandLoop(): Promise<void> {
        return new Promise((resolve) => {
            const askCommand = () => {
                this.rl.question('> ', async (input) => {
                    const trimmedInput = input.trim();

                    if (trimmedInput === '') {
                        askCommand();
                        return;
                    }

                    this.addToHistory(trimmedInput);

                    if (trimmedInput === 'quit' || trimmedInput === 'exit') {
                        this.saveHistory();
                        this.rl.close();
                        resolve();
                        return;
                    }

                    try {
                        await this.handleCommand(trimmedInput);
                    } catch (error) {
                        console.error('Error:', (error as Error).message);
                    }

                    askCommand();
                });
            };

            askCommand();
        });
    }

    /**
     * Handle a command input
     */
    private async handleCommand(input: string): Promise<void> {
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
            case 'help':
                this.showHelp();
                break;

            case 'state':
            case 'show':
                if (this.gameStarted) {
                    this.display.showGameState(this.engine.getState());
                } else {
                    console.log('No game started. Use "new-game" to start a new game.');
                }
                break;

            case 'new-game':
                await this.newGame(args[0], args[1]);
                if (this.gameStarted) {
                    this.display.showGameState(this.engine.getState());
                }
                break;

            case 'load':
                if (args.length === 0) {
                    console.log('Usage: load <filename>');
                    break;
                }
                await this.loadGame(args[0]);
                if (this.gameStarted) {
                    this.display.showGameState(this.engine.getState());
                }
                break;

            case 'scenario':
                if (args.length === 0) {
                    this.listScenarios();
                    break;
                }
                await this.loadScenario(args[0]);
                if (this.gameStarted) {
                    this.display.showGameState(this.engine.getState());
                }
                break;

            case 'save':
                if (args.length === 0) {
                    console.log('Usage: save <filename>');
                    break;
                }
                await this.saveGame(args[0]);
                break;

            case 'play':
            case 'cast':
            case 'activate':
            case 'pass':
            case 'advance':
                if (!this.gameStarted) {
                    console.log('No game started. Use "new-game" to start a new game.');
                    break;
                }
                await this.handleGameAction(command, args);
                break;

            case 'clear':
                console.clear();
                break;

            case 'history':
                this.showHistory();
                break;

            default:
                console.log(`Unknown command: ${command}. Type "help" for available commands.`);
        }
    }

    /**
     * Handle game actions
     */
    private async handleGameAction(command: string, args: string[]): Promise<void> {
        try {
            const action = this.commandHandler.parseAction(command, args);
            if (action) {
                const playerId = this.engine.getState().priorityPlayerId;
                this.engine.submitAction(playerId, action);
                console.log(`Action executed: ${command} ${args.join(' ')}`);
                this.display.showGameState(this.engine.getState());
            }
        } catch (error) {
            console.error('Failed to execute action:', (error as Error).message);
        }
    }

    /**
     * Show help information
     */
    private showHelp(): void {
        console.log('Available commands:');
        console.log();
        console.log('Game Management:');
        console.log('  new-game [deck1] [deck2]  - Start a new game with specified decks (default: basic)');
        console.log('  scenario [name]           - Load a predefined scenario or list available scenarios');
        console.log('  load <filename>           - Load a saved game state');
        console.log('  save <filename>           - Save the current game state');
        console.log();
        console.log('Game State:');
        console.log('  state, show               - Display the current game state');
        console.log('  clear                     - Clear the screen');
        console.log();
        console.log('Game Actions:');
        console.log('  play <card>               - Play a land from hand');
        console.log('  cast <card> [targets...]  - Cast a spell');
        console.log('  activate <card> <ability> - Activate an ability');
        console.log('  pass                      - Pass priority');
        console.log('  advance                   - Advance to next turn/phase');
        console.log();
        console.log('Utility:');
        console.log('  history                   - Show command history');
        console.log('  help                      - Show this help message');
        console.log('  quit, exit                - Exit the CLI');
        console.log();
    }

    /**
     * Load a deck by name
     */
    private async loadDeck(deckName: string): Promise<ICardDefinition[]> {
        const deckPath = path.join(__dirname, '../../data/sets', `${deckName}.json`);

        if (!fs.existsSync(deckPath)) {
            // Try alternative paths
            const alternatives = [
                path.join(__dirname, '../../data/sets/basics.json'),
                path.join(__dirname, '../../data/sets/simple_creatures.json')
            ];

            let foundPath: string | null = null;
            for (const altPath of alternatives) {
                if (fs.existsSync(altPath)) {
                    foundPath = altPath;
                    break;
                }
            }

            if (!foundPath) {
                throw new Error(`Deck file not found: ${deckPath}`);
            }

            console.log(`Using default deck from ${foundPath}`);
            const cards = JSON.parse(fs.readFileSync(foundPath, 'utf8'));
            return Array(8).fill(cards[0]); // Create a deck with 8 copies of the first card
        }

        const cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
        if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error(`Invalid deck file: ${deckPath}`);
        }

        // Create a deck with multiple copies to have enough cards
        const deck: ICardDefinition[] = [];
        for (let i = 0; i < 8; i++) {
            deck.push(cards[i % cards.length]);
        }

        return deck;
    }

    /**
     * Serialize game state for saving
     */
    private serializeGameState(gameState: IGameState): any {
        return {
            players: Array.from(gameState.players.entries()),
            zones: Array.from(gameState.zones.entries()),
            cardInstances: Array.from(gameState.cardInstances.entries()),
            activePlayerId: gameState.activePlayerId,
            priorityPlayerId: gameState.priorityPlayerId,
            turn: gameState.turn,
            phase: gameState.phase,
            step: gameState.step,
            stackZoneId: gameState.stackZoneId
        };
    }

    /**
     * Command completion for readline
     */
    private completer(line: string): [string[], string] {
        const commands = [
            'help', 'new-game', 'scenario', 'load', 'save', 'state', 'show', 'play', 'cast',
            'activate', 'pass', 'advance', 'clear', 'history', 'quit', 'exit'
        ];

        const hits = commands.filter(cmd => cmd.startsWith(line));
        return [hits, line];
    }

    /**
     * Add command to history
     */
    private addToHistory(command: string): void {
        if (this.options.enableHistory) {
            this.commandHistory.push(command);
            // Keep only last 1000 commands
            if (this.commandHistory.length > 1000) {
                this.commandHistory = this.commandHistory.slice(-1000);
            }
        }
    }

    /**
     * Show command history
     */
    private showHistory(): void {
        if (this.commandHistory.length === 0) {
            console.log('No command history available.');
            return;
        }

        console.log('Recent commands:');
        const recent = this.commandHistory.slice(-10);
        recent.forEach((cmd, index) => {
            console.log(`  ${index + 1}. ${cmd}`);
        });
    }

    /**
     * Load command history from file
     */
    private loadHistory(): void {
        if (!this.options.enableHistory || !this.options.historyFile) return;

        try {
            if (fs.existsSync(this.options.historyFile)) {
                const history = fs.readFileSync(this.options.historyFile, 'utf8')
                    .split('\n')
                    .filter(line => line.trim() !== '');
                this.commandHistory = history.slice(-1000);
            }
        } catch (error) {
            // Ignore history loading errors
        }
    }

    /**
     * Save command history to file
     */
    private saveHistory(): void {
        if (!this.options.enableHistory || !this.options.historyFile) return;

        try {
            fs.writeFileSync(this.options.historyFile, this.commandHistory.join('\n'));
        } catch (error) {
            // Ignore history saving errors
        }
    }
}
