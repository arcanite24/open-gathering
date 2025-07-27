import { canPlayLand, executePlayLand } from '../../../src/core/actions/play_land';
import { IGameState, IPlayer, IZone, ICardInstance } from '../../../src/core/game_state/interfaces';
import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { CardInstance } from '../../../src/core/game_state/card_instance';
import { Phase, Step } from '../../../src/core/rules/turn_manager';
import { initializeAbilityRegistry } from '../../../src/core/abilities/registry';

describe('Play Land Action', () => {
  let gameState: IGameState;
  let player1: Player;
  let player2: Player;
  let handZone: Zone;
  let battlefieldZone: Zone;
  let landCard: CardInstance;

  beforeEach(() => {
    // Set up players
    player1 = new Player('player1');
    player2 = new Player('player2');

    // Set up zones
    handZone = new Zone(player1.handZoneId, 'Hand', player1.id);
    battlefieldZone = new Zone(player1.battlefieldZoneId, 'Battlefield', player1.id);

    // Set up game state first
    gameState = {
      players: new Map([
        [player1.id, player1],
        [player2.id, player2]
      ]),
      zones: new Map([
        [handZone.id, handZone],
        [battlefieldZone.id, battlefieldZone]
      ]),
      cardInstances: new Map(),
      activePlayerId: player1.id,
      priorityPlayerId: player1.id,
      turn: 1,
      phase: Phase.PreCombatMain,
      step: '',
      stackZoneId: 'stack',
      cardDefinitions: new Map(),
      abilityRegistry: initializeAbilityRegistry()
    };

    // Set up a land card definition
    const landDefinition = {
      id: 'basic_plains',
      name: 'Plains',
      cmc: 0,
      types: ['Land'],
      subtypes: ['Plains'],
      supertypes: ['Basic'],
      manaCost: '',
      oracleText: 'Tap: Add W.',
      power: '',
      toughness: ''
    };
    gameState.cardDefinitions.set(landDefinition.id, landDefinition);

    // Set up a land card instance
    landCard = new CardInstance('land1', landDefinition, player1.id, player1.id, handZone.id, gameState);
    gameState.cardInstances.set(landCard.id, landCard);

    // Add the land card to the hand zone
    handZone.cards.push(landCard.id);
  });

  describe('canPlayLand', () => {
    it('should allow playing a land during the player\'s main phase', () => {
      const result = canPlayLand(gameState, player1.id, landCard.id);
      expect(result).toBe(true);
    });

    it('should not allow playing a land during another player\'s turn', () => {
      gameState.activePlayerId = player2.id;
      const result = canPlayLand(gameState, player1.id, landCard.id);
      expect(result).toBe(false);
    });

    it('should not allow playing a land outside of main phases', () => {
      gameState.phase = Phase.Combat;
      const result = canPlayLand(gameState, player1.id, landCard.id);
      expect(result).toBe(false);
    });

    it('should not allow playing a land without priority', () => {
      gameState.priorityPlayerId = player2.id;
      const result = canPlayLand(gameState, player1.id, landCard.id);
      expect(result).toBe(false);
    });

    it('should not allow playing a land not in hand', () => {
      // Remove the card from hand
      handZone.cards = [];
      const result = canPlayLand(gameState, player1.id, landCard.id);
      expect(result).toBe(false);
    });

    it('should not allow playing a second land in the same turn', () => {
      player1.landsPlayedThisTurn = 1;
      const result = canPlayLand(gameState, player1.id, landCard.id);
      expect(result).toBe(false);
    });

    it('should not allow playing a land that doesn\'t exist', () => {
      const result = canPlayLand(gameState, player1.id, 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('executePlayLand', () => {
    it('should move a land from hand to battlefield', () => {
      const newState = executePlayLand(gameState, player1.id, landCard.id);

      // Check that the card is no longer in hand
      const newHandZone = newState.zones.get(handZone.id);
      expect(newHandZone?.cards).not.toContain(landCard.id);

      // Check that the card is now on the battlefield
      const newBattlefieldZone = newState.zones.get(battlefieldZone.id);
      expect(newBattlefieldZone?.cards).toContain(landCard.id);

      // Check that the card's zone has been updated
      const newCardInstance = newState.cardInstances.get(landCard.id);
      expect(newCardInstance?.currentZoneId).toBe(battlefieldZone.id);

      // Check that the lands played counter has been incremented
      const newPlayer = newState.players.get(player1.id);
      expect(newPlayer?.landsPlayedThisTurn).toBe(1);
    });

    it('should not modify state when playing an invalid land', () => {
      // Make it so the player has already played a land
      player1.landsPlayedThisTurn = 1;

      const newState = executePlayLand(gameState, player1.id, landCard.id);

      // State should be unchanged
      expect(newState).toEqual(gameState);
    });
  });
})