import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from './game_state/interfaces';
import { Player } from './game_state/player';
import { Zone } from './game_state/zone';
import { CardInstance } from './game_state/card_instance';
import { TurnManager } from './rules/turn_manager';
import { PriorityManager } from './rules/priority_manager';
import { canPlayLand, executePlayLand } from './actions/play_land';

// Define the Action type
export type Action = 
  | { type: 'PLAY_LAND', cardId: string }
  | { type: 'PASS_PRIORITY' }
  | { type: 'ADVANCE_TURN' };

/**
 * The main engine orchestrator class.
 */
export class Engine {
  private gameState: IGameState;
  private turnManager: TurnManager;
  private priorityManager: PriorityManager;
  
  /**
   * Creates a new Engine instance.
   */
  constructor() {
    this.turnManager = new TurnManager();
    this.priorityManager = new PriorityManager();
    // gameState will be initialized in startGame
    this.gameState = {} as IGameState;
  }
  
  /**
   * Initializes a new game with the provided decks.
   * @param player1Deck Player 1's deck
   * @param player2Deck Player 2's deck
   */
  startGame(player1Deck: ICardDefinition[], player2Deck: ICardDefinition[]): void {
    // Create players
    const player1 = new Player('player1');
    const player2 = new Player('player2');
    
    // Create zones for both players
    const zones = new Map<string, IZone>();
    
    // Create zones for player 1
    const p1HandZone = new Zone(player1.handZoneId, 'Hand', player1.id);
    const p1LibraryZone = new Zone(player1.libraryZoneId, 'Library', player1.id);
    const p1GraveyardZone = new Zone(player1.graveyardZoneId, 'Graveyard', player1.id);
    const p1ExileZone = new Zone(player1.exileZoneId, 'Exile', player1.id);
    const p1BattlefieldZone = new Zone(player1.battlefieldZoneId, 'Battlefield', player1.id);
    
    zones.set(p1HandZone.id, p1HandZone);
    zones.set(p1LibraryZone.id, p1LibraryZone);
    zones.set(p1GraveyardZone.id, p1GraveyardZone);
    zones.set(p1ExileZone.id, p1ExileZone);
    zones.set(p1BattlefieldZone.id, p1BattlefieldZone);
    
    // Create zones for player 2
    const p2HandZone = new Zone(player2.handZoneId, 'Hand', player2.id);
    const p2LibraryZone = new Zone(player2.libraryZoneId, 'Library', player2.id);
    const p2GraveyardZone = new Zone(player2.graveyardZoneId, 'Graveyard', player2.id);
    const p2ExileZone = new Zone(player2.exileZoneId, 'Exile', player2.id);
    const p2BattlefieldZone = new Zone(player2.battlefieldZoneId, 'Battlefield', player2.id);
    
    zones.set(p2HandZone.id, p2HandZone);
    zones.set(p2LibraryZone.id, p2LibraryZone);
    zones.set(p2GraveyardZone.id, p2GraveyardZone);
    zones.set(p2ExileZone.id, p2ExileZone);
    zones.set(p2BattlefieldZone.id, p2BattlefieldZone);
    
    // Create stack zone
    const stackZone = new Zone('stack', 'Stack', 'game');
    zones.set(stackZone.id, stackZone);
    
    // Create card instances and populate libraries
    const cardInstances = new Map<string, ICardInstance>();
    
    // Process player 1's deck
    const p1LibraryCards: string[] = [];
    player1Deck.forEach((cardDef, index) => {
      const cardId = `p1_card_${index}`;
      const cardInstance = new CardInstance(
        cardId,
        cardDef.id,
        player1.id,
        player1.id,
        p1LibraryZone.id
      );
      cardInstances.set(cardId, cardInstance);
      p1LibraryCards.push(cardId);
    });
    p1LibraryZone.cards = p1LibraryCards;
    
    // Process player 2's deck
    const p2LibraryCards: string[] = [];
    player2Deck.forEach((cardDef, index) => {
      const cardId = `p2_card_${index}`;
      const cardInstance = new CardInstance(
        cardId,
        cardDef.id,
        player2.id,
        player2.id,
        p2LibraryZone.id
      );
      cardInstances.set(cardId, cardInstance);
      p2LibraryCards.push(cardId);
    });
    p2LibraryZone.cards = p2LibraryCards;
    
    // Create initial game state
    this.gameState = {
      players: new Map([
        [player1.id, player1],
        [player2.id, player2]
      ]),
      zones,
      cardInstances,
      activePlayerId: player1.id,
      priorityPlayerId: player1.id,
      turn: 1,
      phase: 'Beginning',
      step: 'Untap',
      stackZoneId: stackZone.id
    };
    
    // Draw initial hands (7 cards each)
    this.drawInitialHands();
  }
  
  /**
   * Draws initial hands for both players.
   */
  private drawInitialHands(): void {
    // Draw 7 cards for each player
    for (let i = 0; i < 7; i++) {
      this.drawCard('player1');
      this.drawCard('player2');
    }
  }
  
  /**
   * Draws a card for a player.
   * @param playerId The ID of the player drawing a card
   */
  private drawCard(playerId: string): void {
    const player = this.gameState.players.get(playerId);
    if (!player) return;
    
    const libraryZone = this.gameState.zones.get(player.libraryZoneId);
    const handZone = this.gameState.zones.get(player.handZoneId);
    
    if (!libraryZone || !handZone || libraryZone.cards.length === 0) {
      // Player cannot draw a card - deck is empty
      // In a full implementation, this would cause the player to lose
      return;
    }
    
    // Take the first card from the library (top of the deck)
    const cardId = libraryZone.cards.shift();
    if (cardId) {
      // Add it to the player's hand
      handZone.cards.push(cardId);
      
      // Update the card's zone
      const cardInstance = this.gameState.cardInstances.get(cardId);
      if (cardInstance) {
        cardInstance.currentZoneId = handZone.id;
      }
    }
  }
  
  /**
   * Returns the current game state.
   * @returns The current game state
   */
  getState(): IGameState {
    return this.gameState;
  }
  
  /**
   * Submits an action from a player.
   * @param playerId The ID of the player submitting the action
   * @param action The action to submit
   */
  submitAction(playerId: string, action: Action): void {
    // Check if it's the player's turn to act (based on priority)
    if (playerId !== this.gameState.priorityPlayerId) {
      // In a full implementation, we might throw an error
      return;
    }
    
    // Process the action based on its type
    switch (action.type) {
      case 'PLAY_LAND':
        // Check if the player can play the land
        if (canPlayLand(this.gameState, playerId, action.cardId)) {
          // Execute the play land action
          this.gameState = executePlayLand(this.gameState, playerId, action.cardId);
        }
        break;
        
      case 'PASS_PRIORITY':
        // Pass priority to the next player
        this.gameState = this.priorityManager.passPriority(this.gameState);
        break;
        
      case 'ADVANCE_TURN':
        // Advance to the next turn/phase/step
        this.gameState = this.turnManager.advance(this.gameState);
        // Set priority to the active player at the start of the new step
        this.gameState = this.priorityManager.setActivePlayerPriority(this.gameState);
        break;
    }
  }
}