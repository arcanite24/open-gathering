import { CLI } from '../../src/cli/cli';
import * as fs from 'fs';
import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../../src/core/game_state/interfaces';
import { getScenario, Scenario } from '../../src/cli/scenarios/scenarios';
import { serializeGameState } from '../../src/utils/serialization';

// Mock the apiRequest method
const mockApiRequest = jest.fn();
CLI.prototype['apiRequest'] = mockApiRequest;

jest.mock('../../src/cli/scenarios/scenarios', () => ({
  ...jest.requireActual('../../src/cli/scenarios/scenarios'),
  getScenario: jest.fn(),
}));

const mockedGetScenario = getScenario as jest.Mock;

describe('CLI', () => {
  let cli: CLI;
  let mockGameState: IGameState;

  beforeEach(() => {
    cli = new CLI({
      enableHistory: false,
    });

    const player1: IPlayer = {
      id: 'player1',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
      handZoneId: 'hand1',
      libraryZoneId: 'lib1',
      graveyardZoneId: 'grave1',
      exileZoneId: 'exile1',
      battlefieldZoneId: 'battlefield1',
      landsPlayedThisTurn: 0,
      hasLost: false,
    };

    const player2: IPlayer = {
      id: 'player2',
      life: 20,
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 },
      handZoneId: 'hand2',
      libraryZoneId: 'lib2',
      graveyardZoneId: 'grave2',
      exileZoneId: 'exile2',
      battlefieldZoneId: 'battlefield2',
      landsPlayedThisTurn: 0,
      hasLost: false,
    };

    mockGameState = {
      players: new Map([['player1', player1], ['player2', player2]]),
      zones: new Map(),
      cardInstances: new Map(),
      cardDefinitions: new Map(),
      activePlayerId: 'player1',
      priorityPlayerId: 'player1',
      turn: 1,
      phase: 'Main',
      step: 'Pre-Combat Main',
      stackZoneId: 'stack',
      abilityRegistry: {} as any,
    };

    mockApiRequest.mockClear();
    mockedGetScenario.mockClear();
  });

  it('should start a new game', async () => {
    mockApiRequest.mockResolvedValue({
      gameId: 'game1',
      gameState: serializeGameState(mockGameState),
    });

    // Mock loadDeck to avoid file system access
    (cli as any).loadDeck = jest.fn().mockResolvedValue([{ id: 'card1' }]);

    await cli.newGame('basic', 'basic');

    expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games', {
      player1Deck: ['card1'],
      player2Deck: ['card1'],
    });
    expect((cli as any).gameId).toBe('game1');
    expect((cli as any).gameState).toEqual(mockGameState);
  });

  it('should load a scenario', async () => {
    const mockScenario: Scenario = {
      name: 'Basic Lands',
      description: 'A basic scenario',
      player1Deck: [{ id: 'p1card' } as ICardDefinition],
      player2Deck: [{ id: 'p2card' } as ICardDefinition],
    };
    mockedGetScenario.mockReturnValue(mockScenario);

    mockApiRequest.mockResolvedValue({
      gameId: 'game1',
      gameState: serializeGameState(mockGameState),
    });

    await cli.loadScenario('Basic Lands');

    expect(mockedGetScenario).toHaveBeenCalledWith('Basic Lands');
    expect(mockApiRequest).toHaveBeenCalledWith('POST', '/games', {
      player1Deck: ['p1card'],
      player2Deck: ['p2card'],
    });
    expect((cli as any).gameId).toBe('game1');
    expect((cli as any).gameState).toEqual(mockGameState);
  });
});
