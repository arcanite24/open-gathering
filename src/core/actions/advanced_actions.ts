import { IGameState, IPlayer, IZone, ICardInstance } from '../game_state/interfaces';
import { Target } from '../abilities/interfaces';

/**
 * Represents the result of an action attempt.
 */
export interface ActionResult {
    /** Whether the action was successful */
    success: boolean;
    /** The updated game state (only if successful) */
    gameState?: IGameState;
    /** Error message if the action failed */
    error?: string;
}

/**
 * Checks if a player can activate a specific ability on a card.
 * @param gameState The current game state
 * @param playerId The ID of the player attempting to activate the ability
 * @param cardInstanceId The ID of the card instance with the ability
 * @param abilityId The ID of the ability to activate
 * @returns True if the ability can be activated, false otherwise
 */
export function canActivateAbility(
    gameState: IGameState,
    playerId: string,
    cardInstanceId: string,
    abilityId: string
): boolean {
    // Get the player
    const player = gameState.players.get(playerId);
    if (!player) {
        return false;
    }

    // Get the card instance
    const cardInstance = gameState.cardInstances.get(cardInstanceId);
    if (!cardInstance) {
        return false;
    }

    // Check if the player controls the card
    if (cardInstance.controllerPlayerId !== playerId) {
        return false;
    }

    // Find the ability in the card's activated abilities
    const ability = cardInstance.activatedAbilities.find(ab => ab.id === abilityId);
    if (!ability) {
        return false;
    }

    // Check if the ability can be activated
    return ability.canActivate(gameState, playerId);
}

/**
 * Activates a specific ability on a card.
 * @param gameState The current game state
 * @param playerId The ID of the player activating the ability
 * @param cardInstanceId The ID of the card instance with the ability
 * @param abilityId The ID of the ability to activate
 * @param targets Optional targets for the ability
 * @returns The result of the activation attempt
 */
