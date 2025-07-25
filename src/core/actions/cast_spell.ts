import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition, ManaPool } from '../game_state/interfaces';
import { Phase } from '../rules/turn_manager';

// Define ManaCost interface
export interface ManaCost {
  W: number;
  U: number;
  B: number;
  R: number;
  G: number;
  C: number;
  generic: number;
}

/**
 * Calculates the mana cost of a card from its mana cost string.
 * @param manaCostString The mana cost string (e.g., "{1}{W}{W}")
 * @returns The parsed mana cost
 */
export function calculateCost(manaCostString: string): ManaCost {
  // Initialize the mana cost object
  const manaCost: ManaCost = {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
    C: 0,
    generic: 0
  };

  // Remove the curly braces and split by '}' to get individual cost symbols
  const symbols = manaCostString.replace(/{/g, '').split('}').filter(s => s.length > 0);

  // Process each symbol
  for (const symbol of symbols) {
    switch (symbol) {
      case 'W':
        manaCost.W++;
        break;
      case 'U':
        manaCost.U++;
        break;
      case 'B':
        manaCost.B++;
        break;
      case 'R':
        manaCost.R++;
        break;
      case 'G':
        manaCost.G++;
        break;
      case 'C':
        manaCost.C++;
        break;
      default:
        // Handle generic mana (numbers)
        const num = parseInt(symbol);
        if (!isNaN(num)) {
          manaCost.generic += num;
        }
        break;
    }
  }

  return manaCost;
}

/**
 * Checks if a player can pay a given mana cost.
 * @param player The player
 * @param cost The mana cost to check
 * @returns True if the player can pay the cost, false otherwise
 */
export function canPayCost(player: IPlayer, cost: ManaCost): boolean {
  // Check colored mana requirements
  if (
    player.manaPool.W < cost.W ||
    player.manaPool.U < cost.U ||
    player.manaPool.B < cost.B ||
    player.manaPool.R < cost.R ||
    player.manaPool.G < cost.G ||
    player.manaPool.C < cost.C
  ) {
    return false;
  }

  // Calculate how much colored mana the player has that could be used for generic costs
  const availableColoredMana =
    player.manaPool.W + 
    player.manaPool.U + 
    player.manaPool.B + 
    player.manaPool.R + 
    player.manaPool.G + 
    player.manaPool.C;

  // Calculate how much generic mana the player has
  const availableGenericMana = player.manaPool.generic;

  // Total available mana
  const totalAvailableMana = availableColoredMana + availableGenericMana;

  // Total required mana (colored + generic)
  const totalRequiredMana = 
    cost.W + cost.U + cost.B + cost.R + cost.G + cost.C + cost.generic;

  // Check if player has enough total mana
  return totalAvailableMana >= totalRequiredMana;
}

/**
 * Pays a mana cost by deducting from the player's mana pool.
 * @param player The player
 * @param cost The mana cost to pay
 * @returns The updated player with the mana cost deducted
 */
export function payCost(player: IPlayer, cost: ManaCost): IPlayer {
  // Create a copy of the player to avoid mutation
  const updatedPlayer = {
    ...player,
    manaPool: { ...player.manaPool }
  };
  
  // Deduct colored mana
  updatedPlayer.manaPool.W -= cost.W;
  updatedPlayer.manaPool.U -= cost.U;
  updatedPlayer.manaPool.B -= cost.B;
  updatedPlayer.manaPool.R -= cost.R;
  updatedPlayer.manaPool.G -= cost.G;
  updatedPlayer.manaPool.C -= cost.C;
  
  // Calculate remaining generic cost to pay
  let remainingGenericCost = cost.generic;
  
  // First, try to pay with specific colored mana
  const coloredCost = cost.W + cost.U + cost.B + cost.R + cost.G + cost.C;
  if (coloredCost > 0) {
    // Pay the colored cost with specific colored mana (this is already handled above)
  }
  
  // Pay remaining generic cost
  // First use generic mana
  const genericToUse = Math.min(updatedPlayer.manaPool.generic, remainingGenericCost);
  updatedPlayer.manaPool.generic -= genericToUse;
  remainingGenericCost -= genericToUse;
  
  // Then use colored mana if needed
  if (remainingGenericCost > 0) {
    // For simplicity, we'll just reduce each color evenly
    // In a real implementation, the player would choose which mana to use
    const colors: (keyof ManaPool)[] = ['W', 'U', 'B', 'R', 'G', 'C'];
    for (const color of colors) {
      if (remainingGenericCost <= 0) break;
      const manaToUse = Math.min(updatedPlayer.manaPool[color], remainingGenericCost);
      updatedPlayer.manaPool[color] -= manaToUse;
      remainingGenericCost -= manaToUse;
    }
  }
  
  return updatedPlayer;
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
    players.set(id, { 
      ...player,
      manaPool: { ...player.manaPool }
    });
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
 * Checks if a player can cast a spell.
 * @param gameState The current game state
 * @param playerId The ID of the player attempting to cast the spell
 * @param cardInstanceId The ID of the card instance to cast
 * @returns True if the player can cast the spell, false otherwise
 */
export function canCastSpell(gameState: IGameState, playerId: string, cardInstanceId: string): boolean {
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

  // Get the card definition
  // In a full implementation, we'd need to look up the definition from a card database
  // For now, we'll assume it's available through the engine or passed in
  
  // Check if the card has a type that can be cast (Creature, Instant, Sorcery, etc.)
  // This would require access to the card definition
  // For now, we'll assume all cards in hand except lands can be cast
  
  // Check if the player can pay the mana cost
  // This would require calculating the cost from the card definition
  // For now, we'll assume the player can pay the cost
  
  // If all checks pass, the player can cast the spell
  return true;
}

/**
 * Executes the cast spell action.
 * @param gameState The current game state
 * @param playerId The ID of the player casting the spell
 * @param cardInstanceId The ID of the card instance to cast
 * @returns The updated game state
 */
export function executeCastSpell(gameState: IGameState, playerId: string, cardInstanceId: string): IGameState {
  // First, check if the player can cast the spell
  if (!canCastSpell(gameState, playerId, cardInstanceId)) {
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

  // Add the card to the stack zone
  const stackZone = newState.zones.get(newState.stackZoneId);
  if (stackZone) {
    stackZone.cards.push(cardInstanceId);
  }

  // Update the card's zone
  cardInstance.currentZoneId = newState.stackZoneId;

  // TODO: Pay the mana cost (this would require access to the card definition)

  // TODO: Give priority to opponent

  return newState;
}