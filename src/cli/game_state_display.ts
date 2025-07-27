import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition, ManaPool } from '../core/game_state/interfaces';

export class GameStateDisplay {

    /**
     * Display the complete game state in a formatted way
     */
    showGameState(gameState: IGameState): void {
        console.log('='.repeat(80));
        console.log(`TURN ${gameState.turn} - ${gameState.phase} Phase (${gameState.step} Step)`);
        console.log(`Active Player: ${gameState.activePlayerId} | Priority: ${gameState.priorityPlayerId}`);
        console.log('='.repeat(80));

        // Show both players
        const playerIds = Array.from(gameState.players.keys()).sort();

        for (const playerId of playerIds) {
            const player = gameState.players.get(playerId);
            if (player) {
                this.showPlayer(player, gameState);
                console.log();
            }
        }

        // Show stack if not empty
        const stackZone = gameState.zones.get(gameState.stackZoneId);
        if (stackZone && stackZone.cards.length > 0) {
            this.showStack(stackZone, gameState);
            console.log();
        }

        console.log('-'.repeat(80));
    }

    /**
     * Display a player's state
     */
    private showPlayer(player: IPlayer, gameState: IGameState): void {
        const isActive = player.id === gameState.activePlayerId;
        const hasPriority = player.id === gameState.priorityPlayerId;

        let playerTitle = `${player.id.toUpperCase()}`;
        if (isActive) playerTitle += ' (ACTIVE)';
        if (hasPriority) playerTitle += ' (PRIORITY)';

        console.log(`┌─ ${playerTitle} ─ Life: ${player.life} ─ Lands Played: ${player.landsPlayedThisTurn}`);

        // Show mana pool if any mana available
        const totalMana = Object.values(player.manaPool).reduce((sum, amount) => sum + amount, 0);
        if (totalMana > 0) {
            const manaStr = this.formatManaPool(player.manaPool);
            console.log(`│  Mana Pool: ${manaStr}`);
        }

        // Show zones
        this.showPlayerZones(player, gameState);
    }

    /**
     * Display a player's zones
     */
    private showPlayerZones(player: IPlayer, gameState: IGameState): void {
        // Hand
        const handZone = gameState.zones.get(player.handZoneId);
        if (handZone) {
            console.log(`│  Hand (${handZone.cards.length}): ${this.formatZoneCards(handZone, gameState, true)}`);
        }

        // Battlefield
        const battlefieldZone = gameState.zones.get(player.battlefieldZoneId);
        if (battlefieldZone && battlefieldZone.cards.length > 0) {
            console.log(`│  Battlefield (${battlefieldZone.cards.length}):`);
            this.showBattlefieldCards(battlefieldZone, gameState);
        }

        // Library
        const libraryZone = gameState.zones.get(player.libraryZoneId);
        if (libraryZone) {
            console.log(`│  Library: ${libraryZone.cards.length} cards`);
        }

        // Graveyard
        const graveyardZone = gameState.zones.get(player.graveyardZoneId);
        if (graveyardZone && graveyardZone.cards.length > 0) {
            console.log(`│  Graveyard (${graveyardZone.cards.length}): ${this.formatZoneCards(graveyardZone, gameState)}`);
        }

        // Exile
        const exileZone = gameState.zones.get(player.exileZoneId);
        if (exileZone && exileZone.cards.length > 0) {
            console.log(`│  Exile (${exileZone.cards.length}): ${this.formatZoneCards(exileZone, gameState)}`);
        }

        console.log('└─' + '─'.repeat(78));
    }

    /**
     * Show battlefield cards with detailed information
     */
    private showBattlefieldCards(zone: IZone, gameState: IGameState): void {
        for (const cardId of zone.cards) {
            const cardInstance = gameState.cardInstances.get(cardId);
            if (cardInstance) {
                const cardInfo = this.formatBattlefieldCard(cardInstance);
                console.log(`│    ${cardInfo}`);
            }
        }
    }

    /**
     * Format a single battlefield card
     */
    private formatBattlefieldCard(card: ICardInstance): string {
        let info = `[${card.id}] ${card.definition?.name || 'Unknown'}`;

        // Add power/toughness for creatures
        if (card.definition?.types?.includes('Creature')) {
            info += ` (${card.power || card.definition.power || 0}/${card.toughness || card.definition.toughness || 0})`;
        }

        // Add status indicators
        const status: string[] = [];
        if (card.isTapped) status.push('TAPPED');
        if (card.damageMarked > 0) status.push(`${card.damageMarked} DMG`);
        if (card.isAttacking) status.push('ATTACKING');
        if (card.isBlocking) status.push('BLOCKING');

        if (status.length > 0) {
            info += ` [${status.join(', ')}]`;
        }

        return info;
    }

