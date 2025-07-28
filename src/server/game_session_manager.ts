import { Engine } from '../core/engine';
import { ICardDefinition } from '../core/game_state/interfaces';
import { loadCardDefinitions, CardValidationError } from '../utils/card_loader';
import * as path from 'path';

/**
 * Represents an active game session.
 */
interface GameSession {
    id: string;
    engine: Engine;
    createdAt: Date;
    lastActivity: Date;
    playerIds: string[];
    status: 'waiting' | 'active' | 'completed' | 'abandoned';
}

/**
 * Game session statistics.
 */
export interface SessionStats {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    averageSessionDuration: number;
}

/**
 * Manages game sessions for the HTTP server.
 */
export class GameSessionManager {
    private sessions: Map<string, GameSession> = new Map();
    private cardDefinitions: Map<string, ICardDefinition> = new Map();

    constructor(dataDirectory?: string) {
        this.loadCardDefinitions(dataDirectory);
    }

    /**
     * Load card definitions from data files with validation.
     * @param dataDirectory Optional path to the data directory. Defaults to project root data directory.
     */
    private loadCardDefinitions(dataDirectory?: string): void {
        try {
            // Default to the project's data directory if not specified
            const defaultDataDir = path.join(__dirname, '..', '..', 'data');
            const dataDir = dataDirectory || defaultDataDir;

            this.cardDefinitions = loadCardDefinitions(dataDir);

            console.log(`Loaded ${this.cardDefinitions.size} card definitions from ${dataDir}/sets`);
        } catch (error) {
            if (error instanceof CardValidationError) {
                throw new Error(`Card validation failed: ${error.message}`);
            }
            throw new Error(`Failed to load card definitions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Creates a new game session.
     * @param player1Deck Array of card definition IDs for player 1's deck
     * @param player2Deck Array of card definition IDs for player 2's deck
     * @returns The created game session
     */
    createGame(player1Deck: string[], player2Deck: string[]): GameSession {
        const gameId = this.generateGameId();
        const engine = new Engine();

        // Convert card IDs to card definitions
        const player1Cards = player1Deck.map(id => this.cardDefinitions.get(id)).filter(Boolean) as ICardDefinition[];
        const player2Cards = player2Deck.map(id => this.cardDefinitions.get(id)).filter(Boolean) as ICardDefinition[];

        // Validate decks
        if (player1Cards.length !== player1Deck.length || player2Cards.length !== player2Deck.length) {
            throw new Error('Invalid card IDs in deck');
        }

        engine.startGame(player1Cards, player2Cards);

        const session: GameSession = {
            id: gameId,
            engine,
            createdAt: new Date(),
            lastActivity: new Date(),
            playerIds: ['player1', 'player2'],
            status: 'active'
        };

        this.sessions.set(gameId, session);
        return session;
    }

    /**
     * Retrieves a game session by ID.
     * @param gameId The game ID
     * @returns The game session or undefined if not found
     */
    getGame(gameId: string): GameSession | undefined {
        const session = this.sessions.get(gameId);
        if (session) {
            session.lastActivity = new Date();
        }
        return session;
    }

    /**
     * Removes expired game sessions.
     * @param maxAgeMinutes Maximum age in minutes before a session expires
     */
    cleanupExpiredSessions(maxAgeMinutes: number = 60): void {
        const now = new Date();
        const expiredSessions: string[] = [];

        for (const [gameId, session] of this.sessions) {
            const ageMinutes = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60);
            if (ageMinutes > maxAgeMinutes) {
                expiredSessions.push(gameId);
            }
        }

        expiredSessions.forEach(gameId => {
            this.sessions.delete(gameId);
        });
    }

    /**
     * Gets the number of active sessions.
     * @returns Number of active sessions
     */
    getActiveSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Generates a unique game ID.
     * @returns A unique game ID
     */
    private generateGameId(): string {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Gets available card definitions.
     * @returns Map of card definitions
     */
    getCardDefinitions(): Map<string, ICardDefinition> {
        return new Map(this.cardDefinitions);
    }

    /**
     * Marks a game session as completed.
     * @param gameId The game ID
     */
    completeSession(gameId: string): void {
        const session = this.sessions.get(gameId);
        if (session) {
            session.status = 'completed';
            session.lastActivity = new Date();
        }
    }

    /**
     * Marks a game session as abandoned.
     * @param gameId The game ID
     */
    abandonSession(gameId: string): void {
        const session = this.sessions.get(gameId);
        if (session) {
            session.status = 'abandoned';
            session.lastActivity = new Date();
        }
    }

    /**
     * Gets statistics about game sessions.
     * @returns Session statistics
     */
    getSessionStats(): SessionStats {
        const sessions = Array.from(this.sessions.values());
        const totalSessions = sessions.length;
        const activeSessions = sessions.filter(s => s.status === 'active').length;
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;

        const completedSessionDurations = sessions
            .filter(s => s.status === 'completed')
            .map(s => s.lastActivity.getTime() - s.createdAt.getTime());

        const averageSessionDuration = completedSessionDurations.length > 0
            ? completedSessionDurations.reduce((a, b) => a + b, 0) / completedSessionDurations.length
            : 0;

        return {
            totalSessions,
            activeSessions,
            completedSessions,
            abandonedSessions,
            averageSessionDuration: Math.round(averageSessionDuration / 1000) // Convert to seconds
        };
    }

    /**
     * Reloads card definitions from data files.
     * @param dataDirectory Optional path to the data directory
     */
    reloadCardDefinitions(dataDirectory?: string): void {
        this.loadCardDefinitions(dataDirectory);
    }

    /**
     * Removes a specific session.
     * @param gameId The game ID to remove
     * @returns True if the session was removed, false if it didn't exist
     */
    removeSession(gameId: string): boolean {
        return this.sessions.delete(gameId);
    }

    /**
     * Gets all sessions with a specific status.
     * @param status The status to filter by
     * @returns Array of sessions with the specified status
     */
    getSessionsByStatus(status: GameSession['status']): GameSession[] {
        return Array.from(this.sessions.values()).filter(s => s.status === status);
    }
}
