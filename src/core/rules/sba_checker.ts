import { IGameState, ICardInstance, ICardDefinition } from "../game_state/interfaces";

export class SBAChecker {
    public checkAndApplySBAs(gameState: IGameState, cardDefinitions: Map<string, ICardDefinition>): IGameState {
        let currentState = gameState;
        let sbasWereApplied: boolean;

        do {
            const { newState, applied } = this.applySBAsOnce(currentState, cardDefinitions);
            currentState = newState;
            sbasWereApplied = applied;
        } while (sbasWereApplied);

        return currentState;
    }

    private applySBAsOnce(gameState: IGameState, cardDefinitions: Map<string, ICardDefinition>): { newState: IGameState, applied: boolean } {
        let newState = gameState;
        let applied = false;

        // Check players with 0 or less life
        const lostPlayerIds = Array.from(newState.players.values())
            .filter(p => p.life <= 0 && !p.hasLost)
            .map(p => p.id);

        if (lostPlayerIds.length > 0) {
            const newPlayers = new Map(newState.players);
            for (const playerId of lostPlayerIds) {
                const player = newPlayers.get(playerId)!;
                const newPlayer = { ...player, hasLost: true };
                newPlayers.set(playerId, newPlayer);
            }
            newState = { ...newState, players: newPlayers };
            applied = true;
        }

        // Check creatures with lethal damage or toughness 0 or less
        const battlefieldZoneIds = new Set(Array.from(newState.players.values()).map(p => p.battlefieldZoneId));
        const creaturesOnBattlefield = Array.from(newState.cardInstances.values())
            .filter(c => battlefieldZoneIds.has(c.currentZoneId));

        const creaturesToDestroy = new Set<string>();

        for (const creature of creaturesOnBattlefield) {
            const definition = cardDefinitions.get(creature.definitionId);
            if (!definition || !definition.types || !definition.types.includes('Creature')) {
                continue;
            }

            const toughness = Number(definition.toughness);
            if (creature.damageMarked >= toughness || toughness <= 0) {
                creaturesToDestroy.add(creature.id);
            }
        }

        if (creaturesToDestroy.size > 0) {
            newState = this.moveCardsToGraveyard(newState, Array.from(creaturesToDestroy));
            applied = true;
        }

        return { newState, applied };
    }

    private moveCardsToGraveyard(gameState: IGameState, cardIds: string[]): IGameState {
        const newCardInstances = new Map(gameState.cardInstances);
        const newZones = new Map(gameState.zones);

        for (const cardId of cardIds) {
            const card = newCardInstances.get(cardId)!;
            const owner = gameState.players.get(card.ownerPlayerId)!;
            const graveyardId = owner.graveyardZoneId;

            // Remove from current zone
            const currentZone = newZones.get(card.currentZoneId)!;
            const newCurrentZoneCards = currentZone.cards.filter(id => id !== cardId);
            const newCurrentZone = { ...currentZone, cards: newCurrentZoneCards };
            newZones.set(currentZone.id, newCurrentZone);

            // Add to graveyard
            const graveyardZone = newZones.get(graveyardId)!;
            const newGraveyardZoneCards = [...graveyardZone.cards, cardId];
            const newGraveyardZone = { ...graveyardZone, cards: newGraveyardZoneCards };
            newZones.set(graveyardId, newGraveyardZone);

            // Update card's zone and reset damage
            const newCard = { ...card, currentZoneId: graveyardId, damageMarked: 0 };
            newCardInstances.set(cardId, newCard);
        }

        return { ...gameState, cardInstances: newCardInstances, zones: newZones };
    }
}
