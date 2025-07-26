import { TapCost } from '../../../src/implementations/costs/tap_cost';
import { AddManaEffect } from '../../../src/implementations/effects/add_mana';
import { TapAddManaAbility } from '../../../src/implementations/abilities/activated_tap_add_mana';
import { IGameState, IPlayer, IZone, ICardInstance } from '../../../src/core/game_state/interfaces';
import { CardInstance } from '../../../src/core/game_state/card_instance';

describe('TapAddManaAbility', () => {
  let mockGameState: IGameState;
  let mockPlayer: IPlayer;
  let mockBattlefieldZone: IZone;
  let mockCardInstance: ICardInstance;
  let tapAddManaAbility: TapAddManaAbility;

  beforeEach(() => {
    // Create mock player
    mockPlayer = {
      id: 'player1',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
      handZoneId: 'hand1',
      libraryZoneId: 'library1',
      graveyardZoneId: 'graveyard1',
      exileZoneId: 'exile1',
      battlefieldZoneId: 'battlefield1',
      landsPlayedThisTurn: 0
    };
    
    // Create mock zone
    mockBattlefieldZone = {
      id: 'battlefield1',
      name: 'Battlefield',
      cards: ['card1'],
      ownerPlayerId: 'player1'
    };
    
    // Create mock card instance
    mockCardInstance = new CardInstance(
      'card1',
      'basic_plains',
      'player1',
      'player1',
      'battlefield1'
    );
    
    // Create mock game state
    mockGameState = {
      players: new Map([['player1', mockPlayer]]),
      zones: new Map([['battlefield1', mockBattlefieldZone]]),
      cardInstances: new Map([['card1', mockCardInstance]]),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Main1',
      step: 'Main',
      stackZoneId: 'stack'
    };
    
    // Create the ability
    tapAddManaAbility = new TapAddManaAbility('ability1', 'card1', 'W');
  });

  describe('canActivate', () => {
    it('should return true when the ability can be activated', () => {
      const result = tapAddManaAbility.canActivate(mockGameState, 'player1');
      expect(result).toBe(true);
    });
    
    it('should return false when the card is already tapped', () => {
      // Update the card instance to be tapped
      const tappedCardInstance = new CardInstance(
        'card1',
        'basic_plains',
        'player1',
        'player1',
        'battlefield1'
      );
      tappedCardInstance.isTapped = true;
      
      const gameStateWithTappedCard: IGameState = {
        ...mockGameState,
        cardInstances: new Map([['card1', tappedCardInstance]])
      };
      
      const result = tapAddManaAbility.canActivate(gameStateWithTappedCard, 'player1');
      expect(result).toBe(false);
    });
    
    it('should return false when the player does not control the card', () => {
      const result = tapAddManaAbility.canActivate(mockGameState, 'player2');
      expect(result).toBe(false);
    });
  });
  
  describe('activate', () => {
    it('should tap the card and add mana to the player pool', () => {
      const updatedState = tapAddManaAbility.activate(mockGameState, 'player1');
      
      // Check that the card is now tapped
      const cardInstance = updatedState.cardInstances.get('card1');
      expect(cardInstance?.isTapped).toBe(true);
      
      // Check that mana was added to the player's pool
      const player = updatedState.players.get('player1');
      expect(player?.manaPool.W).toBe(1);
    });
    
    it('should return the same state if the ability cannot be activated', () => {
      // Make the card already tapped
      const tappedCardInstance = new CardInstance(
        'card1',
        'basic_plains',
        'player1',
        'player1',
        'battlefield1'
      );
      tappedCardInstance.isTapped = true;
      
      const gameStateWithTappedCard: IGameState = {
        ...mockGameState,
        cardInstances: new Map([['card1', tappedCardInstance]])
      };
      
      const updatedState = tapAddManaAbility.activate(gameStateWithTappedCard, 'player1');
      expect(updatedState).toEqual(gameStateWithTappedCard);
    });
  });
});

