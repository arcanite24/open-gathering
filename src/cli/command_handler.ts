import { Action } from '../core/game_state/interfaces';
import { IGameState, ICardInstance, IPlayer } from '../core/game_state/interfaces';
import { Target } from '../core/abilities/interfaces';

export class CommandHandler {
    constructor() { }

    /**
     * Helper method to get a value from either a Map or plain object
     */
    private getFromMapOrObject<T>(mapOrObject: Map<string, T> | Record<string, T>, key: string): T | undefined {
        if (mapOrObject instanceof Map) {
            return mapOrObject.get(key);
        } else {
            return mapOrObject[key];
        }
    }

    /**
     * Parse a command string into an Action
     */
    parseAction(command: string, args: string[], gameState: IGameState): Action | null {
        const priorityPlayer = this.getFromMapOrObject(gameState.players, gameState.priorityPlayerId);

        if (!priorityPlayer) {
            throw new Error('No priority player found');
        }

        switch (command) {
            case 'play':
                return this.parsePlayAction(args, priorityPlayer, gameState);

            case 'cast':
                return this.parseCastAction(args, priorityPlayer, gameState);

            case 'activate':
                return this.parseActivateAction(args, priorityPlayer, gameState);

            case 'pass':
                return { type: 'PASS_PRIORITY' };

            case 'advance':
                return { type: 'ADVANCE_TURN' };

            default:
                throw new Error(`Unknown game command: ${command}`);
        }
    }

    /**
     * Parse play land action
     */
    private parsePlayAction(args: string[], player: IPlayer, gameState: IGameState): Action {
        if (args.length === 0) {
            throw new Error('Usage: play <card_identifier>');
        }

        const cardId = this.resolveCardFromHand(args[0], player, gameState);
        const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);

        if (!cardInstance?.definition?.types?.includes('Land')) {
            throw new Error('Can only play lands with the play command. Use "cast" for other spells.');
        }

