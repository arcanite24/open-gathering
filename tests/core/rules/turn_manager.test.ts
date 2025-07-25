import { TurnManager, Phase, Step } from '../../../src/core/rules/turn_manager';
import { IGameState } from '../../../src/core/game_state/interfaces';
import { Player } from '../../../src/core/game_state/player';

describe('TurnManager', () => {
  let turnManager: TurnManager;
  let gameState: IGameState;

  beforeEach(() => {
    turnManager = new TurnManager();
    
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
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: Phase.Beginning,
      step: Step.Untap,
      stackZoneId: 'stack'
    };
  });

  it('should advance from Untap step to Upkeep step', () => {
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Beginning);
    expect(newState.step).toBe(Step.Upkeep);
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance from Upkeep step to Draw step', () => {
    gameState.step = Step.Upkeep;
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Beginning);
    expect(newState.step).toBe(Step.Draw);
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance from Draw step to PreCombatMain phase', () => {
    gameState.step = Step.Draw;
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.PreCombatMain);
    expect(newState.step).toBe('');
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance from PreCombatMain phase to Combat phase', () => {
    gameState.phase = Phase.PreCombatMain;
    gameState.step = '';
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Combat);
    expect(newState.step).toBe(Step.BeginCombat);
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance through all combat steps', () => {
    gameState.phase = Phase.Combat;
    gameState.step = Step.BeginCombat;
    
    // BeginCombat -> DeclareAttackers
    let newState = turnManager.advance(gameState);
    expect(newState.step).toBe(Step.DeclareAttackers);
    
    // DeclareAttackers -> DeclareBlockers
    newState = turnManager.advance(newState);
    expect(newState.step).toBe(Step.DeclareBlockers);
    
    // DeclareBlockers -> CombatDamage
    newState = turnManager.advance(newState);
    expect(newState.step).toBe(Step.CombatDamage);
    
    // CombatDamage -> EndCombat
    newState = turnManager.advance(newState);
    expect(newState.step).toBe(Step.EndCombat);
  });

  it('should advance from EndCombat step to PostCombatMain phase', () => {
    gameState.phase = Phase.Combat;
    gameState.step = Step.EndCombat;
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.PostCombatMain);
    expect(newState.step).toBe('');
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance from PostCombatMain phase to Ending phase', () => {
    gameState.phase = Phase.PostCombatMain;
    gameState.step = '';
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Ending);
    expect(newState.step).toBe(Step.EndStep);
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance from EndStep to Cleanup', () => {
    gameState.phase = Phase.Ending;
    gameState.step = Step.EndStep;
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Ending);
    expect(newState.step).toBe(Step.Cleanup);
    expect(newState.turn).toBe(1);
    expect(newState.activePlayerId).toBe('player1');
  });

  it('should advance to next turn after Cleanup', () => {
    gameState.phase = Phase.Ending;
    gameState.step = Step.Cleanup;
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Beginning);
    expect(newState.step).toBe(Step.Untap);
    expect(newState.turn).toBe(2);
    expect(newState.activePlayerId).toBe('player2');
    expect(newState.priorityPlayerId).toBe('player2');
  });

  it('should cycle back to first player after second players turn', () => {
    gameState.phase = Phase.Ending;
    gameState.step = Step.Cleanup;
    gameState.turn = 2;
    gameState.activePlayerId = 'player2';
    gameState.priorityPlayerId = 'player2';
    
    const newState = turnManager.advance(gameState);
    
    expect(newState.phase).toBe(Phase.Beginning);
    expect(newState.step).toBe(Step.Untap);
    expect(newState.turn).toBe(3);
    expect(newState.activePlayerId).toBe('player1');
    expect(newState.priorityPlayerId).toBe('player1');
  });
});