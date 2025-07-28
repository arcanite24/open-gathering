import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition, ManaPool } from '../game_state/interfaces';
import { Phase } from '../rules/turn_manager';
import { GameError, ErrorCode } from '../errors';

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
    stackZoneId: gameState.stackZoneId,
    cardDefinitions: gameState.cardDefinitions,
    abilityRegistry: gameState.abilityRegistry,
  };
}

/**
 * Checks if a player can cast a spell, throwing descriptive errors for validation failures.
 * @param gameState The current game state
 * @param playerId The ID of the player attempting to cast the spell
 * @param cardInstanceId The ID of the card instance to cast
 * @param cardDefinitions Map of card definitions for looking up mana costs
 * @returns True if the player can cast the spell
 * @throws GameError with specific error codes and helpful suggestions
 */
export function canCastSpell(
  gameState: IGameState,
  playerId: string,
  cardInstanceId: string,
  cardDefinitions?: Map<string, ICardDefinition>
): boolean {
  // Get the player
  const player = gameState.players.get(playerId);
  if (!player) {
    throw new GameError(
      ErrorCode.PlayerNotFound,
      `Player ${playerId} not found`,
      'This appears to be a game state issue. Try restarting the game.',
      { playerId }
    );
  }

  // Check if it's the player's turn
  if (playerId !== gameState.activePlayerId) {
    const activePlayer = gameState.players.get(gameState.activePlayerId);
    throw new GameError(
      ErrorCode.NotYourTurn,
      'You can only cast spells on your own turn',
      'Wait for your turn or pass priority to continue',
      {
        currentPlayer: playerId,
        activePlayer: gameState.activePlayerId,
        activePlayerName: activePlayer?.id || 'Unknown'
      }
    );
  }

  // Check if it's a main phase
  if (gameState.phase !== Phase.PreCombatMain && gameState.phase !== Phase.PostCombatMain) {
    throw new GameError(
      ErrorCode.GamePhaseRestriction,
      `Cannot cast spells during ${gameState.phase} phase`,
      'Spells can only be cast during main phases',
      {
        currentPhase: gameState.phase,
        allowedPhases: [Phase.PreCombatMain, Phase.PostCombatMain]
      }
    );
  }

  // Check if the player has priority
  if (playerId !== gameState.priorityPlayerId) {
    const priorityPlayer = gameState.players.get(gameState.priorityPlayerId);
    throw new GameError(
      ErrorCode.NotPriorityPlayer,
      'You do not have priority',
      'Wait for priority to be passed to you',
      {
        currentPlayer: playerId,
        priorityPlayer: gameState.priorityPlayerId,
        priorityPlayerName: priorityPlayer?.id || 'Unknown'
      }
    );
  }

  // Get the card instance
  const cardInstance = gameState.cardInstances.get(cardInstanceId);
  if (!cardInstance) {
    throw new GameError(
      ErrorCode.InvalidCard,
      `Card instance ${cardInstanceId} not found`,
      'Make sure the card exists and try again',
      { cardInstanceId }
    );
  }

  // Check if the card is in the player's hand
  const handZone = gameState.zones.get(player.handZoneId);
  if (!handZone || !handZone.cards.includes(cardInstanceId)) {
    throw new GameError(
      ErrorCode.CardNotInHand,
      `Card "${cardInstance.definition?.name || 'Unknown'}" is not in your hand`,
      'You can only cast spells from your hand',
      {
        cardName: cardInstance.definition?.name,
        cardInstanceId,
        handZoneId: player.handZoneId,
        currentZone: cardInstance.currentZoneId
      }
    );
  }

  // Check if the card has a type that can be cast
  const cardDef = cardInstance.definition;
  if (!cardDef) {
    throw new GameError(
      ErrorCode.InvalidCard,
      'Card has no definition data',
      'This appears to be a data issue. Try restarting the game.',
      { cardInstanceId }
    );
  }

  const castableTypes = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker'];
  const hasValidType = cardDef.types?.some(type => castableTypes.includes(type));

  if (!hasValidType) {
    throw new GameError(
      ErrorCode.WrongCardType,
      `Cannot cast ${cardDef.name || 'this card'} - it is not a castable spell`,
      'Only creatures, instants, sorceries, enchantments, artifacts, and planeswalkers can be cast',
      {
        cardName: cardDef.name,
        cardTypes: cardDef.types,
        castableTypes
      }
    );
  }

  // Check if the player can pay the mana cost
  if (cardDef.manaCost) {
    const manaCost = calculateCost(cardDef.manaCost);
    if (!canPayCost(player, manaCost)) {
      // Calculate what mana is missing
      const availableMana = player.manaPool;
      const totalAvailable = availableMana.W + availableMana.U + availableMana.B +
        availableMana.R + availableMana.G + availableMana.C + availableMana.generic;
      const totalRequired = manaCost.W + manaCost.U + manaCost.B +
        manaCost.R + manaCost.G + manaCost.C + manaCost.generic;

      const missingMana: string[] = [];
      if (availableMana.W < manaCost.W) missingMana.push(`${manaCost.W - availableMana.W} White`);
      if (availableMana.U < manaCost.U) missingMana.push(`${manaCost.U - availableMana.U} Blue`);
      if (availableMana.B < manaCost.B) missingMana.push(`${manaCost.B - availableMana.B} Black`);
      if (availableMana.R < manaCost.R) missingMana.push(`${manaCost.R - availableMana.R} Red`);
      if (availableMana.G < manaCost.G) missingMana.push(`${manaCost.G - availableMana.G} Green`);
      if (availableMana.C < manaCost.C) missingMana.push(`${manaCost.C - availableMana.C} Colorless`);

      if (totalAvailable < totalRequired) {
        missingMana.push(`${totalRequired - totalAvailable} total mana`);
      }

      throw new GameError(
        ErrorCode.NotEnoughMana,
        `Not enough mana to cast ${cardDef.name}`,
        `Need ${cardDef.manaCost}. Missing: ${missingMana.join(', ')}`,
        {
          cardName: cardDef.name,
          manaCost: cardDef.manaCost,
          requiredMana: manaCost,
          availableMana,
          missingMana: missingMana.join(', '),
          totalRequired,
          totalAvailable
        }
      );
    }
  }

  // TODO: Check if the stack is empty (for sorceries)
  // For now we'll allow all spells during main phases

  return true;
}

