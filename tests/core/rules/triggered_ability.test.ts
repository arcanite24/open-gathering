
import { Engine } from '../../../src/core/engine';
import { ICardDefinition } from '../../../src/core/game_state/interfaces';

describe('Triggered Abilities', () => {
  it('should trigger "When this creature dies, gain 1 life" ability', () => {
    // 1. Create an Engine instance
    const engine = new Engine();

    // 2. Create a card with the "When this creature dies, gain 1 life" ability
    const creatureWithAbility: ICardDefinition = {
      id: 'creature_with_ability',
      name: 'Selfless Spirit',
      types: ['Creature'],
      subtypes: ['Spirit'],
      power: '2',
      toughness: '1',
      abilities: [
        {
          key: 'when_this_creature_dies_gain_life',
          parameters: {},
        },
      ],
    };

    const player1Deck: ICardDefinition[] = [creatureWithAbility];
    const player2Deck: ICardDefinition[] = [];

    // 3. Start a game with this card on the battlefield
    engine.startGame(player1Deck, player2Deck);
    let gameState = engine.getState();
    const player1 = gameState.players.get('player1')!;
    const creatureCard = gameState.cardInstances.values().next().value;

    // Ensure creatureCard exists
    if (!creatureCard) {
      throw new Error('No creature card found in game state');
    }

    // Move creature to battlefield
    const libraryZone = gameState.zones.get(player1.libraryZoneId)!;
    const battlefieldZone = gameState.zones.get(player1.battlefieldZoneId)!;
    libraryZone.cards = libraryZone.cards.filter(id => id !== creatureCard.id);
    battlefieldZone.cards.push(creatureCard.id);
    creatureCard.currentZoneId = battlefieldZone.id;

    // 4. Make the creature die by dealing lethal damage
    creatureCard.damageMarked = 1;

    // Manually trigger the SBA check
    const sbaChecker = (engine as any).sbaChecker;
    const newGameState = sbaChecker.checkAndApplySBAs(engine.getState(), (engine as any).cardDefinitions);
    (engine as any).gameState = newGameState;

    // Manually trigger the state change check
    (engine as any).checkStateChangesAndEmitEvents(gameState, engine.getState());

    // 5. Check if the player's life was updated correctly
    const finalGameState = engine.getState();
    const finalPlayer1 = finalGameState.players.get('player1')!;
    expect(finalPlayer1.life).toBe(21); // Initial life is 20
  });
});
