import { StackManager } from '../../../src/core/rules/stack_manager';
import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../../../src/core/game_state/interfaces';
import { CardInstance } from '../../../src/core/game_state/card_instance';

describe('StackManager', () => {
  let stackManager: StackManager;
  let mockGameState: IGameState;
  let mockPlayer1: IPlayer;
  let mockPlayer2: IPlayer;
  let mockStackZone: IZone;
  let mockBattlefieldZone1: IZone;
  let mockBattlefieldZone2: IZone;
  let mockCardInstance: ICardInstance;

  beforeEach(() => {
    stackManager = new StackManager();

    // Create mock players
    mockPlayer1 = {
      id: 'player1',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
      handZoneId: 'hand1',
      libraryZoneId: 'library1',
      graveyardZoneId: 'graveyard1',
      exileZoneId: 'exile1',
      battlefieldZoneId: 'battlefield1',
      landsPlayedThisTurn: 0,
      hasLost: false
    };

    mockPlayer2 = {
      id: 'player2',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
      handZoneId: 'hand2',
      libraryZoneId: 'library2',
      graveyardZoneId: 'graveyard2',
      exileZoneId: 'exile2',
      battlefieldZoneId: 'battlefield2',
      landsPlayedThisTurn: 0,
      hasLost: false
    };

    // Create mock zones
    mockStackZone = {
      id: 'stack',
      name: 'Stack',
      cards: ['card1'],
      ownerPlayerId: 'game'
    };

    mockBattlefieldZone1 = {
      id: 'battlefield1',
      name: 'Battlefield',
      cards: [],
      ownerPlayerId: 'player1'
    };

    mockBattlefieldZone2 = {
      id: 'battlefield2',
      name: 'Battlefield',
      cards: [],
      ownerPlayerId: 'player2'
    };

    // Create mock card definition
    const mockCardDefinition = {
      id: 'creature1',
      name: 'Test Creature',
      types: ['Creature'],
      manaCost: '{2}{G}',
      cmc: 3,
      power: '2',
      toughness: '2'
    };

    // Create mock game state first
    mockGameState = {
      players: new Map([
        ['player1', mockPlayer1],
        ['player2', mockPlayer2]
      ]),
      zones: new Map([
        ['stack', mockStackZone],
        ['battlefield1', mockBattlefieldZone1],
        ['battlefield2', mockBattlefieldZone2]
      ]),
      cardInstances: new Map(),
      cardDefinitions: new Map([['creature1', mockCardDefinition]]),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Main1',
      step: 'Main',
      stackZoneId: 'stack',
      abilityRegistry: {} as any
    };

    // Create mock card instance
    mockCardInstance = new CardInstance(
      'card1',
      mockCardDefinition,
      'player1',
      'player1',
      'stack',
      mockGameState
    );

    // Update game state with card instance
    mockGameState.cardInstances.set('card1', mockCardInstance);
  });

  describe('resolveTop', () => {
    it('should resolve the top creature spell on the stack', () => {
      const updatedState = stackManager.resolveTop(mockGameState);

      // Check that the card is no longer in the stack
      const stackZone = updatedState.zones.get('stack');
      expect(stackZone?.cards).toHaveLength(0);

      // Check that the card is now in the controller's battlefield
      const battlefieldZone = updatedState.zones.get('battlefield1');
      expect(battlefieldZone?.cards).toContain('card1');

      // Check that the card instance has been updated
      const cardInstance = updatedState.cardInstances.get('card1');
      expect(cardInstance?.currentZoneId).toBe('battlefield1');
      expect(cardInstance?.turnEnteredBattlefield).toBe(1);
      expect(cardInstance?.hasSummoningSickness).toBe(true);
    });

    it('should return the same state if the stack is empty', () => {
      // Empty the stack
      mockStackZone.cards = [];

      const updatedState = stackManager.resolveTop(mockGameState);

      // Should be the same state
      expect(updatedState).toEqual(mockGameState);
    });
  });
});