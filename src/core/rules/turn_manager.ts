import { IGameState } from '../game_state/interfaces';

// Define enums for Phases and Steps
export enum Phase {
  Beginning = 'Beginning',
  PreCombatMain = 'PreCombatMain',
  Combat = 'Combat',
  PostCombatMain = 'PostCombatMain',
  Ending = 'Ending'
}

export enum Step {
  Untap = 'Untap',
  Upkeep = 'Upkeep',
  Draw = 'Draw',
  BeginCombat = 'BeginCombat',
  DeclareAttackers = 'DeclareAttackers',
  DeclareBlockers = 'DeclareBlockers',
  CombatDamage = 'CombatDamage',
  EndCombat = 'EndCombat',
  EndStep = 'EndStep',
  Cleanup = 'Cleanup'
}

/**
 * Manages the turn structure and phase progression in the game.
 */
export class TurnManager {
  /**
   * Advances the game to the next step/phase according to MTG rules.
   * @param gameState The current game state
   * @returns The updated game state
   */
  advance(gameState: IGameState): IGameState {
    // Create a copy of the game state to avoid mutating the original
    const newState = this.copyGameState(gameState);
    
    // Determine the next step/phase
    switch (newState.phase) {
      case Phase.Beginning:
        switch (newState.step) {
          case Step.Untap:
            newState.step = Step.Upkeep;
            break;
          case Step.Upkeep:
            newState.step = Step.Draw;
            break;
          case Step.Draw:
            newState.phase = Phase.PreCombatMain;
            newState.step = ''; // Main phase doesn't have specific steps in this implementation
            break;
        }
        break;
        
      case Phase.PreCombatMain:
        newState.phase = Phase.Combat;
        newState.step = Step.BeginCombat;
        break;
        
      case Phase.Combat:
        switch (newState.step) {
          case Step.BeginCombat:
            newState.step = Step.DeclareAttackers;
            break;
          case Step.DeclareAttackers:
            newState.step = Step.DeclareBlockers;
            break;
          case Step.DeclareBlockers:
            newState.step = Step.CombatDamage;
            break;
          case Step.CombatDamage:
            newState.step = Step.EndCombat;
            break;
          case Step.EndCombat:
            newState.phase = Phase.PostCombatMain;
            newState.step = ''; // Main phase doesn't have specific steps in this implementation
            break;
        }
        break;
        
      case Phase.PostCombatMain:
        newState.phase = Phase.Ending;
        newState.step = Step.EndStep;
        break;
        
      case Phase.Ending:
        switch (newState.step) {
          case Step.EndStep:
            newState.step = Step.Cleanup;
            break;
          case Step.Cleanup:
            // End of turn - move to next player's turn
            newState.turn += 1;
            newState.phase = Phase.Beginning;
            newState.step = Step.Untap;
            // Switch active player (assuming 2 players)
            const playerIds = Array.from(newState.players.keys());
            const currentIndex = playerIds.indexOf(newState.activePlayerId);
            newState.activePlayerId = playerIds[(currentIndex + 1) % playerIds.length];
            newState.priorityPlayerId = newState.activePlayerId;
            break;
        }
        break;
    }
    
    return newState;
  }
  
  /**
   * Creates a shallow copy of the game state.
   * @param gameState The game state to copy
   * @returns A new game state object with the same properties
   */
  private copyGameState(gameState: IGameState): IGameState {
    return {
      players: new Map(gameState.players),
      zones: new Map(gameState.zones),
      cardInstances: new Map(gameState.cardInstances),
      activePlayerId: gameState.activePlayerId,
      priorityPlayerId: gameState.priorityPlayerId,
      turn: gameState.turn,
      phase: gameState.phase,
      step: gameState.step,
      stackZoneId: gameState.stackZoneId
    };
  }
}