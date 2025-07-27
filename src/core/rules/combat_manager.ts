import { IGameState, ICardInstance, ICardDefinition } from '../game_state/interfaces';

export class CombatManager {
    public resolveCombatDamage(gameState: IGameState, cardDefinitions: Map<string, ICardDefinition>): IGameState {
        let newGameState = { ...gameState };

        const attackingCreatures = Array.from(newGameState.cardInstances.values()).filter(c => c.isAttacking);
        const firstStrikeCreatures = attackingCreatures.filter(c => c.hasFirstStrike || c.hasDoubleStrike);
        const regularCreatures = attackingCreatures.filter(c => !c.hasFirstStrike);

        // First strike damage step
        newGameState = this.assignAndDealDamage(newGameState, firstStrikeCreatures, cardDefinitions, true);

        // Regular damage step
        const doubleStrikeCreatures = firstStrikeCreatures.filter(c => c.hasDoubleStrike);
        const allAttackersForRegularStep = [...new Set([...regularCreatures, ...doubleStrikeCreatures])];
        newGameState = this.assignAndDealDamage(newGameState, allAttackersForRegularStep, cardDefinitions, false);

        return newGameState;
    }

    private assignAndDealDamage(gameState: IGameState, attackers: ICardInstance[], cardDefinitions: Map<string, ICardDefinition>, isFirstStrike: boolean): IGameState {
        let newGameState = { ...gameState };
        const newCardInstances = new Map(newGameState.cardInstances);
        const newPlayers = new Map(newGameState.players);
        const damageToDeal: { [cardId: string]: number } = {};

        for (const attacker of attackers) {
            const currentAttacker = newCardInstances.get(attacker.id)!;
            const attackerDefinition = cardDefinitions.get(currentAttacker.definitionId);
            if (!attackerDefinition || !attackerDefinition.power) {
                continue;
            }

            let attackerPower = parseInt(attackerDefinition.power, 10);

            if (!currentAttacker.blockedBy || currentAttacker.blockedBy.length === 0) {
                // Unblocked
                const defendingPlayerId = Array.from(newGameState.players.values()).find(p => p.id !== currentAttacker.controllerPlayerId)?.id;
                if (defendingPlayerId) {
                    const defendingPlayer = newPlayers.get(defendingPlayerId)!;
                    newPlayers.set(defendingPlayerId, { ...defendingPlayer, life: defendingPlayer.life - attackerPower });
                }
            } else {
                // Blocked
                let remainingDamage = attackerPower;
                for (const blockerId of currentAttacker.blockedBy) {
                    const blocker = newCardInstances.get(blockerId)!;
                    const blockerDefinition = cardDefinitions.get(blocker.definitionId)!;
                    const blockerToughness = parseInt(blockerDefinition.toughness!, 10);

                    const damageToBlocker = Math.min(remainingDamage, blockerToughness - (damageToDeal[blockerId] || 0));
                    damageToDeal[blockerId] = (damageToDeal[blockerId] || 0) + damageToBlocker;
                    remainingDamage -= damageToBlocker;

                    // Blocker deals damage to attacker
                    if (isFirstStrike ? (blocker.hasFirstStrike || blocker.hasDoubleStrike) : (!blocker.hasFirstStrike || blocker.hasDoubleStrike)) {
                        const blockerPower = parseInt(blockerDefinition.power!, 10);
                        damageToDeal[currentAttacker.id] = (damageToDeal[currentAttacker.id] || 0) + blockerPower;
                    }
                }

                if (currentAttacker.hasTrample && remainingDamage > 0) {
                    const defendingPlayerId = Array.from(newGameState.players.values()).find(p => p.id !== currentAttacker.controllerPlayerId)?.id;
                    if (defendingPlayerId) {
                        const defendingPlayer = newPlayers.get(defendingPlayerId)!;
                        newPlayers.set(defendingPlayerId, { ...defendingPlayer, life: defendingPlayer.life - remainingDamage });
                    }
                }
            }
        }

        for (const cardId in damageToDeal) {
            const card = newCardInstances.get(cardId)!;
            newCardInstances.set(cardId, { ...card, damageMarked: card.damageMarked + damageToDeal[cardId] });
        }

        newGameState = { ...newGameState, cardInstances: newCardInstances, players: newPlayers };
        return newGameState;
    }
}
