import WebSocket from 'ws';
import { IGameState } from '../core/game_state/interfaces';
import { Action } from '../core/engine';

/**
 * Represents a WebSocket client connection.
 */
interface WebSocketClient {
    id: string;
    ws: WebSocket;
    gameId?: string;
    playerId?: string;
    authenticated: boolean;
    connectedAt: Date;
    lastActivity: Date;
}

/**
 * WebSocket message types for real-time communication.
 */
export interface WebSocketMessage {
    type: 'AUTHENTICATE' | 'GAME_STATE_UPDATE' | 'ACTION_RESULT' | 'ERROR' | 'PING' | 'PONG';
    payload?: any;
    gameId?: string;
    timestamp?: number;
}

/**
 * Authentication message payload.
 */
export interface AuthenticateMessage {
    gameId: string;
    playerId: string;
    token?: string; // For future authentication implementation
}

/**
 * Game state update message payload.
 */
export interface GameStateUpdateMessage {
    gameState: IGameState;
    action?: Action;
    playerId?: string;
}

/**
 * Action result message payload.
 */
export interface ActionResultMessage {
    success: boolean;
    gameState: IGameState;
    error?: string;
    action: Action;
    playerId: string;
}

/**
 * Error message payload.
 */
export interface ErrorMessage {
    message: string;
    code?: string;
}

/**
 * Manages WebSocket connections for real-time game updates.
 */
export class WebSocketManager {
    private clients: Map<string, WebSocketClient> = new Map();
    private gameClients: Map<string, Set<string>> = new Map(); // gameId -> Set of client IDs
    private cleanupInterval?: NodeJS.Timeout;

    constructor() {
        // Cleanup interval will be started when needed
    }

    /**
     * Start the cleanup interval for inactive connections.
     */
    startCleanupInterval(): void {
        if (!this.cleanupInterval) {
            this.cleanupInterval = setInterval(() => {
                this.cleanupInactiveClients();
            }, 30000);
        }
    }

    /**
     * Handles a new WebSocket connection.
     */
    handleConnection(ws: WebSocket): string {
        const clientId = this.generateClientId();
        const client: WebSocketClient = {
            id: clientId,
            ws,
            authenticated: false,
            connectedAt: new Date(),
            lastActivity: new Date()
        };

        this.clients.set(clientId, client);

        // Set up message handling
        ws.on('message', (data: Buffer) => {
            this.handleMessage(clientId, data);
        });

        // Handle connection close
        ws.on('close', () => {
            this.handleDisconnection(clientId);
        });

        // Handle connection errors
        ws.on('error', (error: Error) => {
            console.error(`WebSocket error for client ${clientId}:`, error);
            this.handleDisconnection(clientId);
        });

        // Send initial ping to confirm connection
        this.sendMessage(clientId, {
            type: 'PING',
            timestamp: Date.now()
        });

        console.log(`WebSocket client connected: ${clientId}`);
        return clientId;
    }

    /**
     * Handles incoming WebSocket messages.
     */
    private handleMessage(clientId: string, data: Buffer): void {
        const client = this.clients.get(clientId);
        if (!client) {
            return;
        }

        client.lastActivity = new Date();

        try {
            const message: WebSocketMessage = JSON.parse(data.toString());

            switch (message.type) {
                case 'AUTHENTICATE':
                    this.handleAuthentication(clientId, message.payload as AuthenticateMessage);
                    break;
                case 'PONG':
                    // Client responded to ping, connection is alive
                    break;
                case 'PING':
                    // Client sent ping, respond with pong
                    this.sendMessage(clientId, {
                        type: 'PONG',
                        timestamp: Date.now()
                    });
                    break;
                default:
                    console.warn(`Unknown WebSocket message type: ${message.type}`);
                    this.sendError(clientId, `Unknown message type: ${message.type}`);
                    break;
            }
        } catch (error) {
            console.error(`Error parsing WebSocket message from client ${clientId}:`, error);
            this.sendError(clientId, 'Invalid message format');
        }
    }

