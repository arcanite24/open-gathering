import { Action } from '../core/game_state/interfaces';
import { IGameState, ICardInstance, IPlayer } from '../core/game_state/interfaces';
import { Target } from '../core/abilities/interfaces';
import { GameError, ErrorCode } from '../core/errors';

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
            throw new GameError(
                ErrorCode.PlayerNotFound,
                'No priority player found',
                'This appears to be a game state issue. Try restarting the game.',
                { priorityPlayerId: gameState.priorityPlayerId }
            );
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
                throw new GameError(
                    ErrorCode.CommandNotFound,
                    `Unknown game command: ${command}`,
                    'Available commands: play, cast, activate, pass, advance',
                    {
                        command,
                        availableCommands: ['play', 'cast', 'activate', 'pass', 'advance']
                    }
                );
        }
    }

    /**
     * Parse play land action
     */
    private parsePlayAction(args: string[], player: IPlayer, gameState: IGameState): Action {
        if (args.length === 0) {
            throw new GameError(
                ErrorCode.InsufficientArguments,
                'Missing card identifier for play command',
                'Specify which card to play using its number or name',
                {
                    usage: 'play <card_identifier>',
                    example: 'play 1  or  play Plains'
                }
            );
        }

        const cardId = this.resolveCardFromHand(args[0], player, gameState);
        const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);

        if (!cardInstance?.definition?.types?.includes('Land')) {
            const cardName = cardInstance?.definition?.name || 'Unknown Card';
            throw new GameError(
                ErrorCode.ActionNotAllowed,
                `Cannot play ${cardName} - only lands can be played with the play command`,
                'Use "cast" command for non-land cards',
                {
                    cardName,
                    cardTypes: cardInstance?.definition?.types || [],
                    correctCommand: `cast ${args[0]}`
                }
            );
        }

        return { type: 'PLAY_LAND', cardId };
    }

    /**
     * Parse cast spell action
     */
    private parseCastAction(args: string[], player: IPlayer, gameState: IGameState): Action {
        if (args.length === 0) {
            throw new GameError(
                ErrorCode.InsufficientArguments,
                'Missing card identifier for cast command',
                'Specify which card to cast using its number or name',
                {
                    usage: 'cast <card_identifier> [targets...]',
                    example: 'cast 2  or  cast Lightning Bolt player1'
                }
            );
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
            throw new GameError(
                ErrorCode.InsufficientArguments,
                'Missing arguments for activate command',
                'Specify both the card and ability to activate',
                {
                    usage: 'activate <card_identifier> <ability_identifier> [targets...]',
                    example: 'activate 1 1  or  activate "Llanowar Elves" 1'
                }
            );
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
            throw new GameError(
                ErrorCode.ZoneNotFound,
                'Player has no hand zone',
                'This appears to be a game state issue. Try restarting the game.',
                { playerId: player.id, handZoneId: player.handZoneId }
            );
        }

        if (handZone.cards.length === 0) {
            throw new GameError(
                ErrorCode.CardNotInHand,
                'Your hand is empty',
                'Draw cards or wait for your draw step',
                { handSize: 0 }
            );
        }

        // Try to parse as index (1-based)
        const index = parseInt(identifier);
        if (!isNaN(index)) {
            if (index < 1 || index > handZone.cards.length) {
                throw new GameError(
                    ErrorCode.InvalidCard,
                    `Invalid card number ${index}`,
                    `Choose a number between 1 and ${handZone.cards.length}`,
                    {
                        providedIndex: index,
                        validRange: `1-${handZone.cards.length}`,
                        handSize: handZone.cards.length
                    }
                );
            }
            return handZone.cards[index - 1];
        }

        // Try to find by card ID
        if (handZone.cards.includes(identifier)) {
            return identifier;
        }

        // Try to find by card name
        const matchingCards: { cardId: string, name: string }[] = [];
        for (const cardId of handZone.cards) {
            const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);
            if (cardInstance?.definition?.name?.toLowerCase().includes(identifier.toLowerCase())) {
                matchingCards.push({
                    cardId,
                    name: cardInstance.definition.name
                });
            }
        }

        if (matchingCards.length === 0) {
            // Get available card names for suggestion
            const availableCards = handZone.cards.map((cardId, index) => {
                const card = this.getFromMapOrObject(gameState.cardInstances, cardId);
                return `${index + 1}. ${card?.definition?.name || 'Unknown'}`;
            });

            throw new GameError(
                ErrorCode.CardNotFound,
                `No card matching "${identifier}" found in hand`,
                'Use the card number or check the exact spelling',
                {
                    searchTerm: identifier,
                    availableCards,
                    handSize: handZone.cards.length
                }
            );
        }

        if (matchingCards.length > 1) {
            throw new GameError(
                ErrorCode.AmbiguousCommand,
                `Multiple cards match "${identifier}"`,
                'Be more specific or use the card number instead',
                {
                    searchTerm: identifier,
                    matches: matchingCards.map(c => c.name),
                    suggestion: 'Use card numbers for precise selection'
                }
            );
        }

        return matchingCards[0].cardId;
    }

    /**
     * Resolve a card identifier from battlefield to actual card ID
     */
    private resolveCardFromBattlefield(identifier: string, player: IPlayer, gameState: IGameState): string {
        const battlefieldZone = this.getFromMapOrObject(gameState.zones, player.battlefieldZoneId);
        if (!battlefieldZone) {
            throw new GameError(
                ErrorCode.ZoneNotFound,
                'Player has no battlefield zone',
                'This appears to be a game state issue. Try restarting the game.',
                { playerId: player.id, battlefieldZoneId: player.battlefieldZoneId }
            );
        }

        if (battlefieldZone.cards.length === 0) {
            throw new GameError(
                ErrorCode.CardNotOnBattlefield,
                'Your battlefield is empty',
                'You need to have permanents on the battlefield to activate abilities',
                { battlefieldSize: 0 }
            );
        }

        // Try to parse as index (1-based)
        const index = parseInt(identifier);
        if (!isNaN(index)) {
            if (index < 1 || index > battlefieldZone.cards.length) {
                throw new GameError(
                    ErrorCode.InvalidCard,
                    `Invalid card number ${index}`,
                    `Choose a number between 1 and ${battlefieldZone.cards.length}`,
                    {
                        providedIndex: index,
                        validRange: `1-${battlefieldZone.cards.length}`,
                        battlefieldSize: battlefieldZone.cards.length
                    }
                );
            }
            return battlefieldZone.cards[index - 1];
        }

        // Try to find by card ID
        if (battlefieldZone.cards.includes(identifier)) {
            return identifier;
        }

        // Try to find by card name
        const matchingCards: { cardId: string, name: string }[] = [];
        for (const cardId of battlefieldZone.cards) {
            const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);
            if (cardInstance?.definition?.name?.toLowerCase().includes(identifier.toLowerCase())) {
                matchingCards.push({
                    cardId,
                    name: cardInstance.definition.name
                });
            }
        }

        if (matchingCards.length === 0) {
            // Get available card names for suggestion
            const availableCards = battlefieldZone.cards.map((cardId, index) => {
                const card = this.getFromMapOrObject(gameState.cardInstances, cardId);
                return `${index + 1}. ${card?.definition?.name || 'Unknown'}`;
            });

            throw new GameError(
                ErrorCode.CardNotFound,
                `No card matching "${identifier}" found on battlefield`,
                'Use the card number or check the exact spelling',
                {
                    searchTerm: identifier,
                    availableCards,
                    battlefieldSize: battlefieldZone.cards.length
                }
            );
        }

        if (matchingCards.length > 1) {
            throw new GameError(
                ErrorCode.AmbiguousCommand,
                `Multiple cards match "${identifier}"`,
                'Be more specific or use the card number instead',
                {
                    searchTerm: identifier,
                    matches: matchingCards.map(c => c.name),
                    suggestion: 'Use card numbers for precise selection'
                }
            );
        }

        return matchingCards[0].cardId;
    }

    /**
     * Resolve ability identifier to ability ID
     */
    private resolveAbilityId(identifier: string, cardId: string, gameState: IGameState): string {
        const cardInstance = this.getFromMapOrObject(gameState.cardInstances, cardId);
        if (!cardInstance) {
            throw new GameError(
                ErrorCode.CardNotFound,
                'Card instance not found',
                'This appears to be a game state issue. Try restarting the game.',
                { cardId }
            );
        }

        const abilities = cardInstance.activatedAbilities;
        if (abilities.length === 0) {
            throw new GameError(
                ErrorCode.ActionNotAllowed,
                `${cardInstance.definition?.name || 'This card'} has no activated abilities`,
                'Only cards with activated abilities can be used with the activate command',
                {
                    cardName: cardInstance.definition?.name || 'Unknown',
                    cardId,
                    abilityCount: 0
                }
            );
        }

        // Try to parse as index (1-based)
        const index = parseInt(identifier);
        if (!isNaN(index)) {
            if (index < 1 || index > abilities.length) {
                const abilityList = abilities.map((ability, i) =>
                    `${i + 1}. ${ability.id}`
                );

                throw new GameError(
                    ErrorCode.InvalidTarget,
                    `Invalid ability number ${index}`,
                    `Choose a number between 1 and ${abilities.length}`,
                    {
                        providedIndex: index,
                        validRange: `1-${abilities.length}`,
                        availableAbilities: abilityList,
                        cardName: cardInstance.definition?.name || 'Unknown'
                    }
                );
            }
            return abilities[index - 1].id;
        }

        // Try to find by ability ID
        for (const ability of abilities) {
            if (ability.id === identifier) {
                return ability.id;
            }
        }

        // Show available abilities
        const abilityList = abilities.map((ability, i) =>
            `${i + 1}. ${ability.id}`
        );

        throw new GameError(
            ErrorCode.InvalidTarget,
            `Ability "${identifier}" not found`,
            'Use the ability number for precise selection',
            {
                searchTerm: identifier,
                availableAbilities: abilityList,
                cardName: cardInstance.definition?.name || 'Unknown'
            }
        );
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