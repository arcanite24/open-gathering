import { 
  IPlayer, 
  IZone, 
  ICardDefinition, 
  ICardInstance, 
  IGameState,
  ManaPool
} from '../../../src/core/game_state/interfaces';
import { 
  IAbility, 
  ICost, 
  IEffect, 
  IActivatedAbility, 
  ITriggeredAbility, 
  IStaticAbility,
  EffectContext,
  Target,
  TriggerCondition,
  GameEvent
} from '../../../src/core/abilities/interfaces';

describe('Game State Interfaces', () => {
  // Test that the interfaces are properly defined by creating mock objects that implement them
  it('should define IPlayer interface correctly', () => {
    const mockPlayer: IPlayer = {
      id: 'player1',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      handZoneId: 'hand1',
      libraryZoneId: 'library1',
      graveyardZoneId: 'graveyard1',
      exileZoneId: 'exile1',
      battlefieldZoneId: 'battlefield1',
      landsPlayedThisTurn: 0
    };

    expect(mockPlayer.id).toBe('player1');
    expect(mockPlayer.life).toBe(20);
    expect(mockPlayer.manaPool).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });
  });

  it('should define IZone interface correctly', () => {
    const mockZone: IZone = {
      id: 'zone1',
      name: 'Hand',
      cards: ['card1', 'card2'],
      ownerPlayerId: 'player1'
    };

    expect(mockZone.id).toBe('zone1');
    expect(mockZone.name).toBe('Hand');
    expect(mockZone.cards).toEqual(['card1', 'card2']);
  });

  it('should define ICardDefinition interface correctly', () => {
    const mockCardDefinition: ICardDefinition = {
      id: 'card1',
      name: 'Lightning Bolt',
      manaCost: '{R}',
      cmc: 1,
      types: ['Instant'],
      oracleText: 'Lightning Bolt deals 3 damage to any target.',
      abilities: [
        {
          key: 'deal_damage_effect',
          parameters: { amount: 3 }
        }
      ]
    };

    expect(mockCardDefinition.id).toBe('card1');
    expect(mockCardDefinition.name).toBe('Lightning Bolt');
    expect(mockCardDefinition.manaCost).toBe('{R}');
  });

  it('should define ICardInstance interface correctly', () => {
    const mockCardInstance: ICardInstance = {
      id: 'instance1',
      definitionId: 'card1',
      ownerPlayerId: 'player1',
      controllerPlayerId: 'player1',
      currentZoneId: 'hand1',
      isTapped: false,
      damageMarked: 0,
      counters: new Map(),
      staticAbilities: [],
      triggeredAbilities: [],
      activatedAbilities: []
    };

    expect(mockCardInstance.id).toBe('instance1');
    expect(mockCardInstance.definitionId).toBe('card1');
    expect(mockCardInstance.isTapped).toBe(false);
  });

  it('should define IGameState interface correctly', () => {
    const mockPlayer: IPlayer = {
      id: 'player1',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      handZoneId: 'hand1',
      libraryZoneId: 'library1',
      graveyardZoneId: 'graveyard1',
      exileZoneId: 'exile1',
      battlefieldZoneId: 'battlefield1',
      landsPlayedThisTurn: 0
    };

    const mockZone: IZone = {
      id: 'zone1',
      name: 'Hand',
      cards: ['card1', 'card2'],
      ownerPlayerId: 'player1'
    };

    const mockCardInstance: ICardInstance = {
      id: 'instance1',
      definitionId: 'card1',
      ownerPlayerId: 'player1',
      controllerPlayerId: 'player1',
      currentZoneId: 'hand1',
      isTapped: false,
      damageMarked: 0,
      counters: new Map(),
      staticAbilities: [],
      triggeredAbilities: [],
      activatedAbilities: []
    };

    const mockGameState: IGameState = {
      players: new Map([['player1', mockPlayer]]),
      zones: new Map([['zone1', mockZone]]),
      cardInstances: new Map([['instance1', mockCardInstance]]),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Main',
      step: 'Begin',
      stackZoneId: 'stack'
    };

    expect(mockGameState.players.get('player1')).toBeDefined();
    expect(mockGameState.zones.get('zone1')).toBeDefined();
    expect(mockGameState.cardInstances.get('instance1')).toBeDefined();
    expect(mockGameState.activePlayerId).toBe('player1');
  });
});

describe('Ability Interfaces', () => {
  it('should define IAbility interface correctly', () => {
    const mockAbility: IAbility = {
      id: 'ability1',
      sourceCardInstanceId: 'card1'
    };

    expect(mockAbility.id).toBe('ability1');
    expect(mockAbility.sourceCardInstanceId).toBe('card1');
  });

  it('should define ICost interface correctly', () => {
    // ICost is a marker interface, so we just verify it exists
    const mockCost: ICost = {};
    expect(mockCost).toBeDefined();
  });

  it('should define IEffect interface correctly', () => {
    // IEffect is an interface with a method, so we create a mock implementation
    const mockEffect: IEffect = {
      resolve: (gameState: IGameState, context: EffectContext): IGameState => {
        return gameState;
      }
    };

    expect(typeof mockEffect.resolve).toBe('function');
  });

  it('should define IActivatedAbility interface correctly', () => {
    const mockActivatedAbility: IActivatedAbility = {
      id: 'activated1',
      sourceCardInstanceId: 'card1',
      costs: [],
      effect: {
        resolve: (gameState: IGameState, context: EffectContext): IGameState => {
          return gameState;
        }
      },
      canActivate: (gameState: IGameState, playerId: string): boolean => {
        return true;
      },
      activate: (gameState: IGameState, playerId: string, targets?: Target[]): void => {
        // Implementation would go here
      }
    };

    expect(mockActivatedAbility.id).toBe('activated1');
    expect(Array.isArray(mockActivatedAbility.costs)).toBe(true);
    expect(typeof mockActivatedAbility.canActivate).toBe('function');
  });

  it('should define ITriggeredAbility interface correctly', () => {
    const mockTriggeredAbility: ITriggeredAbility = {
      id: 'triggered1',
      sourceCardInstanceId: 'card1',
      triggerCondition: { eventType: 'enterBattlefield' },
      effect: {
        resolve: (gameState: IGameState, context: EffectContext): IGameState => {
          return gameState;
        }
      },
      checkTrigger: (event: GameEvent, gameState: IGameState): boolean => {
        return true;
      },
      resolve: (gameState: IGameState): void => {
        // Implementation would go here
      }
    };

    expect(mockTriggeredAbility.id).toBe('triggered1');
    expect(mockTriggeredAbility.triggerCondition.eventType).toBe('enterBattlefield');
    expect(typeof mockTriggeredAbility.checkTrigger).toBe('function');
  });

  it('should define IStaticAbility interface correctly', () => {
    const mockStaticAbility: IStaticAbility = {
      id: 'static1',
      sourceCardInstanceId: 'card1',
      applyEffect: (gameState: IGameState): IGameState => {
        return gameState;
      },
      removeEffect: (gameState: IGameState): IGameState => {
        return gameState;
      },
      getLayer(): number {
        return 1;
      }
    };

    expect(mockStaticAbility.id).toBe('static1');
    expect(typeof mockStaticAbility.applyEffect).toBe('function');
    expect(typeof mockStaticAbility.removeEffect).toBe('function');
    expect(typeof mockStaticAbility.getLayer).toBe('function');
  });
});