    /**
     * Handles client authentication.
     */
    private handleAuthentication(clientId: string, authData: AuthenticateMessage): void {
        const client = this.clients.get(clientId);
        if (!client) {
            return;
        }

        // Basic validation - in a real implementation, you'd validate the token
        if (!authData.gameId || !authData.playerId) {
            this.sendError(clientId, 'Missing gameId or playerId in authentication');
            return;
        }

        // For now, we'll accept any authentication (no token validation)
        // In a production system, you'd validate the token against the game session
        client.gameId = authData.gameId;
        client.playerId = authData.playerId;
        client.authenticated = true;

        // Add client to game-specific tracking
        if (!this.gameClients.has(authData.gameId)) {
            this.gameClients.set(authData.gameId, new Set());
        }
        this.gameClients.get(authData.gameId)!.add(clientId);

        console.log(`Client ${clientId} authenticated for game ${authData.gameId} as player ${authData.playerId}`);

        // Send confirmation
        this.sendMessage(clientId, {
            type: 'AUTHENTICATE',
            payload: { success: true },
            gameId: authData.gameId
        });
    }

    /**
     * Handles client disconnection.
     */
    private handleDisconnection(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            // Remove from game-specific tracking
            if (client.gameId && this.gameClients.has(client.gameId)) {
                this.gameClients.get(client.gameId)!.delete(clientId);
                if (this.gameClients.get(client.gameId)!.size === 0) {
                    this.gameClients.delete(client.gameId);
                }
            }

            console.log(`WebSocket client disconnected: ${clientId}`);
        }

        this.clients.delete(clientId);
    }

    /**
     * Broadcasts a game state update to all connected clients for a specific game.
     */
    broadcastGameStateUpdate(gameId: string, gameState: IGameState, action?: Action, playerId?: string): void {
        const clientIds = this.gameClients.get(gameId);
        if (!clientIds || clientIds.size === 0) {
            return;
        }

        const message: WebSocketMessage = {
            type: 'GAME_STATE_UPDATE',
            payload: {
                gameState,
                action,
                playerId
            } as GameStateUpdateMessage,
            gameId,
            timestamp: Date.now()
        };

        clientIds.forEach(clientId => {
            this.sendMessage(clientId, message);
        });

        console.log(`Broadcasted game state update for game ${gameId} to ${clientIds.size} clients`);
    }

    /**
     * Sends an action result to all connected clients for a specific game.
     */
    broadcastActionResult(gameId: string, result: ActionResultMessage): void {
        const clientIds = this.gameClients.get(gameId);
        if (!clientIds || clientIds.size === 0) {
            return;
        }

        const message: WebSocketMessage = {
            type: 'ACTION_RESULT',
            payload: result,
            gameId,
            timestamp: Date.now()
        };

        clientIds.forEach(clientId => {
            this.sendMessage(clientId, message);
        });

        console.log(`Broadcasted action result for game ${gameId} to ${clientIds.size} clients`);
    }

    /**
     * Sends a message to a specific client.
     */
    private sendMessage(clientId: string, message: WebSocketMessage): void {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            client.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error(`Error sending message to client ${clientId}:`, error);
            this.handleDisconnection(clientId);
        }
    }

    /**
     * Sends an error message to a specific client.
     */
    private sendError(clientId: string, errorMessage: string, code?: string): void {
        this.sendMessage(clientId, {
            type: 'ERROR',
            payload: {
                message: errorMessage,
                code
            } as ErrorMessage,
            timestamp: Date.now()
        });
    }

    /**
     * Cleans up inactive clients.
     */
    private cleanupInactiveClients(): void {
        const now = new Date();
        const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

        this.clients.forEach((client, clientId) => {
            const timeSinceLastActivity = now.getTime() - client.lastActivity.getTime();

            if (timeSinceLastActivity > inactiveThreshold || client.ws.readyState === WebSocket.CLOSED) {
                console.log(`Cleaning up inactive client: ${clientId}`);
                this.handleDisconnection(clientId);
            }
        });
    }

    /**
     * Gets the number of clients connected to a specific game.
     */
    getGameClientCount(gameId: string): number {
        const clientIds = this.gameClients.get(gameId);
        return clientIds ? clientIds.size : 0;
    }

    /**
     * Gets connection statistics.
     */
    getStats(): { totalClients: number; authenticatedClients: number; gamesWithClients: number } {
        let authenticatedClients = 0;
        this.clients.forEach(client => {
            if (client.authenticated) {
                authenticatedClients++;
            }
        });

        return {
            totalClients: this.clients.size,
            authenticatedClients,
            gamesWithClients: this.gameClients.size
        };
    }

    /**
     * Generates a unique client ID.
     */
    private generateClientId(): string {
        return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Shuts down the WebSocket manager.
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }

        // Close all client connections
        this.clients.forEach((client, clientId) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.close(1001, 'Server shutting down');
            }
        });

        this.clients.clear();
        this.gameClients.clear();

        console.log('WebSocket manager shut down');
    }
}
