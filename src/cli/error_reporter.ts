// src/cli/error_reporter.ts

import { GameError, ErrorCode } from '../core/errors';
import { IGameState, IPlayer } from '../core/game_state/interfaces';

/**
 * Provides enhanced error reporting and user guidance for CLI commands
 */
export class ErrorReporter {
  
  /**
   * Formats and displays an error with enhanced context and suggestions
   */
  static displayError(error: Error | GameError, gameState?: IGameState): void {
    console.log('\n❌ Error:');
    
    if (error instanceof GameError) {
      console.log(error.toDisplayString());
      
      // Add additional context based on game state
      if (gameState) {
        this.addGameStateContext(error, gameState);
      }
    } else {
      // Handle regular errors by converting them to GameError
      const gameError = this.convertToGameError(error);
      console.log(gameError.toDisplayString());
    }
    
    console.log(''); // Add blank line for readability
  }

  /**
   * Converts a regular Error to a more informative GameError
   */
  private static convertToGameError(error: Error): GameError {
    const message = error.message.toLowerCase();
    
    // Network/connection errors
    if (message.includes('econnrefused') || message.includes('network')) {
      return new GameError(
        ErrorCode.NetworkError,
        'Cannot connect to game server',
        'Make sure the server is running on the correct port (default: 3000)',
        { originalError: error.message }
      );
    }
    
    // Server errors
    if (message.includes('failed to start new game')) {
      return new GameError(
        ErrorCode.ServerError,
        'Failed to create new game',
        'Check that your deck names are valid or try again',
        { availableDecks: 'basics, simple_creatures, complex_cards', originalError: error.message }
      );
    }
    
    // Command parsing errors
    if (message.includes('usage:')) {
      return new GameError(
        ErrorCode.InvalidArguments,
        error.message,
        'Check the command syntax and try again',
        { helpCommand: 'Type "help" for available commands' }
      );
    }
    
    // Card not found errors
    if (message.includes('card not found')) {
      return new GameError(
        ErrorCode.CardNotFound,
        error.message,
        'Use card numbers (1, 2, 3...) or partial card names',
        { example: 'Example: "play 1" or "cast Plains"' }
      );
    }
    
    // Default case
    return new GameError(
      ErrorCode.UnknownError,
      error.message,
      'Try typing "help" for available commands',
      { originalError: error.message }
    );
  }

  /**
   * Adds game state-specific context to error messages
   */
  private static addGameStateContext(error: GameError, gameState: IGameState): void {
    const currentPlayer = this.getCurrentPlayer(gameState);
    
    if (!currentPlayer) return;
    
    // Add context based on error type
    switch (error.code) {
      case ErrorCode.CardNotFound:
      case ErrorCode.CardNotInHand:
        this.showHandContext(currentPlayer, gameState);
        break;
        
      case ErrorCode.CardNotOnBattlefield:
        this.showBattlefieldContext(currentPlayer, gameState);
        break;
        
      case ErrorCode.NotYourTurn:
      case ErrorCode.NotActivePlayer:
        this.showTurnContext(gameState);
        break;
        
      case ErrorCode.ActionNotAllowed:
      case ErrorCode.GamePhaseRestriction:
        this.showGamePhaseContext(gameState);
        break;
    }
  }

  /**
   * Shows the current player's hand for context
   */
  private static showHandContext(player: IPlayer, gameState: IGameState): void {
    const handZone = this.getZone(gameState, player.handZoneId);
    if (!handZone || handZone.cards.length === 0) {
      console.log('📋 Your hand is empty');
      return;
    }
    
    console.log('📋 Cards in your hand:');
    handZone.cards.forEach((cardId, index) => {
      const cardInstance = this.getCardInstance(gameState, cardId);
      if (cardInstance) {
        console.log(`  ${index + 1}. ${cardInstance.definition?.name || 'Unknown Card'}`);
      }
    });
  }

