import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { CardInstance } from '../../../src/core/game_state/card_instance';

describe('Player', () => {
  it('should create a player with default values', () => {
    const player = new Player('player1');
    
    expect(player.id).toBe('player1');
    expect(player.life).toBe(20);
    expect(player.manaPool).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 });
    expect(player.handZoneId).toBe('hand_player1');
    expect(player.libraryZoneId).toBe('library_player1');
    expect(player.graveyardZoneId).toBe('graveyard_player1');
    expect(player.exileZoneId).toBe('exile_player1');
    expect(player.battlefieldZoneId).toBe('battlefield_player1');
    expect(player.landsPlayedThisTurn).toBe(0);
  });

  it('should create a player with custom life total', () => {
    const player = new Player('player1', 30);
    
    expect(player.life).toBe(30);
  });
});

describe('Zone', () => {
  let zone: Zone;

  beforeEach(() => {
    zone = new Zone('zone1', 'Hand', 'player1');
  });

  it('should create a zone with initial values', () => {
    expect(zone.id).toBe('zone1');
    expect(zone.name).toBe('Hand');
    expect(zone.ownerPlayerId).toBe('player1');
    expect(zone.cards).toEqual([]);
  });

  it('should add a card to the zone', () => {
    zone.addCard('card1');
    
    expect(zone.cards).toEqual(['card1']);
  });

  it('should not add duplicate cards to the zone', () => {
    zone.addCard('card1');
    zone.addCard('card1');
    
    expect(zone.cards).toEqual(['card1']);
  });

  it('should remove a card from the zone', () => {
    zone.addCard('card1');
    zone.addCard('card2');
    
    const result = zone.removeCard('card1');
    
    expect(result).toBe(true);
    expect(zone.cards).toEqual(['card2']);
  });

  it('should return false when trying to remove a non-existent card', () => {
    const result = zone.removeCard('card1');
    
    expect(result).toBe(false);
    expect(zone.cards).toEqual([]);
  });
});

describe('CardInstance', () => {
  it('should create a card instance with initial values', () => {
    const cardInstance = new CardInstance(
      'instance1',
      'card1',
      'player1',
      'player1',
      'hand_player1'
    );
    
    expect(cardInstance.id).toBe('instance1');
    expect(cardInstance.definitionId).toBe('card1');
    expect(cardInstance.ownerPlayerId).toBe('player1');
    expect(cardInstance.controllerPlayerId).toBe('player1');
    expect(cardInstance.currentZoneId).toBe('hand_player1');
    expect(cardInstance.isTapped).toBe(false);
    expect(cardInstance.damageMarked).toBe(0);
    expect(cardInstance.counters).toEqual(new Map());
    expect(cardInstance.staticAbilities).toEqual([]);
    expect(cardInstance.triggeredAbilities).toEqual([]);
    expect(cardInstance.activatedAbilities).toEqual([]);
  });
});