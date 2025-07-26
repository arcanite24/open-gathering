import { IGameState } from '../game_state/interfaces';

/**
 * Base interface for all abilities.
 */
export interface IAbility {
  /** Unique identifier for the ability */
  id: string;
  
  /** ID of the card instance that is the source of this ability */
  sourceCardInstanceId: string;
}

/**
 * Base interface for costs (mana, tapping, etc.).
 */
export interface ICost {
  /**
   * Checks if the cost can be paid.
   * @param gameState The current game state
   * @param sourceCardInstanceId The ID of the source card instance
   * @returns True if the cost can be paid, false otherwise
   */
  canPay(gameState: IGameState, sourceCardInstanceId: string): boolean;
  
  /**
   * Pays the cost.
   * @param gameState The current game state
   * @param sourceCardInstanceId The ID of the source card instance
   * @returns The updated game state
   */
  pay(gameState: IGameState, sourceCardInstanceId: string): IGameState;
}

/**
 * Context for resolving an effect.
 */
export interface EffectContext {
  /** ID of the card instance that is the source of this effect */
  sourceCardInstanceId: string;
  
  /** Optional targets for the effect */
  targets?: Target[];
}

/**
 * Represents a target for an effect.
 */
export interface Target {
  /** ID of the targeted card instance */
  cardInstanceId?: string;
  
  /** ID of the targeted player */
  playerId?: string;
  
  /** Other targeting information */
  [key: string]: any;
}

/**
 * Base interface for effects that can be resolved.
 */
export interface IEffect {
  /**
   * Resolves the effect and returns the new game state.
   * @param gameState The current game state
   * @param context The context for resolving this effect
   * @returns The new game state after resolving the effect
   */
  resolve(gameState: IGameState, context: EffectContext): IGameState;
}

/**
 * Interface for activated abilities.
 */
export interface IActivatedAbility extends IAbility {
  /** Costs required to activate this ability */
  costs: ICost[];
  
  /** The effect that occurs when this ability is activated */
  effect: IEffect;
  
  /**
   * Checks if this ability can be activated in the current game state.
   * @param gameState The current game state
   * @param playerId The ID of the player attempting to activate the ability
   * @returns True if the ability can be activated, false otherwise
   */
  canActivate(gameState: IGameState, playerId: string): boolean;
  
  /**
   * Activates this ability.
   * @param gameState The current game state
   * @param playerId The ID of the player activating the ability
   * @param targets Optional targets for the ability
   * @returns The updated game state
   */
  activate(gameState: IGameState, playerId: string, targets?: Target[]): IGameState;
}

/**
 * Represents a condition that triggers a triggered ability.
 */
export interface TriggerCondition {
  /** The type of event that triggers this ability */
  eventType: string;
  
  /** Additional conditions for the trigger */
  [key: string]: any;
}

/**
 * Represents a game event that can trigger abilities.
 */
export interface GameEvent {
  /** The type of event */
  type: string;
  
  /** Payload containing event details */
  payload: any;
}

/**
 * Interface for triggered abilities.
 */
export interface ITriggeredAbility extends IAbility {
  /** The condition that triggers this ability */
  triggerCondition: TriggerCondition;
  
  /** The effect that occurs when this ability is triggered */
  effect: IEffect;
  
  /**
   * Checks if this ability should trigger based on a game event.
   * @param event The game event
   * @param gameState The current game state
   * @returns True if the ability should trigger, false otherwise
   */
  checkTrigger(event: GameEvent, gameState: IGameState): boolean;
  
  /**
   * Resolves this triggered ability.
   * @param gameState The current game state
   * @returns The updated game state
   */
  resolve(gameState: IGameState): IGameState;
}

/**
 * Interface for static abilities.
 */
export interface IStaticAbility extends IAbility {
  /**
   * Applies the effect of this static ability to the game state.
   * @param gameState The current game state
   * @returns The new game state with the effect applied
   */
  applyEffect(gameState: IGameState): IGameState;
  
  /**
   * Removes the effect of this static ability from the game state.
   * @param gameState The current game state
   * @returns The new game state with the effect removed
   */
  removeEffect(gameState: IGameState): IGameState;
  
  /**
   * Gets the layer at which this static ability applies.
   * @returns The layer number
   */
  getLayer(): number;
}