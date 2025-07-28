import { canCastSpell, executeCastSpell } from '../src/core/actions/cast_spell';
import { GameError, ErrorCode } from '../src/core/errors';
import { IGameState, IPlayer, IZone, ICardInstance, ICardDefinition } from '../src/core/game_state/interfaces';
import { Player } from '../src/core/game_state/player';
import { Zone } from '../src/core/game_state/zone';
import { CardInstance } from '../src/core/game_state/card_instance';
import { Phase } from '../src/core/rules/turn_manager';

console.log('🎮 Magic: The Gathering Engine - Improved Error Reporting Demo');
console.log('='.repeat(70));
console.log();

// Set up a game scenario
const player1 = new Player('player1');
const player2 = new Player('player2');

const zones = new Map<string, IZone>();
const p1HandZone = new Zone(player1.handZoneId, 'Hand', player1.id);
const stackZone = new Zone('stack', 'Stack', 'game');

zones.set(p1HandZone.id, p1HandZone);
zones.set(stackZone.id, stackZone);

const lightningBolt: ICardDefinition = {
    id: 'lightning-bolt',
    name: 'Lightning Bolt',
    manaCost: '{R}',
    types: ['Instant'],
    oracleText: 'Lightning Bolt deals 3 damage to any target.'
};

const gameState: IGameState = {
    players: new Map([
        ['player1', player1],
        ['player2', player2]
    ]),
    zones,
    cardInstances: new Map(),
    activePlayerId: 'player1',
    priorityPlayerId: 'player1',
    turn: 1,
    phase: Phase.PreCombatMain,
    step: 'Pre-Combat Main',
    stackZoneId: 'stack',
    cardDefinitions: new Map([
        ['lightning-bolt', lightningBolt]
    ]),
    abilityRegistry: {
        registry: new Map(),
        registerAbility: () => { },
        createAbilityInstance: () => null,
        isRegistered: () => false
    } as any
};

const cardInstance = new CardInstance('card1', lightningBolt, player1.id, player1.id, p1HandZone.id, gameState);
p1HandZone.cards.push(cardInstance.id);
gameState.cardInstances.set('card1', cardInstance);

// Set up mana pool with no red mana
player1.manaPool = {
    W: 1, U: 1, B: 1, R: 0, G: 1, C: 0, generic: 2
};

console.log('📋 Current Game Situation:');
console.log(`  • Player: ${player1.id}`);
console.log(`  • Phase: ${gameState.phase}`);
console.log(`  • Card in hand: Lightning Bolt (cost: {R})`);
console.log(`  • Available mana: W:1, U:1, B:1, R:0, G:1, C:0, Generic:2`);
console.log();

// Demo 1: Not enough mana error
console.log('❌ Demo 1: Attempting to cast Lightning Bolt without red mana');
console.log('-'.repeat(50));
try {
    canCastSpell(gameState, 'player1', 'card1');
} catch (error) {
    if (error instanceof GameError) {
        console.log('✅ Caught GameError with detailed information:');
        console.log();
        console.log(error.toDisplayString());
        console.log();
        console.log(`🏷️  Error Code: ${error.code}`);
        console.log();
    }
}

// Demo 2: Wrong turn error
console.log('❌ Demo 2: Attempting to cast on wrong turn');
console.log('-'.repeat(50));
gameState.activePlayerId = 'player2'; // Change active player
player1.manaPool.R = 1; // Give enough mana so we get turn error instead

try {
    canCastSpell(gameState, 'player1', 'card1');
} catch (error) {
    if (error instanceof GameError) {
        console.log('✅ Caught GameError with detailed information:');
        console.log();
        console.log(error.toDisplayString());
        console.log();
        console.log(`🏷️  Error Code: ${error.code}`);
        console.log();
    }
}

// Demo 3: Successful casting
console.log('✅ Demo 3: Successfully casting the spell');
console.log('-'.repeat(50));
gameState.activePlayerId = 'player1'; // Restore correct active player

try {
    const newState = executeCastSpell(gameState, 'player1', 'card1');

    const handZone = newState.zones.get(player1.handZoneId)!;
    const stackZone = newState.zones.get('stack')!;
    const updatedPlayer = newState.players.get('player1')!;

    console.log('🎯 Spell cast successfully!');
    console.log(`  • Card moved from hand to stack`);
    console.log(`  • Hand cards: ${handZone.cards.length}`);
    console.log(`  • Stack cards: ${stackZone.cards.length}`);
    console.log(`  • Red mana remaining: ${updatedPlayer.manaPool.R}`);
    console.log();
} catch (error) {
    console.log('❌ Unexpected error:', error);
}

console.log('🎉 Error Reporting Demo Complete!');
console.log();
console.log('✨ Key improvements:');
console.log('  • Descriptive error messages with card names and costs');
console.log('  • Specific error codes for programmatic handling');
console.log('  • Helpful suggestions for fixing the issue');
console.log('  • Rich context data for debugging');
console.log('  • Proper exception throwing instead of silent failures');
