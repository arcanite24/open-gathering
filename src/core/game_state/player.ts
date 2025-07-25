import { IPlayer, ManaPool } from './interfaces';

/**
 * Implementation of the IPlayer interface.
 */
export class Player implements IPlayer {
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

  /**
   * Creates a new Player instance.
   * @param id Unique identifier for the player
   * @param life Player's starting life total (default: 20)
   */
  constructor(id: string, life: number = 20) {
    this.id = id;
    this.life = life;
    this.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    this.handZoneId = `hand_${id}`;
    this.libraryZoneId = `library_${id}`;
    this.graveyardZoneId = `graveyard_${id}`;
    this.exileZoneId = `exile_${id}`;
    this.battlefieldZoneId = `battlefield_${id}`;
    this.landsPlayedThisTurn = 0;
  }
}