import WebSocket from 'ws';
import { Server } from '../../src/server/index';
import { GameSessionManager } from '../../src/server/game_session_manager';
import { WebSocketManager, WebSocketMessage, AuthenticateMessage } from '../../src/server/websocket_manager';

describe('WebSocketManager', () => {
    let webSocketManager: WebSocketManager;
    let mockWebSocket: jest.Mocked<WebSocket>;

    beforeEach(() => {
        webSocketManager = new WebSocketManager();

        // Mock WebSocket
        mockWebSocket = {
            on: jest.fn(),
            send: jest.fn(),
            close: jest.fn(),
            readyState: WebSocket.OPEN
        } as any;
    });

    afterEach(() => {
        webSocketManager.shutdown();
    });

    describe('handleConnection', () => {
        it('should handle new WebSocket connection', () => {
            const clientId = webSocketManager.handleConnection(mockWebSocket);

            expect(clientId).toMatch(/^client_/);
            expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));

            // Check that a PING message was sent (should be the first call)
            expect(mockWebSocket.send).toHaveBeenCalledWith(
                expect.stringMatching(/"type":"PING"/)
            );
        });

        it('should track connected clients', () => {
            const clientId = webSocketManager.handleConnection(mockWebSocket);
            const stats = webSocketManager.getStats();

            expect(stats.totalClients).toBe(1);
            expect(stats.authenticatedClients).toBe(0);
            expect(stats.gamesWithClients).toBe(0);
        });
    });

    describe('handleMessage', () => {
        let clientId: string;
        let messageHandler: (data: Buffer) => void;

        beforeEach(() => {
            clientId = webSocketManager.handleConnection(mockWebSocket);
            messageHandler = (mockWebSocket.on as jest.Mock).mock.calls
                .find(call => call[0] === 'message')[1];
        });

        it('should handle authentication message', () => {
            const authMessage: WebSocketMessage = {
                type: 'AUTHENTICATE',
                payload: {
                    gameId: 'test-game-123',
                    playerId: 'player1'
                } as AuthenticateMessage
            };

            messageHandler(Buffer.from(JSON.stringify(authMessage)));

            const stats = webSocketManager.getStats();
            expect(stats.authenticatedClients).toBe(1);
            expect(stats.gamesWithClients).toBe(1);
            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'AUTHENTICATE',
                    payload: { success: true },
                    gameId: 'test-game-123'
                })
            );
        });

        it('should handle ping message', () => {
            const pingMessage: WebSocketMessage = {
                type: 'PING',
                timestamp: Date.now()
            };

            messageHandler(Buffer.from(JSON.stringify(pingMessage)));

            // Check that PONG was sent (should be the most recent call)
            const lastCall = (mockWebSocket.send as jest.Mock).mock.calls.slice(-1)[0][0];
            const lastMessage = JSON.parse(lastCall);
            expect(lastMessage.type).toBe('PONG');
            expect(typeof lastMessage.timestamp).toBe('number');
        });

        it('should handle invalid JSON message', () => {
            messageHandler(Buffer.from('invalid json'));

            // Check that an ERROR message was sent
            const calls = (mockWebSocket.send as jest.Mock).mock.calls;
            const errorCall = calls.find(call => {
                try {
                    const message = JSON.parse(call[0]);
                    return message.type === 'ERROR' && message.payload?.message === 'Invalid message format';
                } catch {
                    return false;
                }
            });

            expect(errorCall).toBeTruthy();
        });

        it('should handle unknown message type', () => {
            const unknownMessage = {
                type: 'UNKNOWN_TYPE'
            };

            messageHandler(Buffer.from(JSON.stringify(unknownMessage)));

            // Check that an ERROR message was sent
            const calls = (mockWebSocket.send as jest.Mock).mock.calls;
            const errorCall = calls.find(call => {
                try {
                    const message = JSON.parse(call[0]);
                    return message.type === 'ERROR' && message.payload?.message?.includes('Unknown message type: UNKNOWN_TYPE');
                } catch {
                    return false;
                }
            });

            expect(errorCall).toBeTruthy();
        });
    });

    describe('broadcasting', () => {
        let clientId1: string;
        let clientId2: string;
        let mockWebSocket1: jest.Mocked<WebSocket>;
        let mockWebSocket2: jest.Mocked<WebSocket>;

        beforeEach(() => {
            mockWebSocket1 = { ...mockWebSocket };
            mockWebSocket2 = { ...mockWebSocket };

            clientId1 = webSocketManager.handleConnection(mockWebSocket1);
            clientId2 = webSocketManager.handleConnection(mockWebSocket2);

            // Authenticate both clients to the same game
            const authMessage: WebSocketMessage = {
                type: 'AUTHENTICATE',
                payload: {
                    gameId: 'test-game-123',
                    playerId: 'player1'
                } as AuthenticateMessage
            };

            const messageHandler1 = (mockWebSocket1.on as jest.Mock).mock.calls
                .find(call => call[0] === 'message')[1];
            const messageHandler2 = (mockWebSocket2.on as jest.Mock).mock.calls
                .find(call => call[0] === 'message')[1];

            messageHandler1(Buffer.from(JSON.stringify(authMessage)));
            messageHandler2(Buffer.from(JSON.stringify({
                ...authMessage,
                payload: { ...authMessage.payload, playerId: 'player2' }
            })));
        });

        it('should broadcast game state updates to all clients in a game', () => {
            const mockGameState = { turn: 1, phase: 'main1' } as any;
            const mockAction = { type: 'PLAY_LAND', cardId: 'card1' } as any;

            webSocketManager.broadcastGameStateUpdate('test-game-123', mockGameState, mockAction, 'player1');

            // Check that both clients received the broadcast
            const calls1 = (mockWebSocket1.send as jest.Mock).mock.calls;
            const calls2 = (mockWebSocket2.send as jest.Mock).mock.calls;

            const gameStateCall1 = calls1.find(call => {
                try {
                    const message = JSON.parse(call[0]);
                    return message.type === 'GAME_STATE_UPDATE';
                } catch {
                    return false;
                }
            });

            const gameStateCall2 = calls2.find(call => {
                try {
                    const message = JSON.parse(call[0]);
                    return message.type === 'GAME_STATE_UPDATE';
                } catch {
                    return false;
                }
            });

            expect(gameStateCall1).toBeTruthy();
            expect(gameStateCall2).toBeTruthy();

            if (gameStateCall1) {
                const message = JSON.parse(gameStateCall1[0]);
                expect(message.payload.gameState).toEqual(mockGameState);
                expect(message.payload.action).toEqual(mockAction);
                expect(message.payload.playerId).toBe('player1');
            }
        });

        it('should broadcast action results to all clients in a game', () => {
            const actionResult = {
                success: true,
                gameState: { turn: 1, phase: 'main1' } as any,
                action: { type: 'PLAY_LAND', cardId: 'card1' } as any,
                playerId: 'player1'
            };

            webSocketManager.broadcastActionResult('test-game-123', actionResult);

            // Check that both clients received the broadcast
            const calls1 = (mockWebSocket1.send as jest.Mock).mock.calls;
            const calls2 = (mockWebSocket2.send as jest.Mock).mock.calls;

            const actionResultCall1 = calls1.find(call => {
                try {
                    const message = JSON.parse(call[0]);
                    return message.type === 'ACTION_RESULT';
                } catch {
                    return false;
                }
            });

            const actionResultCall2 = calls2.find(call => {
                try {
                    const message = JSON.parse(call[0]);
                    return message.type === 'ACTION_RESULT';
                } catch {
                    return false;
                }
            });

            expect(actionResultCall1).toBeTruthy();
            expect(actionResultCall2).toBeTruthy();

            if (actionResultCall1) {
                const message = JSON.parse(actionResultCall1[0]);
                expect(message.payload).toEqual(actionResult);
            }
        });

        it('should not broadcast to clients not in the specified game', () => {
            const mockGameState = { turn: 1, phase: 'main1' } as any;
            const initialCallCount1 = (mockWebSocket1.send as jest.Mock).mock.calls.length;
            const initialCallCount2 = (mockWebSocket2.send as jest.Mock).mock.calls.length;

            webSocketManager.broadcastGameStateUpdate('different-game', mockGameState);

            // Should not have any new calls for game state updates
            const newCallCount1 = (mockWebSocket1.send as jest.Mock).mock.calls.length;
            const newCallCount2 = (mockWebSocket2.send as jest.Mock).mock.calls.length;

            expect(newCallCount1).toBe(initialCallCount1);
            expect(newCallCount2).toBe(initialCallCount2);
        });
    });

    describe('client management', () => {
        it('should clean up disconnected clients', (done) => {
            const clientId = webSocketManager.handleConnection(mockWebSocket);
            const disconnectHandler = (mockWebSocket.on as jest.Mock).mock.calls
                .find(call => call[0] === 'close')[1];

            // Initial stats
            expect(webSocketManager.getStats().totalClients).toBe(1);

            // Simulate disconnect
            disconnectHandler();

            // Should clean up immediately
            setTimeout(() => {
                expect(webSocketManager.getStats().totalClients).toBe(0);
                done();
            }, 10);
        });

        it('should get correct game client count', () => {
            const mockWebSocket1 = {
                on: jest.fn(),
                send: jest.fn(),
                close: jest.fn(),
                readyState: WebSocket.OPEN
            } as any;

            const mockWebSocket2 = {
                on: jest.fn(),
                send: jest.fn(),
                close: jest.fn(),
                readyState: WebSocket.OPEN
            } as any;

            const clientId1 = webSocketManager.handleConnection(mockWebSocket1);
            const clientId2 = webSocketManager.handleConnection(mockWebSocket2);

            // Get message handlers
            const messageHandler1 = (mockWebSocket1.on as jest.Mock).mock.calls
                .find(call => call[0] === 'message')[1];
            const messageHandler2 = (mockWebSocket2.on as jest.Mock).mock.calls
                .find(call => call[0] === 'message')[1];

            // Authenticate both to the same game
            const authMessage1: WebSocketMessage = {
                type: 'AUTHENTICATE',
                payload: { gameId: 'test-game', playerId: 'player1' } as AuthenticateMessage
            };

            const authMessage2: WebSocketMessage = {
                type: 'AUTHENTICATE',
                payload: { gameId: 'test-game', playerId: 'player2' } as AuthenticateMessage
            };

            messageHandler1(Buffer.from(JSON.stringify(authMessage1)));
            messageHandler2(Buffer.from(JSON.stringify(authMessage2)));

            expect(webSocketManager.getGameClientCount('test-game')).toBe(2);
            expect(webSocketManager.getGameClientCount('nonexistent-game')).toBe(0);
        });
    });

    describe('error handling', () => {
        it('should handle WebSocket send errors gracefully', () => {
            mockWebSocket.send.mockImplementation(() => {
                throw new Error('Send failed');
            });

            const clientId = webSocketManager.handleConnection(mockWebSocket);

            // This should not throw
            expect(() => {
                webSocketManager.broadcastGameStateUpdate('test-game', {} as any);
            }).not.toThrow();
        });

        it('should handle closed WebSocket connections', () => {
            const closedWebSocket = {
                ...mockWebSocket,
                readyState: WebSocket.CLOSED
            } as jest.Mocked<WebSocket>;

            const clientId = webSocketManager.handleConnection(closedWebSocket);

            // Should not attempt to send to closed connection
            webSocketManager.broadcastGameStateUpdate('test-game', {} as any);
            expect(closedWebSocket.send).not.toHaveBeenCalledWith(
                expect.stringContaining('GAME_STATE_UPDATE')
            );
        });
    });

    describe('shutdown', () => {
        it('should close all connections on shutdown', () => {
            const mockWebSocket1 = { ...mockWebSocket };
            const mockWebSocket2 = { ...mockWebSocket };

            webSocketManager.handleConnection(mockWebSocket1);
            webSocketManager.handleConnection(mockWebSocket2);

            webSocketManager.shutdown();

            expect(mockWebSocket1.close).toHaveBeenCalledWith(1001, 'Server shutting down');
            expect(mockWebSocket2.close).toHaveBeenCalledWith(1001, 'Server shutting down');
        });
    });
});

