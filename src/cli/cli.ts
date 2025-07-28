import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { IGameState, ICardDefinition, IPlayer, IZone, ICardInstance, Action } from '../core/game_state/interfaces';
import { Phase, Step } from '../core/rules/turn_manager';
import { GameStateDisplay } from './game_state_display';
import { CommandHandler } from './command_handler';
import { allScenarios, getScenario, Scenario } from './scenarios/scenarios';
import { deserializeGameState } from '../utils/serialization';

export interface CLIOptions {
    enableHistory?: boolean;
    historyFile?: string;
    enableAutocomplete?: boolean;
    apiBaseUrl?: string;
}

export class CLI {
    private rl: readline.Interface;
    private display: GameStateDisplay;
    private commandHandler: CommandHandler;
    private options: CLIOptions;
    private commandHistory: string[] = [];
    private gameId: string | null = null;
    private gameState: IGameState | null = null;
    private apiBaseUrl: string;

    constructor(options: CLIOptions = {}) {
        this.display = new GameStateDisplay();
        this.commandHandler = new CommandHandler();
        this.options = {
            enableHistory: true,
            historyFile: '.mtg-cli-history',
            enableAutocomplete: true,
            apiBaseUrl: 'http://localhost:3000',
            ...options
        };
        this.apiBaseUrl = this.options.apiBaseUrl!;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: this.options.enableAutocomplete ? this.completer.bind(this) : undefined,
            history: []
        });

        this.loadHistory();
    }

    private async apiRequest(method: string, path: string, body?: any): Promise<any> {
        const options: http.RequestOptions = {
            method: method,
            hostname: new URL(this.apiBaseUrl).hostname,
            port: new URL(this.apiBaseUrl).port,
            path: path,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        const errorResponse = JSON.parse(data);
                        reject(new Error(errorResponse.error || `Request failed with status code ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }

    async start(): Promise<void> {
        console.log('='.repeat(60));
        console.log('    Magic: The Gathering Engine CLI');
        console.log('='.repeat(60));
        console.log();

        if (!this.gameId) {
            console.log('No game loaded. Use "new-game" to start a new game.');
            console.log('Type "help" for available commands or "quit" to exit.');
        } else {
            console.log('Game loaded successfully!');
            if (this.gameState) {
                this.display.showGameState(this.gameState);
            }
        }

        console.log();
        await this.commandLoop();
    }

    async newGame(player1DeckName: string = 'basics', player2DeckName: string = 'basics'): Promise<void> {
        try {
            const player1Deck = await this.loadDeck(player1DeckName);
            const player2Deck = await this.loadDeck(player2DeckName);

            const response = await this.apiRequest('POST', '/games', {
                player1Deck: player1Deck.map(c => c.id),
                player2Deck: player2Deck.map(c => c.id)
            });

            this.gameId = response.gameId;
            this.gameState = deserializeGameState(response.gameState);
            console.log(`Started new game with ID: ${this.gameId}`);
        } catch (error) {
            console.error('Failed to start new game:', (error as Error).message);
        }
    }

    async loadScenario(scenarioName: string): Promise<void> {
        try {
            const scenario = getScenario(scenarioName);
            if (!scenario) {
                console.log(`Scenario not found: ${scenarioName}`);
                console.log('Available scenarios:');
                this.listScenarios();
                return;
            }

            const response = await this.apiRequest('POST', '/games', {
                player1Deck: scenario.player1Deck.map(c => c.id),
                player2Deck: scenario.player2Deck.map(c => c.id)
            });

            this.gameId = response.gameId;
            this.gameState = deserializeGameState(response.gameState);

            console.log(`Loaded scenario: ${scenario.name}`);
            console.log(`Description: ${scenario.description}`);

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

    listScenarios(): void {
        console.log('Available scenarios:');
        console.log();
        allScenarios.forEach((scenario, index) => {
            console.log(`  ${index + 1}. ${scenario.name}`);
            console.log(`     ${scenario.description}`);
            console.log();
        });
    }

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
                if (this.gameId && this.gameState) {
                    this.display.showGameState(this.gameState);
                } else {
                    console.log('No game started. Use "new-game" to start a new game.');
                }
                break;

            case 'new-game':
                await this.newGame(args[0], args[1]);
                if (this.gameId && this.gameState) {
                    this.display.showGameState(this.gameState);
                }
                break;

            case 'scenario':
                if (args.length === 0) {
                    this.listScenarios();
                    break;
                }
                await this.loadScenario(args[0]);
                if (this.gameId && this.gameState) {
                    this.display.showGameState(this.gameState);
                }
                break;

            case 'play':
            case 'cast':
            case 'activate':
            case 'pass':
            case 'advance':
                if (!this.gameId) {
                    console.log('No game started. Use "new-game" to start a new game.');
                    break;
                }
                await this.handleGameAction(command, args);
                break;

            case 'next-turn':
            case 'to-main':
            case 'to-combat':
            case 'to-end':
            case 'to-cleanup':
                if (!this.gameId) {
                    console.log('No game started. Use "new-game" to start a new game.');
                    break;
                }
                await this.handleAutomationCommand(command, args);
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

    private async handleGameAction(command: string, args: string[]): Promise<void> {
        if (!this.gameId || !this.gameState) return;

        try {
            const action = this.commandHandler.parseAction(command, args, this.gameState);
            if (action) {
                const playerId = this.gameState.priorityPlayerId;
                const response = await this.apiRequest('POST', `/games/${this.gameId}/actions`, {
                    playerId,
                    action
                });
                this.gameState = deserializeGameState(response.gameState);
                console.log(`Action executed: ${command} ${args.join(' ')}`);
                if (this.gameState) {
                    this.display.showGameState(this.gameState);
                }
            }
        } catch (error) {
            console.error('Failed to execute action:', (error as Error).message);
        }
    }

    private async handleAutomationCommand(command: string, args: string[]): Promise<void> {
        if (!this.gameId || !this.gameState) return;

        try {
            const initialState = this.gameState;
            const initialTurn = initialState.turn;

            let actionCount = 0;
            const maxActions = 100;

            switch (command) {
                case 'next-turn':
                    console.log(`Advancing from turn ${initialTurn} to next turn...`);
                    while (this.gameState && this.gameState.turn === initialTurn && actionCount < maxActions) {
                        await this.advanceOneStep();
                        actionCount++;
                    }
                    if (actionCount >= maxActions) {
                        console.log('Warning: Hit maximum action limit, stopping automation');
                    } else if (this.gameState) {
                        console.log(`Advanced to turn ${this.gameState.turn}`);
                    }
                    break;
                // Other automation commands can be implemented here
            }

            if (this.gameState) {
                this.display.showGameState(this.gameState);
            }
        } catch (error) {
            console.error('Failed to execute automation command:', (error as Error).message);
        }
    }

    private async advanceOneStep(): Promise<boolean> {
        if (!this.gameId || !this.gameState) return false;

        const initialState = this.gameState;

        try {
            // Handle both Map and plain object cases for players
            const playerIds = initialState.players instanceof Map
                ? Array.from(initialState.players.keys())
                : Object.keys(initialState.players);

            for (const playerId of playerIds) {
                if (this.gameState && this.gameState.priorityPlayerId === playerId) {
                    const response = await this.apiRequest('POST', `/games/${this.gameId}/actions`, {
                        playerId,
                        action: { type: 'PASS_PRIORITY' }
                    });
                    this.gameState = deserializeGameState(response.gameState);
                }
            }

            const response = await this.apiRequest('POST', `/games/${this.gameId}/actions`, {
                playerId: initialState.activePlayerId,
                action: { type: 'ADVANCE_TURN' }
            });
            this.gameState = deserializeGameState(response.gameState);

            return this.gameState !== null && (this.gameState.turn !== initialState.turn || this.gameState.step !== initialState.step);
        } catch (error) {
            return false;
        }
    }

    private showHelp(): void {
        console.log('Available commands:');
        console.log();
        console.log('Game Management:');
        console.log('  new-game [deck1] [deck2]  - Start a new game with specified decks (default: basics)');
        console.log('  scenario [name]           - Load a predefined scenario or list available scenarios');
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
        console.log('Automation Commands:');
        console.log('  next-turn                 - Automatically advance to the next turn');
        console.log();
        console.log('Utility:');
        console.log('  history                   - Show command history');
        console.log('  help                      - Show this help message');
        console.log('  quit, exit                - Exit the CLI');
        console.log();
    }

    private async loadDeck(deckName: string): Promise<ICardDefinition[]> {
        const deckPath = path.join(__dirname, '../../data/sets', `${deckName}.json`);

        if (!fs.existsSync(deckPath)) {
            throw new Error(`Deck file not found: ${deckPath}`);
        }

        const cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
        if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error(`Invalid deck file: ${deckPath}`);
        }

        const deck: ICardDefinition[] = [];
        for (let i = 0; i < 40; i++) {
            deck.push(cards[i % cards.length]);
        }

        return deck;
    }

    private completer(line: string): [string[], string] {
        const commands = [
            'help', 'new-game', 'scenario', 'state', 'show', 'play', 'cast',
            'activate', 'pass', 'advance', 'next-turn', 'clear', 'history', 'quit', 'exit'
        ];

        const hits = commands.filter(cmd => cmd.startsWith(line));
        return [hits, line];
    }

    private addToHistory(command: string): void {
        if (this.options.enableHistory) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 1000) {
                this.commandHistory = this.commandHistory.slice(-1000);
            }
        }
    }

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

    private saveHistory(): void {
        if (!this.options.enableHistory || !this.options.historyFile) return;

        try {
            fs.writeFileSync(this.options.historyFile, this.commandHistory.join('\n'));
        } catch (error) {
            // Ignore history saving errors
        }
    }
}