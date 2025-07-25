import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../game_state/interfaces';
import { Phase } from '../rules/turn_manager';

/**
 * Checks if a player can play a land.
 * @param gameState The current game state
 * @param playerId The ID of the player attempting to play the land
 * @param cardInstanceId The ID of the card instance to play
 * @returns True if the player can play the land, false otherwise
 */
export function canPlayLand(gameState: IGameState, playerId: string, cardInstanceId: string): boolean {
  // Get the player
  const player = gameState.players.get(playerId);
  if (!player) {
    return false;
  }

  // Check if it's the player's turn
  if (playerId !== gameState.activePlayerId) {
    return false;
  }

  // Check if it's a main phase
  if (gameState.phase !== Phase.PreCombatMain && gameState.phase !== Phase.PostCombatMain) {
    return false;
  }

  // Check if the stack is empty (placeholder check for now)
  // In a full implementation, we'd check if there are spells/abilities on the stack
  // For now, we'll assume the stack is always empty for this action
  
  // Check if the player has priority
  if (playerId !== gameState.priorityPlayerId) {
    return false;
  }

  // Get the card instance
  const cardInstance = gameState.cardInstances.get(cardInstanceId);
  if (!cardInstance) {
    return false;
  }

  // Check if the card is in the player's hand
  const handZone = gameState.zones.get(player.handZoneId);
  if (!handZone || !handZone.cards.includes(cardInstanceId)) {
    return false;
  }

  // Check if the card is a Land type
  // This would require access to the card definition, which isn't directly available in ICardInstance
  // In a full implementation, we'd need to look up the definition from a card database
  // For now, we'll assume all cards in hand are lands for simplicity in testing
  
  // Check if the player has already played a land this turn
  if (player.landsPlayedThisTurn >= 1) {
    return false;
  }

  // If all checks pass, the player can play the land
  return true;
}

/**
 * Creates a deep copy of the game state.
 * @param gameState The game state to copy
 * @returns A new game state object with the same properties
 */
function copyGameState(gameState: IGameState): IGameState {
  // Deep copy players map
  const players = new Map<string, IPlayer>();
  gameState.players.forEach((player, id) => {
    players.set(id, { ...player });
  });

  // Deep copy zones map
  const zones = new Map<string, IZone>();
  gameState.zones.forEach((zone, id) => {
    zones.set(id, { 
      ...zone,
      cards: [...zone.cards] // Copy the cards array
    });
  });

  // Deep copy card instances map
  const cardInstances = new Map<string, ICardInstance>();
  gameState.cardInstances.forEach((card, id) => {
    cardInstances.set(id, { 
      ...card,
      counters: new Map(card.counters) // Copy the counters map
    });
  });

  // Return the new game state
  return {
    players,
    zones,
    cardInstances,
    activePlayerId: gameState.activePlayerId,
    priorityPlayerId: gameState.priorityPlayerId,
    turn: gameState.turn,
    phase: gameState.phase,
    step: gameState.step,
    stackZoneId: gameState.stackZoneId
  };
}

/**
 * Executes the play land action.
 * @param gameState The current game state
 * @param playerId The ID of the player playing the land
 * @param cardInstanceId The ID of the card instance to play
 * @returns The updated game state
 */
export function executePlayLand(gameState: IGameState, playerId: string, cardInstanceId: string): IGameState {
  // First, check if the player can play the land
  if (!canPlayLand(gameState, playerId, cardInstanceId)) {
    // In a full implementation, we might throw an error or return the same state
    // For now, we'll just return the same state
    return gameState;
  }

  // Create a copy of the game state to avoid mutating the original
  const newState = copyGameState(gameState);

  // Get the player
  const player = newState.players.get(playerId);
  if (!player) {
    return gameState;
  }

  // Get the card instance
  const cardInstance = newState.cardInstances.get(cardInstanceId);
  if (!cardInstance) {
    return gameState;
  }

  // Remove the card from the hand zone
  const handZone = newState.zones.get(player.handZoneId);
  if (handZone) {
    const index = handZone.cards.indexOf(cardInstanceId);
    if (index !== -1) {
      handZone.cards.splice(index, 1);
    }
  }

  // Add the card to the battlefield zone
  const battlefieldZone = newState.zones.get(player.battlefieldZoneId);
  if (battlefieldZone) {
    battlefieldZone.cards.push(cardInstanceId);
  }

  // Update the card's zone
  cardInstance.currentZoneId = player.battlefieldZoneId;

  // Increment the player's lands played this turn
  player.landsPlayedThisTurn += 1;

  return newState;
}