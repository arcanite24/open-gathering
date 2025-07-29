import { GameSessionManager } from '../../src/server/game_session_manager';
import * as path from 'path';

describe('GameSessionManager', () => {
    let manager: GameSessionManager;

    beforeEach(() => {
        // Use the actual data directory for testing
        const dataDir = path.join(__dirname, '../../data');
        manager = new GameSessionManager(dataDir);
    });

    describe('createGame with deck definitions', () => {
        it('should create a game with valid deck IDs', () => {
            const session = manager.createGame('sample_deck_1', 'sample_deck_2');

            expect(session).toBeDefined();
            expect(session.id).toMatch(/^game_\d+_[a-z0-9]+$/);
            expect(session.engine).toBeDefined();
            expect(session.status).toBe('active');
            expect(session.playerIds).toEqual(['player1', 'player2']);
        });

        it('should throw error for non-existent deck ID', () => {
            expect(() => {
                manager.createGame('non_existent_deck', 'sample_deck_1');
            }).toThrow("Deck with ID 'non_existent_deck' not found");
        });
    });

    describe('getDeckDefinitions', () => {
        it('should return available deck definitions', () => {
            const decks = manager.getDeckDefinitions();

            expect(decks.size).toBeGreaterThanOrEqual(2); // We created at least 2 sample decks

            const sampleDeck1 = decks.get('sample_deck_1');
            expect(sampleDeck1).toBeDefined();
            expect(sampleDeck1?.id).toBe('sample_deck_1');
            expect(sampleDeck1?.name).toBe('Sample Deck 1');
            expect(sampleDeck1?.cardIds).toBeDefined();
            expect(Array.isArray(sampleDeck1?.cardIds)).toBe(true);
        });
    });

    describe('reloadDeckDefinitions', () => {
        it('should reload deck definitions', () => {
            // Get initial count
            const initialCount = manager.getDeckDefinitions().size;

            // Reload (should not change count in this case)
            manager.reloadDeckDefinitions();

            const afterReloadCount = manager.getDeckDefinitions().size;
            expect(afterReloadCount).toBe(initialCount);
        });
    });
});
