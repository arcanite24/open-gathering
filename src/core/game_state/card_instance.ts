import { ICardInstance, ICardDefinition, IGameState } from './interfaces';
import { AbilityRegistry } from '../abilities/registry';
import { IStaticAbility, ITriggeredAbility, IActivatedAbility } from '../abilities/interfaces';

/**
 * Implementation of the ICardInstance interface.
 */
export class CardInstance implements ICardInstance {
  /** The card definition for this instance */
  definition: ICardDefinition;

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
  
  /** Instances of static abilities this card has */
  staticAbilities: IStaticAbility[];
  
  /** Instances of triggered abilities this card has */
  triggeredAbilities: ITriggeredAbility[];
  
  /** Instances of activated abilities this card has */
  activatedAbilities: IActivatedAbility[];
  
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

  /** Whether the creature has first strike */
  hasFirstStrike?: boolean;

  /** Whether the creature has double strike */
  hasDoubleStrike?: boolean;

  /** Whether the creature has trample */
  hasTrample?: boolean;

  /**
   * Creates a new CardInstance.
   * @param id Unique runtime identifier for this card instance
   * @param definition The ICardDefinition for this card instance
   * @param ownerPlayerId ID of the player who owns this card
   * @param controllerPlayerId ID of the player who controls this card
   * @param currentZoneId ID of the zone where this card currently resides
   * @param abilityRegistry The AbilityRegistry to create ability instances
   * @param gameState The current game state (needed for ability creation)
   */
  constructor(
    id: string,
    definition: ICardDefinition,
    ownerPlayerId: string,
    controllerPlayerId: string,
    currentZoneId: string,
    gameState: IGameState
  ) {
    this.id = id;
    this.definition = definition;
    this.definitionId = definition.id;
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

    // Initialize abilities from card definition
    if (definition.abilities) {
      for (const abilityDef of definition.abilities) {
        const abilityInstance = gameState.abilityRegistry.createAbilityInstance(
          abilityDef.key,
          abilityDef.parameters,
          this.id,
          gameState
        );
        if (abilityInstance) {
          // Determine the type of ability and add to the correct array
          if ('applyEffect' in abilityInstance && 'removeEffect' in abilityInstance && 'getLayer' in abilityInstance) {
            this.staticAbilities.push(abilityInstance as IStaticAbility);
          } else if ('triggerCondition' in abilityInstance && 'checkTrigger' in abilityInstance) {
            this.triggeredAbilities.push(abilityInstance as ITriggeredAbility);
          } else if ('costs' in abilityInstance && 'canActivate' in abilityInstance) {
            this.activatedAbilities.push(abilityInstance as IActivatedAbility);
          }
        }
      }
    }

    // Copy types, power, toughness from definition for initial state
    this.types = definition.types;
    this.power = definition.power;
    this.toughness = definition.toughness;
  }

  // Add properties from ICardDefinition that are dynamic on CardInstance
  types?: string[];
  power?: string;
  toughness?: string;
}