  /**
   * Shows the current player's battlefield for context
   */
  private static showBattlefieldContext(player: IPlayer, gameState: IGameState): void {
    const battlefieldZone = this.getZone(gameState, player.battlefieldZoneId);
    if (!battlefieldZone || battlefieldZone.cards.length === 0) {
      console.log('⚔️ Your battlefield is empty');
      return;
    }
    
    console.log('⚔️ Cards on your battlefield:');
    battlefieldZone.cards.forEach((cardId, index) => {
      const cardInstance = this.getCardInstance(gameState, cardId);
      if (cardInstance) {
        const name = cardInstance.definition?.name || 'Unknown Card';
        const tapped = cardInstance.isTapped ? ' (tapped)' : '';
        console.log(`  ${index + 1}. ${name}${tapped}`);
      }
    });
  }

  /**
   * Shows current turn and phase information
   */
  private static showTurnContext(gameState: IGameState): void {
    const activePlayer = this.getPlayer(gameState, gameState.activePlayerId);
    const priorityPlayer = this.getPlayer(gameState, gameState.priorityPlayerId);
    
    console.log('🎯 Game Status:');
    console.log(`  - Turn: ${gameState.turn || 1}`);
    console.log(`  - Active Player: ${activePlayer ? gameState.activePlayerId : 'Unknown'}`);
    console.log(`  - Priority Player: ${priorityPlayer ? gameState.priorityPlayerId : 'Unknown'}`);
  }

  /**
   * Shows current game phase information
   */
  private static showGamePhaseContext(gameState: IGameState): void {
    console.log('⏰ Current Phase Information:');
    console.log(`  - Turn: ${gameState.turn || 1}`);
    
    // Add phase and step information if available
    if ((gameState as any).phase) {
      console.log(`  - Phase: ${(gameState as any).phase}`);
    }
    if ((gameState as any).step) {
      console.log(`  - Step: ${(gameState as any).step}`);
    }
    
    console.log('  Use "pass" to pass priority or "advance" to advance the turn');
  }

  /**
   * Helper method to get current player
   */
  private static getCurrentPlayer(gameState: IGameState): IPlayer | null {
    return this.getPlayer(gameState, gameState.priorityPlayerId);
  }

  /**
   * Helper method to get a player by ID
   */
  private static getPlayer(gameState: IGameState, playerId: string): IPlayer | null {
    if (gameState.players instanceof Map) {
      return gameState.players.get(playerId) || null;
    } else {
      return gameState.players[playerId] || null;
    }
  }

  /**
   * Helper method to get a zone by ID
   */
  private static getZone(gameState: IGameState, zoneId: string) {
    if (gameState.zones instanceof Map) {
      return gameState.zones.get(zoneId);
    } else {
      return gameState.zones[zoneId];
    }
  }

  /**
   * Helper method to get a card instance by ID
   */
  private static getCardInstance(gameState: IGameState, cardId: string) {
    if (gameState.cardInstances instanceof Map) {
      return gameState.cardInstances.get(cardId);
    } else {
      return gameState.cardInstances[cardId];
    }
  }

  /**
   * Shows helpful suggestions for common CLI tasks
   */
  static showContextualHelp(gameState: IGameState): void {
    const currentPlayer = this.getCurrentPlayer(gameState);
    if (!currentPlayer) return;

    console.log('\n💡 Quick Help:');
    
    const handZone = this.getZone(gameState, currentPlayer.handZoneId);
    const battlefieldZone = this.getZone(gameState, currentPlayer.battlefieldZoneId);
    
    // Suggest actions based on current state
    if (handZone && handZone.cards.length > 0) {
      const hasLands = handZone.cards.some(cardId => {
        const card = this.getCardInstance(gameState, cardId);
        return card?.definition?.types?.includes('Land');
      });
      
      if (hasLands) {
        console.log('  • To play a land: "play <card number or name>"');
      }
      
      console.log('  • To cast a spell: "cast <card number or name>"');
    }
    
    if (battlefieldZone && battlefieldZone.cards.length > 0) {
      console.log('  • To activate an ability: "activate <card number> <ability number>"');
    }
    
    console.log('  • To pass priority: "pass"');
    console.log('  • To see game state: "state"');
    console.log('  • For all commands: "help"');
    console.log('');
  }
}
