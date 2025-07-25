import { IGameState, IPlayer, IZone, ICardInstance } from './interfaces';
import { Player } from './player';
import { Zone } from './zone';
import { CardInstance } from './card_instance';

/**
 * Implementation of the IGameState interface.
 */
export class GameState implements IGameState {
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

  /**
   * Creates a new GameState.
   * @param player1 First player
   * @param player2 Second player
   */
  constructor(player1: Player, player2: Player) {
    // Initialize players map
    this.players = new Map<string, IPlayer>([
      [player1.id, player1],
      [player2.id, player2]
    ]);
    
    // Initialize zones map with player zones
    this.zones = new Map<string, IZone>();
    
    // Create zones for both players
    [player1, player2].forEach(player => {
      const handZone = new Zone(player.handZoneId, 'Hand', player.id);
      const libraryZone = new Zone(player.libraryZoneId, 'Library', player.id);
      const graveyardZone = new Zone(player.graveyardZoneId, 'Graveyard', player.id);
      const exileZone = new Zone(player.exileZoneId, 'Exile', player.id);
      const battlefieldZone = new Zone(player.battlefieldZoneId, 'Battlefield', player.id);
      
      this.zones.set(handZone.id, handZone);
      this.zones.set(libraryZone.id, libraryZone);
      this.zones.set(graveyardZone.id, graveyardZone);
      this.zones.set(exileZone.id, exileZone);
      this.zones.set(battlefieldZone.id, battlefieldZone);
    });
    
    // Create a global stack zone
    const stackZone = new Zone('stack', 'Stack', 'game');
    this.zones.set(stackZone.id, stackZone);
    this.stackZoneId = stackZone.id;
    
    // Initialize empty card instances map
    this.cardInstances = new Map<string, ICardInstance>();
    
    // Set initial game state values
    this.activePlayerId = player1.id;
    this.priorityPlayerId = player1.id;
    this.turn = 1;
    this.phase = 'Beginning'; // Default to beginning phase
    this.step = 'Untap'; // Default to untap step
  }

  /**
   * Gets a player by ID.
   * @param id The player ID
   * @returns The player object or undefined if not found
   */
  getPlayer(id: string): IPlayer | undefined {
    return this.players.get(id);
  }

  /**
   * Gets a zone by ID.
   * @param id The zone ID
   * @returns The zone object or undefined if not found
   */
  getZone(id: string): IZone | undefined {
    return this.zones.get(id);
  }

  /**
   * Gets a card instance by ID.
   * @param id The card instance ID
   * @returns The card instance object or undefined if not found
   */
  getCardInstance(id: string): ICardInstance | undefined {
    return this.cardInstances.get(id);
  }
}