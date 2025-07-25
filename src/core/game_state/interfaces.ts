/**
 * Represents a player's mana pool with colored mana amounts.
 */
export interface ManaPool {
  /** White mana */
  W: number;
  /** Blue mana */
  U: number;
  /** Black mana */
  B: number;
  /** Red mana */
  R: number;
  /** Green mana */
  G: number;
  /** Colorless/ generic mana */
  C: number;
}

/**
 * Represents a player in the game.
 */
export interface IPlayer {
  /** Unique identifier for the player */
  id: string;
  
  /** Player's life total */
  life: number;
  
  /** Player's current mana pool */
  manaPool: ManaPool;
  
  /** ID of the player's hand zone */
  handZoneId: string;
  
  /** ID of the player's library zone */
  libraryZoneId: string;
  
  /** ID of the player's graveyard zone */
  graveyardZoneId: string;
  
  /** ID of the player's exile zone */
  exileZoneId: string;
  
  /** ID of the player's battlefield zone */
  battlefieldZoneId: string;
  
  /** Number of lands played this turn */
  landsPlayedThisTurn: number;
}

/**
 * Represents a zone in the game (e.g., hand, library, battlefield).
 */
export interface IZone {
  /** Unique identifier for the zone */
  id: string;
  
  /** Name of the zone (e.g., 'Hand', 'Library') */
  name: string;
  
  /** Array of card instance IDs in this zone */
  cards: string[];
  
  /** ID of the player who owns this zone */
  ownerPlayerId: string;
}

/**
 * Represents a card definition (static card data from JSON).
 */
export interface ICardDefinition {
  /** Unique identifier for the card definition */
  id: string;
  
  /** Name of the card */
  name: string;
  
  /** Mana cost of the card (e.g., "{1}{W}{W}") */
  manaCost?: string;
  
  /** Converted mana cost */
  cmc?: number;
  
  /** Card types (e.g., ["Creature", "Instant"]) */
  types?: string[];
  
  /** Card subtypes (e.g., ["Human", "Soldier"]) */
  subtypes?: string[];
  
  /** Card supertypes (e.g., ["Legendary"]) */
  supertypes?: string[];
  
  /** Oracle text of the card */
  oracleText?: string;
  
  /** Power value for creatures */
  power?: string;
  
  /** Toughness value for creatures */
  toughness?: string;
  
  /** Loyalty value for planeswalkers */
  loyalty?: string;
  
  /** Abilities the card has */
  abilities?: Array<{
    /** Identifier for the ability implementation */
    key: string;
    
    /** Parameters specific to this ability instance */
    parameters: Record<string, any>;
  }>;
  
  /** Effects for instants/sorceries */
  effects?: Array<{
    /** Identifier for the effect implementation */
    key: string;
    
    /** Parameters specific to this effect instance */
    parameters: Record<string, any>;
  }>;
}

/**
 * Represents a specific instance of a card in the game state.
 */
export interface ICardInstance {
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
}

/**
 * Represents the complete game state.
 */
export interface IGameState {
  /** Map of player IDs to player objects */
  players: Map<string, IPlayer>;
  
  /** Map of zone IDs to zone objects */
  zones: Map<string, IZone>;
  
  /** Map of card instance IDs to card instance objects */
  cardInstances: Map<string, ICardInstance>;
  
  /** ID of the active player */
  activePlayerId: string;
  
  /** ID of the player with priority */
  priorityPlayerId: string;
  
  /** Current turn number */
  turn: number;
  
  /** Current phase of the turn */
  phase: string;
  
  /** Current step of the turn */
  step: string;
  
  /** ID of the stack zone */
  stackZoneId: string;
}