        return { type: 'PLAY_LAND', cardId };
    }

    /**
     * Parse cast spell action
     */
    private parseCastAction(args: string[], player: IPlayer, gameState: IGameState): Action {
        if (args.length === 0) {
            throw new Error('Usage: cast <card_identifier> [targets...]');
        }

        const cardId = this.resolveCardFromHand(args[0], player, gameState);
        const targets = this.parseTargets(args.slice(1), gameState);

        return { type: 'CAST_SPELL', cardId, targets };
    }

    /**
     * Parse activate ability action
     */
    private parseActivateAction(args: string[], player: IPlayer, gameState: IGameState): Action {
        if (args.length < 2) {
            throw new Error('Usage: activate <card_identifier> <ability_identifier> [targets...]');
        }

        const cardId = this.resolveCardFromBattlefield(args[0], player, gameState);
        const abilityId = this.resolveAbilityId(args[1], cardId, gameState);
        const targets = this.parseTargets(args.slice(2), gameState);

        return { type: 'ACTIVATE_ABILITY', cardId, abilityId, targets };
    }

    /**
     * Resolve a card identifier from hand to actual card ID
     */
    private resolveCardFromHand(identifier: string, player: IPlayer, gameState: IGameState): string {
        const handZone = this.getFromMapOrObject(gameState.zones, player.handZoneId);
        if (!handZone) {
            throw new Error('Player has no hand zone');
        }

        // Try to parse as index (1-based)
        const index = parseInt(identifier);
        if (!isNaN(index)) {
            if (index < 1 || index > handZone.cards.length) {
                throw new Error(`Invalid card index ${index}. Hand has ${handZone.cards.length} cards.`);
            }
            return handZone.cards[index - 1];
        }

        // Try to find by card ID
        if (handZone.cards.includes(identifier)) {
            return identifier;
        }

        // Try to find by card name
        for (const cardId of handZone.cards) {
            const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);
            if (cardInstance?.definition?.name?.toLowerCase().includes(identifier.toLowerCase())) {
                return cardId;
            }
        }

        throw new Error(`Card not found in hand: ${identifier}`);
    }

    /**
     * Resolve a card identifier from battlefield to actual card ID
     */
    private resolveCardFromBattlefield(identifier: string, player: IPlayer, gameState: IGameState): string {
        const battlefieldZone = this.getFromMapOrObject(gameState.zones, player.battlefieldZoneId);
        if (!battlefieldZone) {
            throw new Error('Player has no battlefield zone');
        }

        // Try to parse as index (1-based)
        const index = parseInt(identifier);
        if (!isNaN(index)) {
            if (index < 1 || index > battlefieldZone.cards.length) {
                throw new Error(`Invalid card index ${index}. Battlefield has ${battlefieldZone.cards.length} cards.`);
            }
            return battlefieldZone.cards[index - 1];
        }

        // Try to find by card ID
        if (battlefieldZone.cards.includes(identifier)) {
            return identifier;
        }

        // Try to find by card name
        for (const cardId of battlefieldZone.cards) {
            const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);
            if (cardInstance?.definition?.name?.toLowerCase().includes(identifier.toLowerCase())) {
                return cardId;
            }
        }

        throw new Error(`Card not found on battlefield: ${identifier}`);
    }

    /**
     * Resolve ability identifier to ability ID
     */
    private resolveAbilityId(identifier: string, cardId: string, gameState: IGameState): string {
        const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);
        if (!cardInstance) {
            throw new Error(`Card instance not found: ${cardId}`);
        }

        // Try to parse as index (1-based)
        const index = parseInt(identifier);
        if (!isNaN(index)) {
            const abilities = cardInstance.activatedAbilities;
            if (index < 1 || index > abilities.length) {
                throw new Error(`Invalid ability index ${index}. Card has ${abilities.length} activated abilities.`);
            }
            return abilities[index - 1].id;
        }

        // Try to find by ability ID
        for (const ability of cardInstance.activatedAbilities) {
            if (ability.id === identifier) {
                return ability.id;
            }
        }

        throw new Error(`Ability not found: ${identifier}`);
    }

    /**
     * Parse target strings into Target objects
     */
    private parseTargets(targetStrings: string[], gameState: IGameState): Target[] | undefined {
        if (targetStrings.length === 0) {
            return undefined;
        }

        const targets: Target[] = [];

        for (const targetStr of targetStrings) {
            // Check if it's a player
            const hasPlayer = gameState.players instanceof Map
                ? gameState.players.has(targetStr)
                : targetStr in gameState.players;
            if (hasPlayer) {
                targets.push({
                    type: 'player',
                    playerId: targetStr
                });
                continue;
            }

            // Check if it's a card ID
            if (gameState.cardInstances.has(targetStr)) {
                targets.push({
                    type: 'card',
                    cardInstanceId: targetStr
                });
                continue;
            }

            // Try to parse as card index from battlefield
            const index = parseInt(targetStr);
            if (!isNaN(index)) {
                // Find the card at that index across all battlefields
                let found = false;
                if (gameState.players instanceof Map) {
                    for (const [playerId, player] of gameState.players) {
                        const battlefieldZone = this.getFromMapOrObject(gameState.zones, player.battlefieldZoneId);
                        if (battlefieldZone && index >= 1 && index <= battlefieldZone.cards.length) {
                            const cardId = battlefieldZone.cards[index - 1];
                            targets.push({
                                type: 'card',
                                cardInstanceId: cardId
                            });
                            found = true;
                            break;
                        }
                    }
                } else {
                    for (const [playerId, player] of Object.entries(gameState.players)) {
                        const typedPlayer = player as IPlayer;
                        const battlefieldZone = this.getFromMapOrObject(gameState.zones, typedPlayer.battlefieldZoneId);
                        if (battlefieldZone && index >= 1 && index <= battlefieldZone.cards.length) {
                            const cardId = battlefieldZone.cards[index - 1];
                            targets.push({
                                type: 'card',
                                cardInstanceId: cardId
                            });
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    throw new Error(`Invalid target: ${targetStr}`);
                }
                continue;
            }

            // Try to find by card name
            let foundByName = false;
            for (const [cardId, cardInstance] of gameState.cardInstances) {
                if (cardInstance.definition?.name?.toLowerCase().includes(targetStr.toLowerCase())) {
                    targets.push({
                        type: 'card',
                        cardInstanceId: cardId
                    });
                    foundByName = true;
                    break;
                }
            }

            if (!foundByName) {
                throw new Error(`Target not found: ${targetStr}`);
            }
        }

        return targets;
    }
}