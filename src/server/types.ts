import { IGameState } from '../core/game_state/interfaces';
import { Action } from '../core/engine';
import { Target } from '../core/abilities/interfaces';

/**
 * Request body for creating a new game.
 */
export interface CreateGameRequest {
  /** Player 1 deck (array of card definition IDs) */
  player1Deck: string[];
  /** Player 2 deck (array of card definition IDs) */
  player2Deck: string[];
}

/**
 * Response for creating a new game.
 */
export interface CreateGameResponse {
  /** Unique game ID */
  gameId: string;
  /** Initial game state */
  gameState: IGameState;
}

/**
 * Response for getting game state.
 */
export interface GetGameStateResponse {
  /** Current game state */
  gameState: IGameState;
}

/**
 * Request body for submitting an action.
 */
export interface SubmitActionRequest {
  /** ID of the player submitting the action */
  playerId: string;
  /** The action to submit */
  action: Action;
}

/**
 * Response for submitting an action.
 */
export interface SubmitActionResponse {
  /** Updated game state after the action */
  gameState: IGameState;
  /** Whether the action was successful */
  success: boolean;
  /** Error message if action failed */
  error?: string;
}

/**
 * Standard error response.
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** HTTP status code */
  status: number;
}
