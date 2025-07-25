import { Engine, Action } from '../../src/core/engine';
import { IGameState } from '../../src/core/game_state/interfaces';
import { ICardDefinition } from '../../src/core/game_state/interfaces';

describe('Engine', () => {
  let engine: Engine;
  let basicLand: ICardDefinition;
  let player1Deck: ICardDefinition[];
  let player2Deck: ICardDefinition[];

  beforeEach(() => {
    engine = new Engine();
    
    // Create a basic land card definition for testing
    basicLand = {
      id: 'basic_plains',
      name: 'Plains',
      types: ['Land'],
      abilities: [
        {
          key: 'inherent_ability_tap_add_mana',
          parameters: { mana: '{W}' }
        }
      ]
    };
    
    // Create decks with 8 cards each (7 for hand + 1 for library)
    player1Deck = Array(8).fill(basicLand);
    player2Deck = Array(8).fill(basicLand);
  });

  it('should initialize a new game', () => {
    engine.startGame(player1Deck, player2Deck);
    
    const state = engine.getState();
    
    // Check players
    expect(state.players.size).toBe(2);
    expect(state.players.has('player1')).toBe(true);
    expect(state.players.has('player2')).toBe(true);
    
    // Check zones
    expect(state.zones.size).toBe(11); // 5 zones per player + 1 stack
    
    // Check that players have initial hands (7 cards each)
    const player1 = state.players.get('player1');
    const player2 = state.players.get('player2');
    
    if (player1 && player2) {
      const p1HandZone = state.zones.get(player1.handZoneId);
      const p2HandZone = state.zones.get(player2.handZoneId);
      
      expect(p1HandZone?.cards.length).toBe(7);
      expect(p2HandZone?.cards.length).toBe(7);
    }
    
    // Check that libraries have the remaining cards (1 card each)
    if (player1 && player2) {
      const p1LibraryZone = state.zones.get(player1.libraryZoneId);
      const p2LibraryZone = state.zones.get(player2.libraryZoneId);
      
      expect(p1LibraryZone?.cards.length).toBe(1);
      expect(p2LibraryZone?.cards.length).toBe(1);
    }
  });

  it('should handle pass priority action', () => {
    engine.startGame(player1Deck, player2Deck);
    
    // Initially player1 should have priority
    expect(engine.getState().priorityPlayerId).toBe('player1');
    
    // Player1 passes priority
    engine.submitAction('player1', { type: 'PASS_PRIORITY' });
    
    // Now player2 should have priority
    expect(engine.getState().priorityPlayerId).toBe('player2');
    
    // Player2 passes priority
    engine.submitAction('player2', { type: 'PASS_PRIORITY' });
    
    // Now player1 should have priority again
    expect(engine.getState().priorityPlayerId).toBe('player1');
  });

  it('should handle advance turn action', () => {
    engine.startGame(player1Deck, player2Deck);
    
    // Initially should be turn 1, beginning phase
    let state = engine.getState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('Beginning');
    expect(state.step).toBe('Untap');
    
    // Advance the turn
    engine.submitAction('player1', { type: 'ADVANCE_TURN' });
    
    // Should now be in upkeep step
    state = engine.getState();
    expect(state.phase).toBe('Beginning');
    expect(state.step).toBe('Upkeep');
  });
});