    /**
     * Format cards in a zone
     */
    private formatZoneCards(zone: IZone, gameState: IGameState, showCardNames: boolean = false): string {
        if (zone.cards.length === 0) {
            return 'empty';
        }

        if (!showCardNames) {
            // Just show card types/names briefly
            const cardNames = zone.cards.map(cardId => {
                const card = gameState.cardInstances.get(cardId);
                return card?.definition?.name || 'Unknown';
            });

            if (cardNames.length > 5) {
                return `${cardNames.slice(0, 3).join(', ')}, ... (${cardNames.length - 3} more)`;
            }
            return cardNames.join(', ');
        }

        // Show detailed hand information
        return zone.cards.map((cardId, index) => {
            const card = gameState.cardInstances.get(cardId);
            const name = card?.definition?.name || 'Unknown';
            const manaCost = card?.definition?.manaCost || '';
            return `[${index + 1}] ${name} ${manaCost}`;
        }).join(', ');
    }

    /**
     * Display the stack
     */
    private showStack(stackZone: IZone, gameState: IGameState): void {
        console.log('┌─ STACK ─');

        // Stack is LIFO, so show from top to bottom
        const stackCards = [...stackZone.cards].reverse();

        stackCards.forEach((cardId, index) => {
            const card = gameState.cardInstances.get(cardId);
            if (card) {
                const controller = gameState.players.get(card.controllerPlayerId);
                console.log(`│  ${index + 1}. ${card.definition?.name || 'Unknown'} (${controller?.id || 'Unknown'})`);
            }
        });

        console.log('└─' + '─'.repeat(78));
    }

    /**
     * Format mana pool display
     */
    private formatManaPool(manaPool: ManaPool): string {
        const manaSymbols: { [key: string]: string } = {
            W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢', C: '⚪'
        };

        const parts: string[] = [];
        for (const [color, amount] of Object.entries(manaPool)) {
            if (amount > 0) {
                const symbol = manaSymbols[color] || color;
                parts.push(`${symbol}${amount > 1 ? amount : ''}`);
            }
        }

        return parts.join(' ') || 'Empty';
    }

    /**
     * Show a compact game state summary
     */
    showCompactState(gameState: IGameState): void {
        console.log(`Turn ${gameState.turn} | ${gameState.phase}/${gameState.step} | Active: ${gameState.activePlayerId} | Priority: ${gameState.priorityPlayerId}`);

        gameState.players.forEach((player, playerId) => {
            const hand = gameState.zones.get(player.handZoneId);
            const battlefield = gameState.zones.get(player.battlefieldZoneId);
            const library = gameState.zones.get(player.libraryZoneId);

            console.log(`${playerId}: ${player.life} life, ${hand?.cards.length || 0} hand, ${battlefield?.cards.length || 0} battlefield, ${library?.cards.length || 0} library`);
        });
    }

    /**
     * Show available actions for the current player
     */
    showAvailableActions(gameState: IGameState): void {
        const priorityPlayer = gameState.players.get(gameState.priorityPlayerId);
        if (!priorityPlayer) return;

        console.log(`\nAvailable actions for ${priorityPlayer.id}:`);

        // Check for playable lands in hand
        const handZone = gameState.zones.get(priorityPlayer.handZoneId);
        if (handZone) {
            const playableLands = handZone.cards.filter(cardId => {
                const card = gameState.cardInstances.get(cardId);
                return card?.definition?.types?.includes('Land');
            });

            if (playableLands.length > 0 && priorityPlayer.landsPlayedThisTurn === 0) {
                console.log('  - play <card_index>  (Play a land from hand)');
            }
        }

        // Check for activatable abilities
        const battlefieldZone = gameState.zones.get(priorityPlayer.battlefieldZoneId);
        if (battlefieldZone && battlefieldZone.cards.length > 0) {
            const hasActivatableAbilities = battlefieldZone.cards.some(cardId => {
                const card = gameState.cardInstances.get(cardId);
                return card?.activatedAbilities && card.activatedAbilities.length > 0;
            });

            if (hasActivatableAbilities) {
                console.log('  - activate <card_index> <ability_index>  (Activate an ability)');
            }
        }

        console.log('  - pass  (Pass priority)');
        if (gameState.priorityPlayerId === gameState.activePlayerId) {
            console.log('  - advance  (Advance to next phase/step)');
        }
    }
}
