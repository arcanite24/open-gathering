import request from 'supertest';
import { Server } from '../../src/server/index';
import { CreateGameRequest, SubmitActionRequest } from '../../src/server/types';

describe('Server API', () => {
    let server: Server;
    let app: any;

    beforeAll(() => {
        server = new Server(0); // Use port 0 for testing
        app = server.getApp();
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('activeSessions');
        });
    });

    describe('GET /cards', () => {
        it('should return available card definitions', async () => {
            const response = await request(app)
                .get('/cards')
                .expect(200);

            expect(response.body).toHaveProperty('cards');
            expect(Array.isArray(response.body.cards)).toBe(true);
            expect(response.body.cards.length).toBeGreaterThan(0);

            // Check that basic lands are included
            const cardNames = response.body.cards.map((card: any) => card.name);
            expect(cardNames).toContain('Plains');
            expect(cardNames).toContain('Island');
        });
    });

    describe('POST /games', () => {
        it('should create a new game', async () => {
            const createGameRequest: CreateGameRequest = {
                player1Deck: ['basic_plains', 'basic_plains', 'basic_forest'],
                player2Deck: ['basic_island', 'basic_island', 'basic_mountain']
            };

            const response = await request(app)
                .post('/games')
                .send(createGameRequest)
                .expect(201);

            expect(response.body).toHaveProperty('gameId');
            expect(response.body).toHaveProperty('gameState');
            expect(typeof response.body.gameId).toBe('string');
            expect(response.body.gameState).toHaveProperty('players');
            expect(response.body.gameState).toHaveProperty('zones');
            expect(response.body.gameState).toHaveProperty('cardInstances');
        });

        it('should return 400 for missing decks', async () => {
            const invalidRequest = {
                player1Deck: ['basic_plains']
                // Missing player2Deck
            };

            const response = await request(app)
                .post('/games')
                .send(invalidRequest)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Validation failed');
        });

        it('should return 400 for invalid deck format', async () => {
            const invalidRequest = {
                player1Deck: 'not-an-array',
                player2Deck: ['basic_island']
            };

            const response = await request(app)
                .post('/games')
                .send(invalidRequest)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Validation failed');
        });

        it('should return 500 for invalid card IDs', async () => {
            const invalidRequest: CreateGameRequest = {
                player1Deck: ['invalid_card'],
                player2Deck: ['basic_island']
            };

            const response = await request(app)
                .post('/games')
                .send(invalidRequest)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /games/:id', () => {
        let gameId: string;

        beforeEach(async () => {
            const createGameRequest: CreateGameRequest = {
                player1Deck: ['basic_plains', 'basic_forest'],
                player2Deck: ['basic_island', 'basic_mountain']
            };

            const createResponse = await request(app)
                .post('/games')
                .send(createGameRequest);

            gameId = createResponse.body.gameId;
        });

        it('should return game state for existing game', async () => {
            const response = await request(app)
                .get(`/games/${gameId}`)
                .expect(200);

            expect(response.body).toHaveProperty('gameState');
            expect(response.body.gameState).toHaveProperty('players');
            expect(response.body.gameState).toHaveProperty('zones');
            expect(response.body.gameState).toHaveProperty('activePlayerId');
            expect(response.body.gameState).toHaveProperty('priorityPlayerId');
        });

        it('should return 404 for non-existent game', async () => {
            const response = await request(app)
                .get('/games/game_9999999999_notexists')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });
    });

    describe('POST /games/:id/actions', () => {
        let gameId: string;

        beforeEach(async () => {
            const createGameRequest: CreateGameRequest = {
                player1Deck: ['basic_plains', 'basic_forest'],
                player2Deck: ['basic_island', 'basic_mountain']
            };

            const createResponse = await request(app)
                .post('/games')
                .send(createGameRequest);

            gameId = createResponse.body.gameId;
        });

        it('should accept valid actions', async () => {
            const actionRequest: SubmitActionRequest = {
                playerId: 'player1',
                action: { type: 'PASS_PRIORITY' }
            };

            const response = await request(app)
                .post(`/games/${gameId}/actions`)
                .send(actionRequest)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('gameState');
            expect(response.body).not.toHaveProperty('error');
        });

        it('should return 400 for missing playerId', async () => {
            const invalidRequest = {
                action: { type: 'PASS_PRIORITY' }
                // Missing playerId
            };

            const response = await request(app)
                .post(`/games/${gameId}/actions`)
                .send(invalidRequest)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Validation failed');
        });

        it('should return 400 for missing action', async () => {
            const invalidRequest = {
                playerId: 'player1'
                // Missing action
            };

            const response = await request(app)
                .post(`/games/${gameId}/actions`)
                .send(invalidRequest)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Validation failed');
        });

        it('should return 404 for non-existent game', async () => {
            const actionRequest: SubmitActionRequest = {
                playerId: 'player1',
                action: { type: 'PASS_PRIORITY' }
            };

            const response = await request(app)
                .post('/games/game_9999999999_notexists/actions')
                .send(actionRequest)
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });
    });

    describe('Error handling', () => {
        it('should return 404 for unmatched routes', async () => {
            const response = await request(app)
                .get('/nonexistent-route')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Route /nonexistent-route not found');
        });

        it('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/games')
                .send('invalid json')
                .set('Content-Type', 'application/json')
                .expect(400);

            // Express automatically handles malformed JSON with a 400 response
        });
    });

    describe('Integration test: Complete game flow', () => {
        it('should handle a complete create-game-action flow', async () => {
            // Step 1: Create a game
            const createGameRequest: CreateGameRequest = {
                player1Deck: ['basic_plains', 'basic_forest', 'basic_island'],
                player2Deck: ['basic_swamp', 'basic_mountain', 'basic_plains']
            };

            const createResponse = await request(app)
                .post('/games')
                .send(createGameRequest)
                .expect(201);

            const gameId = createResponse.body.gameId;
            expect(gameId).toBeDefined();

            // Step 2: Get initial game state
            const initialStateResponse = await request(app)
                .get(`/games/${gameId}`)
                .expect(200);

            expect(initialStateResponse.body.gameState.activePlayerId).toBe('player1');
            expect(initialStateResponse.body.gameState.priorityPlayerId).toBe('player1');

            // Step 3: Submit an action (pass priority)
            const actionRequest: SubmitActionRequest = {
                playerId: 'player1',
                action: { type: 'PASS_PRIORITY' }
            };

            const actionResponse = await request(app)
                .post(`/games/${gameId}/actions`)
                .send(actionRequest)
                .expect(200);

            expect(actionResponse.body.success).toBe(true);

            // Step 4: Verify state changed
            const updatedStateResponse = await request(app)
                .get(`/games/${gameId}`)
                .expect(200);

            // The priority should have changed after passing
            expect(updatedStateResponse.body.gameState.priorityPlayerId).toBe('player2');
        });
    });
});
