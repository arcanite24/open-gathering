import { calculateCost, canPayCost, payCost, canCastSpell, executeCastSpell } from '../../../src/core/actions/cast_spell';
import { IGameState, IPlayer, IZone, ICardInstance, ManaPool } from '../../../src/core/game_state/interfaces';
import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { CardInstance } from '../../../src/core/game_state/card_instance';
import { Phase } from '../../../src/core/rules/turn_manager';
import { AbilityRegistry, initializeAbilityRegistry } from '../../../src/core/abilities/registry';

describe('Cast Spell Action - Mana Cost Functions', () => {
  describe('calculateCost', () => {
    it('should calculate cost for simple colored mana', () => {
      const cost = calculateCost('{W}{U}{B}{R}{G}');
      expect(cost).toEqual({
        W: 1,
        U: 1,
        B: 1,
        R: 1,
        G: 1,
        C: 0,
        generic: 0
      });
    });

    it('should calculate cost with generic mana', () => {
      const cost = calculateCost('{2}{W}{W}');
      expect(cost).toEqual({
        W: 2,
        U: 0,
        B: 0,
        R: 0,
        G: 0,
        C: 0,
        generic: 2
      });
    });

    it('should calculate cost with colorless mana', () => {
      const cost = calculateCost('{1}{C}{C}');
      expect(cost).toEqual({
        W: 0,
        U: 0,
        B: 0,
        R: 0,
        G: 0,
        C: 2,
        generic: 1
      });
    });
  });

  describe('canPayCost', () => {
    let player: IPlayer;

    beforeEach(() => {
      player = new Player('player1');
      player.manaPool = {
        W: 2,
        U: 1,
        B: 0,
        R: 1,
        G: 0,
        C: 1,
        generic: 2
      };
    });

    it('should return true when player can pay the cost', () => {
      // Cost: {1}{W}{U} = 1 generic + 1 white + 1 blue
      const cost = {
        W: 1,
        U: 1,
        B: 0,
        R: 0,
        G: 0,
        C: 0,
        generic: 1
      };

      expect(canPayCost(player, cost)).toBe(true);
    });

    it('should return false when player cannot pay the cost', () => {
      // Cost: {3}{B}{B} = 3 generic + 2 black (player has 0 black)
      const cost = {
        W: 0,
        U: 0,
        B: 2,
        R: 0,
        G: 0,
        C: 0,
        generic: 3
      };

      expect(canPayCost(player, cost)).toBe(false);
    });
  });

  describe('payCost', () => {
    let player: IPlayer;

    beforeEach(() => {
      player = new Player('player1');
      player.manaPool = {
        W: 2,
        U: 1,
        B: 0,
        R: 1,
        G: 0,
        C: 1,
        generic: 2
      };
    });

    it('should correctly deduct mana from the player\'s pool', () => {
      // Cost: {1}{W}{U} = 1 generic + 1 white + 1 blue
      const cost = {
        W: 1,
        U: 1,
        B: 0,
        R: 0,
        G: 0,
        C: 0,
        generic: 1
      };

      const updatedPlayer = payCost(player, cost);

      expect(updatedPlayer.manaPool.W).toBe(1);  // 2 - 1
      expect(updatedPlayer.manaPool.U).toBe(0);  // 1 - 1
      expect(updatedPlayer.manaPool.generic).toBe(1);  // 2 - 1
      // Other colors should remain unchanged
      expect(updatedPlayer.manaPool.B).toBe(0);
      expect(updatedPlayer.manaPool.R).toBe(1);
      expect(updatedPlayer.manaPool.G).toBe(0);
      expect(updatedPlayer.manaPool.C).toBe(1);
    });
  });
});

describe('Cast Spell Action - Game State Functions', () => {
  let gameState: IGameState;
  let player1: Player;
  let player2: Player;
  let handZone: Zone;
  let stackZone: Zone;
  let creatureCard: CardInstance;

  beforeEach(() => {
    // Set up players
    player1 = new Player('player1');
    player2 = new Player('player2');

    // Set up zones
    handZone = new Zone(player1.handZoneId, 'Hand', player1.id);
    stackZone = new Zone('stack', 'Stack', 'game');

    // Set up game state first
    gameState = {
      players: new Map([
        [player1.id, player1],
        [player2.id, player2]
      ]),
      zones: new Map([
        [handZone.id, handZone],
        [stackZone.id, stackZone]
      ]),
      cardInstances: new Map(),
      activePlayerId: player1.id,
      priorityPlayerId: player1.id,
      turn: 1,
      phase: Phase.PreCombatMain,
      step: '',
      stackZoneId: stackZone.id,
      cardDefinitions: new Map(),
      abilityRegistry: initializeAbilityRegistry()
    };

    // Set up a creature card
    const creatureDefinition = {
      id: 'grizzly_bears',
      name: 'Grizzly Bears',
      cmc: 2,
      types: ['Creature'],
      subtypes: ['Bear'],
      supertypes: [],
      manaCost: '{1}{G}',
      oracleText: 'A 2/2 bear creature.',
      power: '2',
      toughness: '2'
    };
    gameState.cardDefinitions.set(creatureDefinition.id, creatureDefinition);

    creatureCard = new CardInstance('creature1', creatureDefinition, player1.id, player1.id, handZone.id, gameState);
    gameState.cardInstances.set(creatureCard.id, creatureCard);

    // Add the creature card to the hand zone
    handZone.cards.push(creatureCard.id);
  });

  describe('canCastSpell', () => {
    it('should allow casting a creature during the player\'s main phase', () => {
      const result = canCastSpell(gameState, player1.id, creatureCard.id);
      expect(result).toBe(true);
    });

    it('should not allow casting a creature during another player\'s turn', () => {
      gameState.activePlayerId = player2.id;
      const result = canCastSpell(gameState, player1.id, creatureCard.id);
      expect(result).toBe(false);
    });

    it('should not allow casting a creature outside of main phases', () => {
      gameState.phase = Phase.Combat;
      const result = canCastSpell(gameState, player1.id, creatureCard.id);
      expect(result).toBe(false);
    });

    it('should not allow casting a creature without priority', () => {
      gameState.priorityPlayerId = player2.id;
      const result = canCastSpell(gameState, player1.id, creatureCard.id);
      expect(result).toBe(false);
    });

    it('should not allow casting a creature not in hand', () => {
      // Remove the card from hand
      handZone.cards = [];
      const result = canCastSpell(gameState, player1.id, creatureCard.id);
      expect(result).toBe(false);
    });

    it('should not allow casting a creature that doesn\'t exist', () => {
      const result = canCastSpell(gameState, player1.id, 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('executeCastSpell', () => {
    it('should move a creature from hand to stack', () => {
      const newState = executeCastSpell(gameState, player1.id, creatureCard.id);

      // Check that the card is no longer in hand
      const newHandZone = newState.zones.get(handZone.id);
      expect(newHandZone?.cards).not.toContain(creatureCard.id);

      // Check that the card is now on the stack
      const newStackZone = newState.zones.get(stackZone.id);
      expect(newStackZone?.cards).toContain(creatureCard.id);

      // Check that the card's zone has been updated
      const newCardInstance = newState.cardInstances.get(creatureCard.id);
      expect(newCardInstance?.currentZoneId).toBe(stackZone.id);
    });

    it('should not modify state when casting an invalid spell', () => {
      // Make it so the player doesn't have priority
      gameState.priorityPlayerId = player2.id;

      const newState = executeCastSpell(gameState, player1.id, creatureCard.id);

      // State should be unchanged
      expect(newState).toEqual(gameState);
    });
  });
});