describe('Server WebSocket Integration', () => {
    let server: Server;
    let port: number;

    beforeEach(async () => {
        port = 3001 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts
        server = new Server(port);
        await server.start();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('should accept WebSocket connections', (done) => {
        const ws = new WebSocket(`ws://localhost:${port}/ws`);

        const cleanup = () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };

        ws.on('open', () => {
            expect(ws.readyState).toBe(WebSocket.OPEN);
            cleanup();
            done();
        });

        ws.on('error', (error) => {
            cleanup();
            done(error);
        });

        ws.on('close', () => {
            // Connection closed successfully
        });
    });

    it('should handle WebSocket authentication', (done) => {
        const ws = new WebSocket(`ws://localhost:${port}/ws`);

        const cleanup = () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };

        ws.on('open', () => {
            // First, expect a PING message
            ws.on('message', (data) => {
                const message: WebSocketMessage = JSON.parse(data.toString());

                if (message.type === 'PING') {
                    // Send authentication
                    ws.send(JSON.stringify({
                        type: 'AUTHENTICATE',
                        payload: {
                            gameId: 'test-game-123',
                            playerId: 'player1'
                        }
                    }));
                } else if (message.type === 'AUTHENTICATE' && message.payload?.success) {
                    expect(message.gameId).toBe('test-game-123');
                    cleanup();
                    done();
                }
            });
        });

        ws.on('error', (error) => {
            cleanup();
            done(error);
        });

        ws.on('close', () => {
            // Connection closed successfully
        });
    });

    it('should provide WebSocket statistics endpoint', async () => {
        const response = await fetch(`http://localhost:${port}/ws/stats`);
        const stats = await response.json();

        expect(stats).toHaveProperty('totalClients');
        expect(stats).toHaveProperty('authenticatedClients');
        expect(stats).toHaveProperty('gamesWithClients');
        expect(typeof stats.totalClients).toBe('number');
        expect(typeof stats.authenticatedClients).toBe('number');
        expect(typeof stats.gamesWithClients).toBe('number');
    });
});
