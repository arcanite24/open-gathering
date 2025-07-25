import { IZone } from './interfaces';

/**
 * Implementation of the IZone interface.
 */
export class Zone implements IZone {
  /** Unique identifier for the zone */
  id: string;
  
  /** Name of the zone (e.g., 'Hand', 'Library') */
  name: string;
  
  /** Array of card instance IDs in this zone */
  cards: string[];
  
  /** ID of the player who owns this zone */
  ownerPlayerId: string;

  /**
   * Creates a new Zone instance.
   * @param id Unique identifier for the zone
   * @param name Name of the zone
   * @param ownerPlayerId ID of the player who owns this zone
   */
  constructor(id: string, name: string, ownerPlayerId: string) {
    this.id = id;
    this.name = name;
    this.cards = [];
    this.ownerPlayerId = ownerPlayerId;
  }

  /**
   * Adds a card to this zone.
   * @param cardId The ID of the card to add
   */
  addCard(cardId: string): void {
    if (!this.cards.includes(cardId)) {
      this.cards.push(cardId);
    }
  }

  /**
   * Removes a card from this zone.
   * @param cardId The ID of the card to remove
   * @returns True if the card was removed, false if it wasn't in the zone
   */
  removeCard(cardId: string): boolean {
    const index = this.cards.indexOf(cardId);
    if (index !== -1) {
      this.cards.splice(index, 1);
      return true;
    }
    return false;
  }
}