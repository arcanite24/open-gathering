// src/core/errors.ts

export enum ErrorCode {
  // General errors
  UnknownError = "UNKNOWN_ERROR",
  CommandNotFound = "COMMAND_NOT_FOUND",
  InvalidCommand = "INVALID_COMMAND",
  
  // Card-related errors
  InvalidCard = "INVALID_CARD",
  CardNotFound = "CARD_NOT_FOUND",
  CardNotInHand = "CARD_NOT_IN_HAND",
  CardNotOnBattlefield = "CARD_NOT_ON_BATTLEFIELD",
  
  // Target-related errors
  InvalidTarget = "INVALID_TARGET",
  NoValidTargets = "NO_VALID_TARGETS",
  TargetRequired = "TARGET_REQUIRED",
  
  // Zone-related errors
  InvalidZone = "INVALID_ZONE",
  ZoneNotFound = "ZONE_NOT_FOUND",
  
  // Game state errors
  NotEnoughMana = "NOT_ENOUGH_MANA",
  NotYourTurn = "NOT_YOUR_TURN",
  ActionNotAllowed = "ACTION_NOT_ALLOWED",
  GamePhaseRestriction = "GAME_PHASE_RESTRICTION",
  
  // Player-related errors
  PlayerNotFound = "PLAYER_NOT_FOUND",
  NotActivePlayer = "NOT_ACTIVE_PLAYER",
  
  // Network/Server errors
  NetworkError = "NETWORK_ERROR",
  ServerError = "SERVER_ERROR",
  GameNotFound = "GAME_NOT_FOUND",
  
  // CLI-specific errors
  InvalidArguments = "INVALID_ARGUMENTS",
  InsufficientArguments = "INSUFFICIENT_ARGUMENTS",
  AmbiguousCommand = "AMBIGUOUS_COMMAND",
}

export class GameError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public suggestion?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "GameError";
  }

  /**
   * Creates a formatted error message suitable for displaying to users
   */
  toDisplayString(): string {
    let display = this.message;
    
    if (this.suggestion) {
      display += `\n💡 Suggestion: ${this.suggestion}`;
    }
    
    if (this.context && Object.keys(this.context).length > 0) {
      display += '\n📝 Context:';
      for (const [key, value] of Object.entries(this.context)) {
        display += `\n  - ${key}: ${value}`;
      }
    }
    
    return display;
  }

  /**
   * Creates a GameError from a network/server error
   */
  static fromNetworkError(originalError: Error, suggestion?: string): GameError {
    if (originalError.message.includes('not found')) {
      return new GameError(
        ErrorCode.GameNotFound,
        'Game session not found',
        suggestion || 'Use "new-game" to start a new game',
        { originalError: originalError.message }
      );
    }
    
    if (originalError.message.includes('timeout') || originalError.message.includes('ETIMEDOUT')) {
      return new GameError(
        ErrorCode.NetworkError,
        'Request timed out',
        suggestion || 'Check your connection and try again',
        { originalError: originalError.message }
      );
    }
    
    return new GameError(
      ErrorCode.ServerError,
      originalError.message,
      suggestion || 'Please try again or restart the CLI',
      { originalError: originalError.message }
    );
  }
}