export function activateAbility(
    gameState: IGameState,
    playerId: string,
    cardInstanceId: string,
    abilityId: string,
    targets?: Target[]
): ActionResult {
    // Check if the ability can be activated
    if (!canActivateAbility(gameState, playerId, cardInstanceId, abilityId)) {
        return {
            success: false,
            error: 'Cannot activate ability: requirements not met'
        };
    }

    // Get the card instance
    const cardInstance = gameState.cardInstances.get(cardInstanceId);
    if (!cardInstance) {
        return {
            success: false,
            error: 'Card instance not found'
        };
    }

    // Find the ability
    const ability = cardInstance.activatedAbilities.find(ab => ab.id === abilityId);
    if (!ability) {
        return {
            success: false,
            error: 'Ability not found'
        };
    }

    try {
        // Activate the ability
        const newGameState = ability.activate(gameState, playerId, targets);

        return {
            success: true,
            gameState: newGameState
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to activate ability: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Checks if a player can target a specific card instance.
 * @param gameState The current game state
 * @param playerId The ID of the player doing the targeting
 * @param targetCardInstanceId The ID of the card instance being targeted
 * @param targetType The type of target required (e.g., 'creature', 'permanent', 'player')
 * @returns True if the target is valid, false otherwise
 */
export function canTarget(
    gameState: IGameState,
    playerId: string,
    targetCardInstanceId: string,
    targetType: string
): boolean {
    const targetCard = gameState.cardInstances.get(targetCardInstanceId);
    if (!targetCard) {
        return false;
    }

    // Check if the target is on the battlefield (for most targeting)
    const battlefieldZone = gameState.zones.get(targetCard.currentZoneId);
    if (!battlefieldZone || battlefieldZone.name !== 'Battlefield') {
        return false;
    }

    // Check target type restrictions
    switch (targetType.toLowerCase()) {
        case 'creature':
            return targetCard.types?.includes('Creature') || false;
        case 'permanent':
            // Any card on the battlefield is a permanent
            return true;
        case 'artifact':
            return targetCard.types?.includes('Artifact') || false;
        case 'enchantment':
            return targetCard.types?.includes('Enchantment') || false;
        case 'planeswalker':
            return targetCard.types?.includes('Planeswalker') || false;
        default:
            return true; // Default to allowing any target
    }
}

/**
 * Checks if a player can target another player.
 * @param gameState The current game state
 * @param playerId The ID of the player doing the targeting
 * @param targetPlayerId The ID of the player being targeted
 * @returns True if the player can be targeted, false otherwise
 */
export function canTargetPlayer(
    gameState: IGameState,
    playerId: string,
    targetPlayerId: string
): boolean {
    // Check if both players exist
    const player = gameState.players.get(playerId);
    const targetPlayer = gameState.players.get(targetPlayerId);

    if (!player || !targetPlayer) {
        return false;
    }

    // For now, any player can target any other player
    // In a full implementation, this might check for hexproof, protection, etc.
    return true;
}

/**
 * Gets all valid targets for a given targeting restriction.
 * @param gameState The current game state
 * @param playerId The ID of the player doing the targeting
 * @param targetType The type of target required
 * @param controllerRestriction Optional restriction on controller ('self', 'opponent', 'any')
 * @returns Array of valid target IDs
 */
export function getValidTargets(
    gameState: IGameState,
    playerId: string,
    targetType: string,
    controllerRestriction: string = 'any'
): string[] {
    const validTargets: string[] = [];

    // Get all card instances on the battlefield
    for (const cardInstance of gameState.cardInstances.values()) {
        const zone = gameState.zones.get(cardInstance.currentZoneId);
        if (!zone || zone.name !== 'Battlefield') {
            continue;
        }

        // Check controller restriction
        if (controllerRestriction === 'self' && cardInstance.controllerPlayerId !== playerId) {
            continue;
        }
        if (controllerRestriction === 'opponent' && cardInstance.controllerPlayerId === playerId) {
            continue;
        }

        // Check if this card can be targeted
        if (canTarget(gameState, playerId, cardInstance.id, targetType)) {
            validTargets.push(cardInstance.id);
        }
    }

    return validTargets;
}

/**
 * Gets all valid player targets.
 * @param gameState The current game state
 * @param playerId The ID of the player doing the targeting
 * @param restriction Optional restriction ('self', 'opponent', 'any')
 * @returns Array of valid player IDs
 */
export function getValidPlayerTargets(
    gameState: IGameState,
    playerId: string,
    restriction: string = 'any'
): string[] {
    const validTargets: string[] = [];

    for (const [targetPlayerId] of gameState.players) {
        if (restriction === 'self' && targetPlayerId !== playerId) {
            continue;
        }
        if (restriction === 'opponent' && targetPlayerId === playerId) {
            continue;
        }

        if (canTargetPlayer(gameState, playerId, targetPlayerId)) {
            validTargets.push(targetPlayerId);
        }
    }

    return validTargets;
}

/**
 * Validates targets for an ability or spell.
 * @param gameState The current game state
 * @param playerId The ID of the player providing targets
 * @param targets The targets to validate
 * @param requirements The targeting requirements
 * @returns True if all targets are valid, false otherwise
 */
export function validateTargets(
    gameState: IGameState,
    playerId: string,
    targets: Target[],
    requirements: { type: string; count: number; restriction?: string }[]
): boolean {
    // Check if we have the right number of target groups
    if (targets.length !== requirements.length) {
        return false;
    }

    // Validate each target group
    for (let i = 0; i < requirements.length; i++) {
        const target = targets[i];
        const requirement = requirements[i];

        // Check target count
        const targetIds = target.cardInstanceId ? [target.cardInstanceId] :
            target.playerId ? [target.playerId] : [];

        if (targetIds.length !== requirement.count) {
            return false;
        }

        // Validate each target in the group
        for (const targetId of targetIds) {
            if (target.cardInstanceId) {
                if (!canTarget(gameState, playerId, targetId, requirement.type)) {
                    return false;
                }
            } else if (target.playerId) {
                if (!canTargetPlayer(gameState, playerId, targetId)) {
                    return false;
                }
            }
        }
    }

    return true;
}

/**
 * Creates a target object for a card instance.
 * @param cardInstanceId The ID of the card instance to target
 * @returns A Target object
 */
export function createCardTarget(cardInstanceId: string): Target {
    return {
        type: 'card',
        cardInstanceId
    };
}

/**
 * Creates a target object for a player.
 * @param playerId The ID of the player to target
 * @returns A Target object  
 */
export function createPlayerTarget(playerId: string): Target {
    return {
        type: 'player',
        playerId
    };
}
