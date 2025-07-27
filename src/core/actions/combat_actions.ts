import { IGameState } from '../game_state/interfaces';

export function declareAttackers(gameState: IGameState, playerId: string, attackerIds: string[]): IGameState {
    // Legality checks
    if (playerId !== gameState.activePlayerId) {
        throw new Error('Only the active player can declare attackers.');
    }
    if (gameState.phase !== 'Combat' || gameState.step !== 'DeclareAttackers') {
        throw new Error('Attackers can only be declared in the Declare Attackers step.');
    }

    const newCardInstances = new Map(gameState.cardInstances);

    for (const attackerId of attackerIds) {
        const attacker = newCardInstances.get(attackerId);
        if (!attacker || attacker.controllerPlayerId !== playerId) {
            throw new Error(`Card ${attackerId} is not a valid attacker.`);
        }
        // Add more checks like isTapped, summoning sickness etc. later
        newCardInstances.set(attackerId, { ...attacker, isAttacking: true });
    }

    return { ...gameState, cardInstances: newCardInstances };
}

export function declareBlockers(gameState: IGameState, playerId: string, blockers: { blockerId: string, attackerId: string }[]): IGameState {
    // Legality checks
    if (gameState.phase !== 'Combat' || gameState.step !== 'DeclareBlockers') {
        throw new Error('Blockers can only be declared in the Declare Blockers step.');
    }

    const newCardInstances = new Map(gameState.cardInstances);

    for (const { blockerId, attackerId } of blockers) {
        const blocker = newCardInstances.get(blockerId);
        const attacker = newCardInstances.get(attackerId);

        if (!blocker || blocker.controllerPlayerId !== playerId) {
            throw new Error(`Card ${blockerId} cannot be declared as a blocker.`);
        }
        if (!attacker || !attacker.isAttacking) {
            throw new Error(`Card ${attackerId} is not a valid attacker to block.`);
        }

        newCardInstances.set(blockerId, { ...blocker, isBlocking: true, blocking: attackerId });
        const newAttacker = { ...attacker, blockedBy: [...(attacker.blockedBy || []), blockerId] };
        newCardInstances.set(attackerId, newAttacker);
    }

    return { ...gameState, cardInstances: newCardInstances };
}
