import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { IGameState, ICardDefinition } from '../core/game_state/interfaces';
import { GameStateDisplay } from './game_state_display';
import { CommandHandler } from './command_handler';
import { ErrorReporter } from './error_reporter';
import { GameError, ErrorCode } from '../core/errors';
import { allScenarios, getScenario } from './scenarios/scenarios';
import { deserializeGameState } from '../utils/serialization';
import { Phase, Step } from '../core/rules/turn_manager';

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
                        try {
                            const errorResponse = JSON.parse(data);
                            const serverError = GameError.fromNetworkError(
                                new Error(errorResponse.error || `Request failed with status code ${res.statusCode}`),
                                'Check the server logs or try restarting the server'
                            );
                            reject(serverError);
                        } catch (parseError) {
                            const networkError = GameError.fromNetworkError(
                                new Error(`Request failed with status code ${res.statusCode}`)
                            );
                            reject(networkError);
                        }
                    }
                });
            });

            req.on('error', (error) => {
                const networkError = GameError.fromNetworkError(
                    error,
                    'Make sure the server is running and accessible'
                );
                reject(networkError);
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

    async newGame(player1DeckName: string = 'sample_deck_1', player2DeckName: string = 'sample_deck_2'): Promise<void> {
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
            ErrorReporter.displayError(error as Error, this.gameState || undefined);
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
        console.log(`Handling command: "${input}"`);
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        console.log(`Parsed command: "${command}", args: [${args.join(', ')}]`);

        switch (command) {
            case 'help':
                this.showHelp();
                // Show contextual help if we have a game state
                if (this.gameState) {
                    ErrorReporter.showContextualHelp(this.gameState);
                }
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
            case 'nt':
            case 'to-main':
            case 'main':
            case 'to-combat':
            case 'combat':
            case 'to-end':
            case 'end':
            case 'to-cleanup':
            case 'cleanup':
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
                const error = new GameError(
                    ErrorCode.CommandNotFound,
                    `Unknown command: ${command}`,
                    'Type "help" for available commands',
                    {
                        command,
                        availableCommands: ['help', 'state', 'new-game', 'scenario', 'play', 'cast', 'activate', 'pass', 'advance', 'clear', 'history']
                    }
                );
                ErrorReporter.displayError(error, this.gameState || undefined);

                // Show contextual help if we have a game state
                if (this.gameState) {
                    ErrorReporter.showContextualHelp(this.gameState);
                }
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
            ErrorReporter.displayError(error as Error, this.gameState || undefined);
        }
    }

    private async handleAutomationCommand(command: string, args: string[]): Promise<void> {
        if (!this.gameId || !this.gameState) return;

        try {
            const initialState = this.gameState;
            const initialTurn = initialState.turn;

            let actionCount = 0;
            const maxActions = 500;

            switch (command) {
                case 'next-turn':
                case 'nt':
                    console.log(`Advancing from turn ${initialTurn} to next turn...`);
                    while (this.gameState && this.gameState.turn === initialTurn && actionCount < maxActions) {
                        await this.advanceOneStep();
                        actionCount++;
                    }
                    if (actionCount >= maxActions) {
                        console.log('Warning: Hit maximum action limit, stopping automation');
                        console.log(`Actions executed: ${actionCount}`);
                        console.log(`Current turn: ${this.gameState?.turn}, initial turn: ${initialTurn}`);
                        console.log(`Current phase: ${this.gameState?.phase}, step: ${this.gameState?.step}`);
                    } else if (this.gameState) {
                        console.log(`Advanced to turn ${this.gameState.turn} after ${actionCount} actions`);
                    }
                    break;

                case 'to-main':
                case 'main':
                    console.log(`Advancing to main phase...`);
                    console.log(`Current phase: ${this.gameState?.phase}, step: ${this.gameState?.step}`);
                    while (this.gameState &&
                        !(this.gameState.phase === Phase.PreCombatMain || this.gameState.phase === Phase.PostCombatMain) &&
                        actionCount < maxActions) {
                        console.log(`Loop iteration ${actionCount}: phase=${this.gameState.phase}, step=${this.gameState.step}`);
                        await this.advanceOneStep();
                        actionCount++;
                    }
                    if (actionCount >= maxActions) {
                        console.log('Warning: Hit maximum action limit, stopping automation');
                    } else if (this.gameState) {
                        console.log(`Advanced to main phase after ${actionCount} actions`);
                    }
                    break;

                case 'to-combat':
                case 'combat':
                    console.log(`Advancing to combat phase...`);
                    console.log(`Current phase: ${this.gameState?.phase}, step: ${this.gameState?.step}`);
                    while (this.gameState &&
                        !(this.gameState.phase === Phase.Combat) &&
                        actionCount < maxActions) {
                        console.log(`Loop iteration ${actionCount}: phase=${this.gameState.phase}, step=${this.gameState.step}`);
                        await this.advanceOneStep();
                        actionCount++;
                    }
                    if (actionCount >= maxActions) {
                        console.log('Warning: Hit maximum action limit, stopping automation');
                    } else if (this.gameState) {
                        console.log(`Advanced to combat phase after ${actionCount} actions`);
                    }
                    break;

                case 'to-end':
                case 'end':
                    console.log(`Advancing to end step...`);
                    console.log(`Current phase: ${this.gameState?.phase}, step: ${this.gameState?.step}`);
                    while (this.gameState &&
                        !(this.gameState.phase === Phase.Ending && this.gameState.step === Step.EndStep) &&
                        actionCount < maxActions) {
                        console.log(`Loop iteration ${actionCount}: phase=${this.gameState.phase}, step=${this.gameState.step}`);
                        await this.advanceOneStep();
                        actionCount++;
                    }
                    if (actionCount >= maxActions) {
                        console.log('Warning: Hit maximum action limit, stopping automation');
                    } else if (this.gameState) {
                        console.log(`Advanced to end step after ${actionCount} actions`);
                    }
                    break;

                case 'to-cleanup':
                case 'cleanup':
                    console.log(`Advancing to cleanup step...`);
                    console.log(`Current phase: ${this.gameState?.phase}, step: ${this.gameState?.step}`);
                    while (this.gameState &&
                        !(this.gameState.phase === Phase.Ending && this.gameState.step === Step.Cleanup) &&
                        actionCount < maxActions) {
                        console.log(`Loop iteration ${actionCount}: phase=${this.gameState.phase}, step=${this.gameState.step}`);
                        await this.advanceOneStep();
                        actionCount++;
                    }
                    if (actionCount >= maxActions) {
                        console.log('Warning: Hit maximum action limit, stopping automation');
                    } else if (this.gameState) {
                        console.log(`Advanced to cleanup step after ${actionCount} actions`);
                    }
                    break;

                default:
                    console.log(`Unknown automation command: ${command}`);
                    console.log('Available automation commands: next-turn, to-main, to-combat, to-end, to-cleanup');
            }

            if (this.gameState) {
                this.display.showGameState(this.gameState);
            }
        } catch (error) {
            ErrorReporter.displayError(error as Error, this.gameState || undefined);
        }
    }

    private async advanceOneStep(): Promise<boolean> {
        if (!this.gameId || !this.gameState) return false;

        const initialState = this.gameState;

        try {
            // Use the new ADVANCE_STEP action which handles both priority passing and turn advancement
            const response = await this.apiRequest('POST', `/games/${this.gameId}/actions`, {
                playerId: initialState.activePlayerId,
                action: { type: 'ADVANCE_STEP' }
            });
            this.gameState = deserializeGameState(response.gameState);

            // Add detailed logging for debugging
            console.log(`ADVANCE_STEP result - Turn: ${this.gameState?.turn}, Phase: ${this.gameState?.phase}, Step: ${this.gameState?.step}, Priority: ${this.gameState?.priorityPlayerId}, Active: ${this.gameState?.activePlayerId}`);

            return this.gameState !== null && (this.gameState.turn !== initialState.turn || this.gameState.step !== initialState.step);
        } catch (error) {
            return false;
        }
    }

    private showHelp(): void {
        console.log('📖 Available commands:');
        console.log();
        console.log('🎮 Game Management:');
        console.log('  new-game [deck1] [deck2]  - Start a new game with specified decks (default: basics)');
        console.log('                            Decks can be either predefined sets or deck definitions from data/decks');
        console.log('  scenario [name]           - Load a predefined scenario or list available scenarios');
        console.log();
        console.log('📊 Game State:');
        console.log('  state, show               - Display the current game state');
        console.log('  clear                     - Clear the screen');
        console.log();
        console.log('🎯 Game Actions (card references can be numbers or names):');
        console.log('  play <card>               - Play a land from hand (e.g., "play 1" or "play Plains")');
        console.log('  cast <card> [targets...]  - Cast a spell (e.g., "cast 2" or "cast Lightning Bolt")');
        console.log('  activate <card> <ability> - Activate an ability (e.g., "activate 1 1")');
        console.log('  pass                      - Pass priority');
        console.log('  advance                   - Advance to next turn/phase');
        console.log();
        console.log('⚡ Automation Commands:');
        console.log('  next-turn, nt             - Automatically advance to the next turn');
        console.log('  to-main, main             - Advance to the main phase');
        console.log('  to-combat, combat         - Advance to the combat phase');
        console.log('  to-end, end               - Advance to the end step');
        console.log('  to-cleanup, cleanup       - Advance to the cleanup step');
        console.log();
        console.log('🔧 Utility:');
        console.log('  history                   - Show command history');
        console.log('  help                      - Show this help message');
        console.log('  quit, exit                - Exit the CLI');
        console.log();
        console.log('💡 Tips:');
        console.log('  • Cards can be referenced by number (1, 2, 3...) or partial name');
        console.log('  • Error messages will show available options when commands fail');
        console.log('  • Use "state" frequently to check the current game situation');
        console.log('  • Use automation commands like "main", "combat", "end" to quickly navigate phases');
        console.log();
    }

    private async loadDeck(deckName: string): Promise<ICardDefinition[]> {
        // First, try to load as a deck ID from the decks directory
        const deckPath = path.join(__dirname, '../../data/decks', `${deckName}.json`);

        if (fs.existsSync(deckPath)) {
            try {
                const deckDefinition = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
                if (deckDefinition && deckDefinition.cardIds && Array.isArray(deckDefinition.cardIds)) {
                    // Load card definitions for each card ID in the deck
                    const cardDefinitions: ICardDefinition[] = [];
                    for (const cardId of deckDefinition.cardIds) {
                        const cardPath = path.join(__dirname, '../../data/sets');
                        const cardFiles = fs.readdirSync(cardPath);
                        let cardFound = false;

                        for (const file of cardFiles) {
                            if (file.endsWith('.json')) {
                                try {
                                    const cards = JSON.parse(fs.readFileSync(path.join(cardPath, file), 'utf8'));
                                    if (Array.isArray(cards)) {
                                        const card = cards.find((c: any) => c.id === cardId);
                                        if (card) {
                                            cardDefinitions.push(card);
                                            cardFound = true;
                                            break;
                                        }
                                    }
                                } catch (error) {
                                    // Continue to next file if this one fails
                                }
                            }
                        }

                        if (!cardFound) {
                            throw new Error(`Card with ID '${cardId}' not found in any card set`);
                        }
                    }

                    return cardDefinitions;
                }
            } catch (error) {
                console.warn(`Failed to load deck from ${deckPath}: ${error}`);
                // Fall through to the original behavior
            }
        }

        // Fall back to the original behavior - load from sets directory
        const setPath = path.join(__dirname, '../../data/sets', `${deckName}.json`);

        if (!fs.existsSync(setPath)) {
            throw new Error(`Deck file not found: ${setPath}`);
        }

        const cards = JSON.parse(fs.readFileSync(setPath, 'utf8'));
        if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error(`Invalid deck file: ${setPath}`);
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
            'activate', 'pass', 'advance', 'next-turn', 'nt', 'to-main', 'main',
            'to-combat', 'combat', 'to-end', 'end', 'to-cleanup', 'cleanup',
            'clear', 'history', 'quit', 'exit'
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