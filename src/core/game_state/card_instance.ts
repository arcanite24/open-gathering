import { ICardInstance } from './interfaces';

/**
 * Implementation of the ICardInstance interface.
 */
export class CardInstance implements ICardInstance {
  /** Unique runtime identifier for this card instance */
  id: string;
  
  /** ID linking to the ICardDefinition */
  definitionId: string;
  
  /** ID of the player who owns this card */
  ownerPlayerId: string;
  
  /** ID of the player who controls this card */
  controllerPlayerId: string;
  
  /** ID of the zone where this card currently resides */
  currentZoneId: string;
  
  /** Whether the card is tapped */
  isTapped: boolean;
  
  /** Amount of damage marked on this card */
  damageMarked: number;
  
  /** Counters on this card, mapping counter type to count */
  counters: Map<string, number>;
  
  /** IDs of static abilities this card has */
  staticAbilities: string[];
  
  /** IDs of triggered abilities this card has */
  triggeredAbilities: string[];
  
  /** IDs of activated abilities this card has */
  activatedAbilities: string[];
  
  /** Turn when the card entered the battlefield (for summoning sickness) */
  turnEnteredBattlefield?: number;
  
  /** Whether the card has summoning sickness */
  hasSummoningSickness?: boolean;

  /** Whether the card is currently attacking */
  isAttacking?: boolean;

  /** Whether the card is currently blocking */
  isBlocking?: boolean;

  /** The ID of the card this creature is blocking */
  blocking?: string;

  /** The IDs of the cards that are blocking this creature */
  blockedBy?: string[];

  /**
   * Creates a new CardInstance.
   * @param id Unique runtime identifier for this card instance
   * @param definitionId ID linking to the ICardDefinition
   * @param ownerPlayerId ID of the player who owns this card
   * @param controllerPlayerId ID of the player who controls this card
   * @param currentZoneId ID of the zone where this card currently resides
   */
  constructor(
    id: string,
    definitionId: string,
    ownerPlayerId: string,
    controllerPlayerId: string,
    currentZoneId: string
  ) {
    this.id = id;
    this.definitionId = definitionId;
    this.ownerPlayerId = ownerPlayerId;
    this.controllerPlayerId = controllerPlayerId;
    this.currentZoneId = currentZoneId;
    this.isTapped = false;
    this.damageMarked = 0;
    this.counters = new Map<string, number>();
    this.staticAbilities = [];
    this.triggeredAbilities = [];
    this.activatedAbilities = [];
    this.turnEnteredBattlefield = undefined;
    this.hasSummoningSickness = undefined;
    this.isAttacking = false;
    this.isBlocking = false;
    this.blocking = undefined;
    this.blockedBy = [];
  }
}