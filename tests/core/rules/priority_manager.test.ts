import { PriorityManager } from '../../../src/core/rules/priority_manager';
import { IGameState } from '../../../src/core/game_state/interfaces';
import { Player } from '../../../src/core/game_state/player';

describe('PriorityManager', () => {
  let priorityManager: PriorityManager;
  let gameState: IGameState;

  beforeEach(() => {
    priorityManager = new PriorityManager();
    
    // Create a basic game state for testing
    const player1 = new Player('player1');
    const player2 = new Player('player2');
    
    gameState = {
      players: new Map([
        [player1.id, player1],
        [player2.id, player2]
      ]),
      zones: new Map(),
      cardInstances: new Map(),
      cardDefinitions: new Map(),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Beginning',
      step: 'Untap',
      stackZoneId: 'stack',
      abilityRegistry: {} as any
    };
  });

  it('should pass priority from active player to non-active player', () => {
    const newState = priorityManager.passPriority(gameState);
    
    expect(newState.priorityPlayerId).toBe('player2');
    // Other properties should remain unchanged
    expect(newState.activePlayerId).toBe('player1');
    expect(newState.turn).toBe(1);
    expect(newState.phase).toBe('Beginning');
    expect(newState.step).toBe('Untap');
  });

  it('should pass priority from non-active player back to active player', () => {
    gameState.priorityPlayerId = 'player2';
    
    const newState = priorityManager.passPriority(gameState);
    
    expect(newState.priorityPlayerId).toBe('player1');
  });

  it('should set priority to the active player', () => {
    gameState.priorityPlayerId = 'player2'; // Non-active player has priority
    
    const newState = priorityManager.setActivePlayerPriority(gameState);
    
    expect(newState.priorityPlayerId).toBe('player1'); // Should be set to active player
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should work with more than two players', () => {
    // Add a third player
    const player3 = new Player('player3');
    gameState.players.set(player3.id, player3);
    gameState.priorityPlayerId = 'player1';
    
    // Pass priority - should go to player2
    let newState = priorityManager.passPriority(gameState);
    expect(newState.priorityPlayerId).toBe('player2');
    
    // Pass priority again - should go to player3
    newState = priorityManager.passPriority(newState);
    expect(newState.priorityPlayerId).toBe('player3');
    
    // Pass priority again - should cycle back to player1
    newState = priorityManager.passPriority(newState);
    expect(newState.priorityPlayerId).toBe('player1');
  });
});