describe('TapCost', () => {
  let tapCost: TapCost;
  let mockGameState: IGameState;
  let mockCardInstance: ICardInstance;

  beforeEach(() => {
    tapCost = new TapCost();
    
    // Create mock card instance
    mockCardInstance = new CardInstance(
      'card1',
      'basic_plains',
      'player1',
      'player1',
      'battlefield1'
    );
    
    // Create mock game state
    mockGameState = {
      players: new Map(),
      zones: new Map(),
      cardInstances: new Map([['card1', mockCardInstance]]),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Main1',
      step: 'Main',
      stackZoneId: 'stack'
    };
  });

  describe('canPay', () => {
    it('should return true when the card is not tapped', () => {
      const result = tapCost.canPay(mockGameState, 'card1');
      expect(result).toBe(true);
    });
    
    it('should return false when the card is already tapped', () => {
      // Update the card instance to be tapped
      const tappedCardInstance = new CardInstance(
        'card1',
        'basic_plains',
        'player1',
        'player1',
        'battlefield1'
      );
      tappedCardInstance.isTapped = true;
      
      const gameStateWithTappedCard: IGameState = {
        ...mockGameState,
        cardInstances: new Map([['card1', tappedCardInstance]])
      };
      
      const result = tapCost.canPay(gameStateWithTappedCard, 'card1');
      expect(result).toBe(false);
    });
    
    it('should return false when the card instance does not exist', () => {
      const result = tapCost.canPay(mockGameState, 'nonexistent');
      expect(result).toBe(false);
    });
  });
  
  describe('pay', () => {
    it('should tap the card', () => {
      const updatedState = tapCost.pay(mockGameState, 'card1');
      
      const cardInstance = updatedState.cardInstances.get('card1');
      expect(cardInstance?.isTapped).toBe(true);
    });
    
    it('should return the same state when the card instance does not exist', () => {
      const updatedState = tapCost.pay(mockGameState, 'nonexistent');
      expect(updatedState).toEqual(mockGameState);
    });
  });
});

describe('AddManaEffect', () => {
  let addManaEffect: AddManaEffect;
  let mockGameState: IGameState;
  let mockPlayer: IPlayer;
  let mockCardInstance: ICardInstance;

  beforeEach(() => {
    addManaEffect = new AddManaEffect('W');
    
    // Create mock player
    mockPlayer = {
      id: 'player1',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
      handZoneId: 'hand1',
      libraryZoneId: 'library1',
      graveyardZoneId: 'graveyard1',
      exileZoneId: 'exile1',
      battlefieldZoneId: 'battlefield1',
      landsPlayedThisTurn: 0
    };
    
    // Create mock card instance
    mockCardInstance = new CardInstance(
      'card1',
      'basic_plains',
      'player1',
      'player1',
      'battlefield1'
    );
    
    // Create mock game state
    mockGameState = {
      players: new Map([['player1', mockPlayer]]),
      zones: new Map(),
      cardInstances: new Map([['card1', mockCardInstance]]),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Main1',
      step: 'Main',
      stackZoneId: 'stack'
    };
  });

  describe('resolve', () => {
    it('should add white mana to the controller pool', () => {
      const updatedState = addManaEffect.resolve(mockGameState, { sourceCardInstanceId: 'card1' });
      
      const player = updatedState.players.get('player1');
      expect(player?.manaPool.W).toBe(1);
    });
    
    it('should return the same state when the source card instance does not exist', () => {
      const updatedState = addManaEffect.resolve(mockGameState, { sourceCardInstanceId: 'nonexistent' });
      expect(updatedState).toEqual(mockGameState);
    });
    
    it('should return the same state when the controller does not exist', () => {
      // Create a card with a nonexistent controller
      const cardWithoutController = new CardInstance(
        'card2',
        'basic_plains',
        'player1',
        'nonexistent',
        'battlefield1'
      );
      
      const gameStateWithoutController: IGameState = {
        ...mockGameState,
        cardInstances: new Map([['card2', cardWithoutController]])
      };
      
      const updatedState = addManaEffect.resolve(gameStateWithoutController, { sourceCardInstanceId: 'card2' });
      expect(updatedState).toEqual(gameStateWithoutController);
    });
  });
});