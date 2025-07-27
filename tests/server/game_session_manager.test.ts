import { GameSessionManager } from '../../src/server/game_session_manager';

describe('GameSessionManager', () => {
    let manager: GameSessionManager;

    beforeEach(() => {
        manager = new GameSessionManager();
    });

    describe('createGame', () => {
        it('should create a new game session', () => {
            const player1Deck = ['basic_plains', 'basic_plains', 'basic_plains'];
            const player2Deck = ['basic_island', 'basic_island', 'basic_island'];

            const session = manager.createGame(player1Deck, player2Deck);

            expect(session.id).toBeDefined();
            expect(session.engine).toBeDefined();
            expect(session.createdAt).toBeInstanceOf(Date);
            expect(session.lastActivity).toBeInstanceOf(Date);
        });

        it('should throw error for invalid card IDs', () => {
            const player1Deck = ['invalid_card'];
            const player2Deck = ['basic_island'];

            expect(() => {
                manager.createGame(player1Deck, player2Deck);
            }).toThrow('Invalid card IDs in deck');
        });

        it('should generate unique game IDs', () => {
            const player1Deck = ['basic_plains'];
            const player2Deck = ['basic_island'];

            const session1 = manager.createGame(player1Deck, player2Deck);
            const session2 = manager.createGame(player1Deck, player2Deck);

            expect(session1.id).not.toBe(session2.id);
        });
    });

    describe('getGame', () => {
        it('should retrieve an existing game session', () => {
            const player1Deck = ['basic_plains'];
            const player2Deck = ['basic_island'];

            const session = manager.createGame(player1Deck, player2Deck);
            const retrieved = manager.getGame(session.id);

            expect(retrieved).toBe(session);
        });

        it('should return undefined for non-existent game', () => {
            const retrieved = manager.getGame('non-existent-id');
            expect(retrieved).toBeUndefined();
        });

        it('should update lastActivity when game is retrieved', (done) => {
            const player1Deck = ['basic_plains'];
            const player2Deck = ['basic_island'];

            const session = manager.createGame(player1Deck, player2Deck);
            const originalActivity = session.lastActivity;

            // Wait a small amount to ensure time difference
            setTimeout(() => {
                manager.getGame(session.id);
                expect(session.lastActivity.getTime()).toBeGreaterThanOrEqual(originalActivity.getTime());
                done();
            }, 10);
        });
    });

    describe('cleanupExpiredSessions', () => {
        it('should remove expired sessions', () => {
            const player1Deck = ['basic_plains'];
            const player2Deck = ['basic_island'];

            const session = manager.createGame(player1Deck, player2Deck);

            // Manually set lastActivity to an old date
            session.lastActivity = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

            expect(manager.getActiveSessionCount()).toBe(1);

            manager.cleanupExpiredSessions(60); // 60 minutes max age

            expect(manager.getActiveSessionCount()).toBe(0);
        });

        it('should not remove active sessions', () => {
            const player1Deck = ['basic_plains'];
            const player2Deck = ['basic_island'];

            manager.createGame(player1Deck, player2Deck);

            expect(manager.getActiveSessionCount()).toBe(1);

            manager.cleanupExpiredSessions(60);

            expect(manager.getActiveSessionCount()).toBe(1);
        });
    });

    describe('getActiveSessionCount', () => {
        it('should return correct session count', () => {
            expect(manager.getActiveSessionCount()).toBe(0);

            const player1Deck = ['basic_plains'];
            const player2Deck = ['basic_island'];

            manager.createGame(player1Deck, player2Deck);
            expect(manager.getActiveSessionCount()).toBe(1);

            manager.createGame(player1Deck, player2Deck);
            expect(manager.getActiveSessionCount()).toBe(2);
        });
    });

    describe('getCardDefinitions', () => {
        it('should return available card definitions', () => {
            const cards = manager.getCardDefinitions();

            expect(cards.size).toBeGreaterThan(0);
            expect(cards.has('basic_plains')).toBe(true);
            expect(cards.has('basic_island')).toBe(true);
            expect(cards.has('basic_swamp')).toBe(true);
            expect(cards.has('basic_mountain')).toBe(true);
            expect(cards.has('basic_forest')).toBe(true);
        });

        it('should return a copy of card definitions', () => {
            const cards1 = manager.getCardDefinitions();
            const cards2 = manager.getCardDefinitions();

            expect(cards1).not.toBe(cards2); // Different instances
            expect(cards1.size).toBe(cards2.size); // Same content
        });
    });
});
