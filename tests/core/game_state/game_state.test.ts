import { GameState } from '../../../src/core/game_state/game_state';
import { Player } from '../../../src/core/game_state/player';
import { Zone } from '../../../src/core/game_state/zone';
import { CardInstance } from '../../../src/core/game_state/card_instance';

describe('GameState', () => {
  let player1: Player;
  let player2: Player;
  let gameState: GameState;

  beforeEach(() => {
    player1 = new Player('player1');
    player2 = new Player('player2');
    gameState = new GameState(player1, player2);
  });

  it('should create a game state with initial values', () => {
    expect(gameState.players.size).toBe(2);
    expect(gameState.zones.size).toBe(11); // 5 zones per player + 1 stack zone
    expect(gameState.cardInstances.size).toBe(0);
    expect(gameState.activePlayerId).toBe('player1');
    expect(gameState.priorityPlayerId).toBe('player1');
    expect(gameState.turn).toBe(1);
    expect(gameState.phase).toBe('Beginning');
    expect(gameState.step).toBe('Untap');
    expect(gameState.stackZoneId).toBe('stack');
  });

  it('should have players in the players map', () => {
    const retrievedPlayer1 = gameState.getPlayer('player1');
    const retrievedPlayer2 = gameState.getPlayer('player2');
    
    expect(retrievedPlayer1).toBeDefined();
    expect(retrievedPlayer2).toBeDefined();
    expect(retrievedPlayer1?.id).toBe('player1');
    expect(retrievedPlayer2?.id).toBe('player2');
  });

  it('should have all player zones in the zones map', () => {
    // Player 1 zones
    expect(gameState.getZone('hand_player1')).toBeDefined();
    expect(gameState.getZone('library_player1')).toBeDefined();
    expect(gameState.getZone('graveyard_player1')).toBeDefined();
    expect(gameState.getZone('exile_player1')).toBeDefined();
    expect(gameState.getZone('battlefield_player1')).toBeDefined();
    
    // Player 2 zones
    expect(gameState.getZone('hand_player2')).toBeDefined();
    expect(gameState.getZone('library_player2')).toBeDefined();
    expect(gameState.getZone('graveyard_player2')).toBeDefined();
    expect(gameState.getZone('exile_player2')).toBeDefined();
    expect(gameState.getZone('battlefield_player2')).toBeDefined();
    
    // Stack zone
    expect(gameState.getZone('stack')).toBeDefined();
  });

  it('should return undefined for non-existent entities', () => {
    expect(gameState.getPlayer('nonexistent')).toBeUndefined();
    expect(gameState.getZone('nonexistent')).toBeUndefined();
    expect(gameState.getCardInstance('nonexistent')).toBeUndefined();
  });

  it('should properly initialize zone properties', () => {
    const handZone = gameState.getZone('hand_player1');
    expect(handZone?.name).toBe('Hand');
    expect(handZone?.ownerPlayerId).toBe('player1');
    expect(handZone?.cards).toEqual([]);
  });
});