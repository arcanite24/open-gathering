import { canCastSpell, executeCastSpell } from '../../src/core/actions/cast_spell';
import { GameError, ErrorCode } from '../../src/core/errors';
import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../../src/core/game_state/interfaces';
import { Player } from '../../src/core/game_state/player';
import { Zone } from '../../src/core/game_state/zone';
import { CardInstance } from '../../src/core/game_state/card_instance';
import { Phase } from '../../src/core/rules/turn_manager';

describe('Error Reporting Integration Tests', () => {
    let gameState: IGameState;
    let player1: IPlayer;
    let player2: IPlayer;
    let lightningBolt: ICardDefinition;
    let cardInstance: ICardInstance;

    beforeEach(() => {
        // Create players
        player1 = new Player('player1');
        player2 = new Player('player2');

        // Create zones
        const zones = new Map<string, IZone>();
        const p1HandZone = new Zone(player1.handZoneId, 'Hand', player1.id);
        const stackZone = new Zone('stack', 'Stack', 'game');

        zones.set(p1HandZone.id, p1HandZone);
        zones.set(stackZone.id, stackZone);

        // Create Lightning Bolt card definition
        lightningBolt = {
            id: 'lightning-bolt',
            name: 'Lightning Bolt',
            manaCost: '{R}',
            types: ['Instant'],
            oracleText: 'Lightning Bolt deals 3 damage to any target.'
        };

        // Set up initial game state in main phase
        gameState = {
            players: new Map([
                ['player1', player1],
                ['player2', player2]
            ]),
            zones,
            cardInstances: new Map(),
            activePlayerId: 'player1',
            priorityPlayerId: 'player1',
            turn: 1,
            phase: Phase.PreCombatMain, // Set to main phase so spells can be cast
            step: 'Pre-Combat Main',
            stackZoneId: 'stack',
            cardDefinitions: new Map([
                ['lightning-bolt', lightningBolt]
            ]),
            abilityRegistry: {
                registry: new Map(),
                registerAbility: () => { },
                createAbilityInstance: () => null,
                isRegistered: () => false
            } as any
        };

        // Create card instance in hand
        cardInstance = new CardInstance('card1', lightningBolt, player1.id, player1.id, p1HandZone.id, gameState);
        p1HandZone.cards.push(cardInstance.id);
        gameState.cardInstances.set('card1', cardInstance);

        // Set up mana pool with no red mana (to trigger mana error)
        player1.manaPool = {
            W: 1, U: 1, B: 1, R: 0, G: 1, C: 0, generic: 2
        };
    });

    describe('Spell Casting Error Reporting', () => {
        it('should provide detailed error when trying to cast spell without enough mana', () => {
            // Try to cast without mana - should get detailed error
            try {
                canCastSpell(gameState, 'player1', 'card1');
                fail('Expected GameError to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(GameError);
                const gameError = error as GameError;

                expect(gameError.code).toBe(ErrorCode.NotEnoughMana);
                expect(gameError.message).toContain('Lightning Bolt');
                expect(gameError.suggestion).toContain('{R}');
                expect(gameError.context).toMatchObject({
                    cardName: 'Lightning Bolt',
                    manaCost: '{R}',
                    missingMana: expect.stringContaining('Red')
                });
            }
        });

        it('should provide clear error when trying to cast on wrong turn', () => {
            // Set up game state where it's not player1's turn
            gameState.activePlayerId = 'player2';

            // Try to cast on wrong turn - should get clear error
            try {
                canCastSpell(gameState, 'player1', 'card1');
                fail('Expected GameError to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(GameError);
                const gameError = error as GameError;

                expect(gameError.code).toBe(ErrorCode.NotYourTurn);
                expect(gameError.message).toBe('You can only cast spells on your own turn');
                expect(gameError.suggestion).toContain('Wait for your turn');
                expect(gameError.context?.currentPlayer).toBe('player1');
                expect(gameError.context?.activePlayer).toBe('player2');
            }
        });

        it('should provide clear error when trying to cast without priority', () => {
            // Set up game state where player1 doesn't have priority
            gameState.priorityPlayerId = 'player2';
            // Give player enough mana so we get the priority error, not mana error
            player1.manaPool.R = 1;

            try {
                canCastSpell(gameState, 'player1', 'card1');
                fail('Expected GameError to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(GameError);
                const gameError = error as GameError;

                expect(gameError.code).toBe(ErrorCode.NotPriorityPlayer);
                expect(gameError.message).toBe('You do not have priority');
                expect(gameError.suggestion).toContain('Wait for priority');
                expect(gameError.context?.currentPlayer).toBe('player1');
                expect(gameError.context?.priorityPlayer).toBe('player2');
            }
        });
    });

    describe('Error Display Formatting', () => {
        it('should format errors with contextual information', () => {
            // Try to trigger mana error
            try {
                canCastSpell(gameState, 'player1', 'card1');
                fail('Expected GameError to be thrown');
            } catch (error) {
                const gameError = error as GameError;
                const displayString = gameError.toDisplayString();

                // Should include message, suggestion, and context
                expect(displayString).toContain('Not enough mana to cast Lightning Bolt');
                expect(displayString).toContain('💡 Suggestion:');
                expect(displayString).toContain('📝 Context:');
                expect(displayString).toContain('cardName: Lightning Bolt');
                expect(displayString).toContain('manaCost: {R}');
                expect(displayString).toContain('missingMana:');
            }
        });

        it('should successfully cast spell when all conditions are met', () => {
            // Give player enough mana
            player1.manaPool.R = 1;

            const newState = executeCastSpell(gameState, 'player1', 'card1');

            // Card should be moved to stack
            const handZone = newState.zones.get(player1.handZoneId)!;
            const stackZone = newState.zones.get('stack')!;

            expect(handZone.cards).not.toContain('card1');
            expect(stackZone.cards).toContain('card1');

            // Mana should be paid
            const updatedPlayer = newState.players.get('player1')!;
            expect(updatedPlayer.manaPool.R).toBe(0);
        });
    });
});
