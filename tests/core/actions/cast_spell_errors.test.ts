import { canCastSpell, executeCastSpell } from '../../../src/core/actions/cast_spell';
import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../../../src/core/game_state/interfaces';
import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { CardInstance } from '../../../src/core/game_state/card_instance';
import { Phase } from '../../../src/core/rules/turn_manager';
import { GameError, ErrorCode } from '../../../src/core/errors';

describe('Cast Spell Error Handling', () => {
    let gameState: IGameState;
    let player1: IPlayer;
    let player2: IPlayer;
    let cardInstance: ICardInstance;
    let lightningBolt: ICardDefinition;

    beforeEach(() => {
        // Create players
        player1 = new Player('player1');
        player2 = new Player('player2');

        // Create zones
        const zones = new Map<string, IZone>();
        const p1HandZone = new Zone(player1.handZoneId, 'Hand', player1.id);
        const p1BattlefieldZone = new Zone(player1.battlefieldZoneId, 'Battlefield', player1.id);
        const stackZone = new Zone('stack', 'Stack', 'game');

        zones.set(p1HandZone.id, p1HandZone);
        zones.set(p1BattlefieldZone.id, p1BattlefieldZone);
        zones.set(stackZone.id, stackZone);

        // Create Lightning Bolt card definition
        lightningBolt = {
            id: 'lightning-bolt',
            name: 'Lightning Bolt',
            manaCost: '{R}',
            types: ['Instant'],
            oracleText: 'Lightning Bolt deals 3 damage to any target.'
        };

        // Create game state first with minimal ability registry
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
            phase: Phase.PreCombatMain,
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

        // Create card instance in hand - need game state for constructor
        cardInstance = new CardInstance('card1', lightningBolt, player1.id, player1.id, p1HandZone.id, gameState);
        p1HandZone.cards.push(cardInstance.id);
        gameState.cardInstances.set('card1', cardInstance);

        // Set up mana pool with no red mana
        player1.manaPool = {
            W: 1, U: 1, B: 1, R: 0, G: 1, C: 0, generic: 2
        };
    });

    describe('canCastSpell error handling', () => {
        it('should throw NOT_ENOUGH_MANA error with detailed information', () => {
            expect(() => {
                canCastSpell(gameState, 'player1', 'card1');
            }).toThrow(GameError);

            try {
                canCastSpell(gameState, 'player1', 'card1');
            } catch (error) {
                expect(error).toBeInstanceOf(GameError);
                const gameError = error as GameError;
                expect(gameError.code).toBe(ErrorCode.NotEnoughMana);
                expect(gameError.message).toContain('Lightning Bolt');
                expect(gameError.suggestion).toContain('{R}');
                expect(gameError.context).toMatchObject({
                    cardName: 'Lightning Bolt',
                    manaCost: '{R}',
                    availableMana: player1.manaPool,
                    missingMana: expect.stringContaining('Red')
                });
            }
        });

        it('should throw NOT_YOUR_TURN error when not active player', () => {
            gameState.activePlayerId = 'player2';

            expect(() => {
                canCastSpell(gameState, 'player1', 'card1');
            }).toThrow(GameError);

            try {
                canCastSpell(gameState, 'player1', 'card1');
            } catch (error) {
                const gameError = error as GameError;
                expect(gameError.code).toBe(ErrorCode.NotYourTurn);
                expect(gameError.message).toBe('You can only cast spells on your own turn');
                expect(gameError.context?.currentPlayer).toBe('player1');
                expect(gameError.context?.activePlayer).toBe('player2');
            }
        });

        it('should throw GAME_PHASE_RESTRICTION error during combat', () => {
            gameState.phase = Phase.Combat;
            // Give player enough mana
            player1.manaPool.R = 1;

            expect(() => {
                canCastSpell(gameState, 'player1', 'card1');
            }).toThrow(GameError);

            try {
                canCastSpell(gameState, 'player1', 'card1');
            } catch (error) {
                const gameError = error as GameError;
                expect(gameError.code).toBe(ErrorCode.GamePhaseRestriction);
                expect(gameError.message).toContain('Cannot cast spells during');
                expect(gameError.context?.currentPhase).toBe(Phase.Combat);
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