/**
 * Executes the cast spell action.
 * @param gameState The current game state
 * @param playerId The ID of the player casting the spell
 * @param cardInstanceId The ID of the card instance to cast
 * @param cardDefinitions Optional map of card definitions for validation
 * @returns The updated game state
 * @throws GameError if the spell cannot be cast
 */
export function executeCastSpell(
  gameState: IGameState,
  playerId: string,
  cardInstanceId: string,
  cardDefinitions?: Map<string, ICardDefinition>
): IGameState {
  // Validate the spell can be cast (this will throw descriptive errors)
  canCastSpell(gameState, playerId, cardInstanceId, cardDefinitions);

  // Create a copy of the game state to avoid mutating the original
  const newState = copyGameState(gameState);

  // Get the player and card instance (we know they exist from validation)
  const player = newState.players.get(playerId)!;
  const cardInstance = newState.cardInstances.get(cardInstanceId)!;

  // Pay the mana cost if the card has one
  if (cardInstance.definition?.manaCost) {
    const manaCost = calculateCost(cardInstance.definition.manaCost);
    const updatedPlayer = payCost(player, manaCost);
    newState.players.set(playerId, updatedPlayer);
  }

  // Remove the card from the hand zone
  const handZone = newState.zones.get(player.handZoneId)!;
  const index = handZone.cards.indexOf(cardInstanceId);
  if (index !== -1) {
    handZone.cards.splice(index, 1);
  }

  // Add the card to the stack zone
  const stackZone = newState.zones.get(newState.stackZoneId);
  if (stackZone) {
    stackZone.cards.push(cardInstanceId);
  }

  // Update the card's zone
  cardInstance.currentZoneId = newState.stackZoneId;

  // TODO: Give priority to opponents for responses
  // TODO: Handle spell resolution when stack resolves

  return newState;
}