# Missing Core Mechanics Implementation Plan

This document outlines the essential Magic: The Gathering mechanics that are currently missing or incomplete in the Open Gathering engine. These mechanics must be implemented to support a complete and accurate MTG game experience.

## 1. Complete Turn Structure

### Current Status
The turn structure is partially implemented with basic phase progression, but several key components are missing.

### Missing Components
- **Upkeep Step**: No implementation for upkeep triggers and effects
- **Draw Step**: No automatic card drawing at the beginning of each turn
- **Main Phase Restrictions**: No enforcement of spell timing rules
- **Combat Phase Details**: Missing specific combat steps and triggers
- **Cleanup Step**: No handling of temporary effects expiration and hand size limits

### Implementation Requirements
1. Add proper step enumeration and transitions
2. Implement automatic actions at each step:
   - Upkeep: Trigger upkeep abilities
   - Draw: Draw one card for active player
   - Cleanup: Remove temporary effects, discard down to hand limit
3. Add event triggers for each step
4. Implement state checks and modifications

### Code Locations
- `src/core/rules/turn_manager.ts` - Extend phase and step definitions
- `src/core/engine.ts` - Add step-specific logic
- `src/core/events/event_types.ts` - Add step-specific events

## 2. Comprehensive Combat System

### Current Status
Basic combat framework exists but lacks many essential combat mechanics.

### Missing Components
- **Attack Requirements**: No enforcement of attack rules (e.g., creatures with summoning sickness can't attack)
- **Block Restrictions**: No validation of legal blockers
- **Combat Damage Assignment**: No implementation of damage assignment order
- **First Strike and Double Strike**: No separate combat damage steps
- **Trample**: No overflow damage to player when blocking creature is destroyed
- **Deathtouch**: No lethal damage rules
- **Lifelink**: No life gain when dealing damage
- **Vigilance**: No prevention of tapping when attacking
- **Defender**: No prevention of attacking
- **Combat Triggers**: Missing "attacker declared", "blocker declared", "combat damage dealt" triggers

### Implementation Requirements
1. Implement `CombatManager` class with complete combat logic
2. Add combat-specific game state properties:
   - `attackingCreatures: Map<string, string[]>` (attacker to blockers)
   - `blockedCreatures: Map<string, string[]>` (blocker to attackers)
   - `combatDamageSteps: CombatDamageStep[]`
3. Implement damage calculation with all relevant modifiers
4. Add combat phase event triggers
5. Implement state-based actions for combat

### Code Locations
- `src/core/rules/combat_manager.ts` - Create comprehensive combat manager
- `src/core/game_state/card_instance.ts` - Add combat-related properties
- `src/core/events/event_types.ts` - Add combat-specific events

## 3. Advanced Stack and Timing Rules

### Current Status
Basic stack implementation exists but lacks many timing and interaction rules.

### Missing Components
- **Spell Copying**: No support for spells that create copies
- **Split Second**: No prevention of spells/abilities while a split second spell is on the stack
- **Flashback**: No alternative casting cost from graveyard
- **Storm**: No counting of spells cast during the turn
- **Cascade**: No exile and casting of cards with lower CMC
- **Gravestorm**: No copying of spells when creatures are put into graveyard
- **Retrace**: No alternative casting from graveyard with discard
- **Transmute**: No alternative casting by discarding card
- **Replicate**: No creation of additional copies with additional payment

### Implementation Requirements
1. Enhance `StackManager` to track spell metadata
2. Implement timing restrictions based on game state
3. Add support for alternative casting costs
4. Implement spell copying mechanics
5. Add counters for storm, gravestorm, and other cumulative effects

### Code Locations
- `src/core/rules/stack_manager.ts` - Extend stack functionality
- `src/core/actions/cast_spell.ts` - Add alternative casting logic
- `src/core/game_state/interfaces.ts` - Add spell metadata properties

## 4. Complete State-Based Actions (SBAs)

### Current Status
Basic SBA checker exists but only handles creature death.

### Missing Components
- **Zero Toughness Creatures**: Creatures with toughness 0 or less are put into graveyard
- **Legend Rule**: If a player controls two or more legendary permanents with the same name, they choose one to keep
- **Planeswalker Uniqueness**: If a player controls two or more planeswalkers with the same subtype, they choose one to keep
- **Token Expiration**: Tokens cease to exist when they leave the battlefield
- **Poison Counters**: Player with 10 or more poison counters loses the game
- **Commander Damage**: Player who has been dealt 21 or more combat damage by the same commander loses
- **Fog Effects**: Creatures can't deal combat damage this turn
- **Phasing**: Permanents with phasing temporarily leave the game

### Implementation Requirements
1. Expand `SBAChecker` to handle all SBA types
2. Implement proper ordering of SBA checks
3. Add game state properties for tracking:
   - Poison counters
   - Commander damage
   - Phased permanents
4. Implement SBA triggers and events

### Code Locations
- `src/core/rules/sba_checker.ts` - Expand SBA checking
- `src/core/game_state/player.ts` - Add poison counters
- `src/core/game_state/card_instance.ts` - Add phasing support

## 5. Continuous Effects System

### Current Status
Basic continuous effect processor exists but lacks proper layering.

### Missing Components
- **Layer System**: No implementation of the 6-layer system for continuous effects
- **Dependency System**: No handling of effect dependencies
- **Duration Types**: Missing support for various duration types:
  - "Until end of turn"
  - "This turn"
  - "For as long as"
  - "While"
- **Effect Stacking**: No proper handling of multiple effects modifying the same characteristic
- **Interaction Rules**: Missing rules for how effects interact with each other

### Implementation Requirements
1. Implement full 6-layer system:
   - Layer 1: Copy effects
   - Layer 2: Control-changing effects
   - Layer 3: Text-changing effects
   - Layer 4: Type-changing effects
   - Layer 5: Color-changing effects
   - Layer 6: Ability-adding/removing effects
   - Layer 7: Power/toughness-changing effects
2. Implement dependency tracking between effects
3. Add duration tracking and expiration
4. Implement effect interaction rules

### Code Locations
- `src/core/rules/continuous_effect_processor.ts` - Complete implementation
- `src/core/game_state/card_instance.ts` - Add effect tracking
- `src/core/abilities/interfaces.ts` - Extend effect interfaces

## 6. Planeswalker System

### Current Status
Planeswalker cards are not properly supported.

### Missing Components
- **Loyalty Counters**: No implementation of loyalty counters
- **Loyalty Abilities**: No support for abilities that add/subtract loyalty
- **Damage to Planeswalkers**: No rules for damage reducing loyalty
- **Ultimate Abilities**: No support for high-cost loyalty abilities
- **Planeswalker Uniqueness Rule**: No enforcement of the planeswalker uniqueness rule
- **Attacking Planeswalkers**: No support for creatures attacking planeswalkers

### Implementation Requirements
1. Add loyalty property to card instances
2. Implement loyalty ability framework
3. Add damage-to-planeswalker rules
4. Implement planeswalker uniqueness rule
5. Add combat support for attacking planeswalkers

### Code Locations
- `src/core/game_state/card_instance.ts` - Add loyalty properties
- `src/core/abilities/interfaces.ts` - Add loyalty ability interfaces
- `src/core/rules/combat_manager.ts` - Add planeswalker combat support

## 7. Game Winning and Losing Conditions

### Current Status
No implementation of game end conditions.

### Missing Components
- **Life Total**: Player with 0 or less life loses
- **Poison Counters**: Player with 10 or more poison counters loses
- **Library**: Player who attempts to draw from empty library loses
- **Commander Damage**: Player who has been dealt 21 or more combat damage by the same commander loses
- **Alternative Win Conditions**: Cards that cause a player to win the game
- **Ties**: Games that end in a draw

### Implementation Requirements
1. Implement game state property for player loss status
2. Add SBA checks for all loss conditions
3. Implement win condition triggers
4. Add game end state and events

### Code Locations
- `src/core/rules/sba_checker.ts` - Add loss condition checks
- `src/core/game_state/player.ts` - Add loss tracking
- `src/core/events/event_types.ts` - Add game end events

## 8. Special Card Types and Mechanics

### Current Status
Many special card types and mechanics are not supported.

### Missing Components
- **Tribal**: Cards with creature types but not creatures
- **Conspiracy**: Cards used in drafting but not in main deck
- **Scheme**: Cards used in Planechase format
- **Phenomenon**: Cards used in Planechase format
- **Plane**: Cards used in Planechase format
- **Vanguard**: Cards used in Vanguard format
- **Dungeon**: Cards used in Wilds of Eldraine
- **Ongoing**: Cards that remain in command zone

### Implementation Requirements
1. Add support for special card types in card definitions
2. Implement format-specific rules
3. Add special zone handling where needed
4. Implement unique mechanics for each type

### Code Locations
- `src/core/game_state/interfaces.ts` - Add special card types
- `src/core/rules/` - Add format-specific rule handlers
- `src/core/abilities/registry.ts` - Add special ability registrations

## 9. Advanced Mana System

### Current Status
Basic mana system exists but lacks many mana-related mechanics.

### Missing Components
- **Mana Abilities**: No distinction between mana abilities and other activated abilities
- **Mana Pool Emptying**: No automatic emptying of mana pool at end of phases
- **Mana Burn**: No loss of life from unused mana (if implementing older rules)
- **Mana Weaving**: No support for mana abilities that produce multiple types
- **Mana Generation Limits**: No restrictions on mana production
- **Mana Cost Reduction**: No support for effects that reduce spell costs
- **Alternative Costs**: No support for alternative casting costs

### Implementation Requirements
1. Implement mana ability special rules
2. Add mana pool emptying at end of phases
3. Implement mana cost reduction framework
4. Add support for alternative costs
5. Implement mana weaving mechanics

### Code Locations
- `src/core/actions/play_land.ts` - Add mana ability rules
- `src/core/rules/turn_manager.ts` - Add mana emptying
- `src/core/actions/cast_spell.ts` - Add cost reduction

## 10. Comprehensive Targeting System

### Current Status
Basic targeting exists but lacks many targeting rules.

### Missing Components
- **Target Validation**: No validation of legal targets at resolution
- **Target Change**: No support for effects that change a spell's target
- **Target Replacement**: No support for effects that replace a target
- **Multiple Targets**: No support for spells with multiple targets
- **Optional Targets**: No support for spells with optional targets
- **Target Restrictions**: No enforcement of targeting restrictions

### Implementation Requirements
1. Implement comprehensive target validation
2. Add target change and replacement mechanics
3. Support multiple and optional targets
4. Implement targeting restrictions
5. Add target-related events

### Code Locations
- `src/core/actions/cast_spell.ts` - Enhance targeting
- `src/core/abilities/interfaces.ts` - Extend target interfaces
- `src/core/events/event_types.ts` - Add target events

## Implementation Priority

The missing mechanics should be implemented in the following priority order:

1. **Complete Turn Structure** - Foundation for game progression
2. **Comprehensive Combat System** - Core gameplay mechanic
3. **Complete State-Based Actions** - Essential game rules
4. **Game Winning and Losing Conditions** - Game end states
5. **Continuous Effects System** - Complex card interactions
6. **Advanced Stack and Timing Rules** - Spell interactions
7. **Planeswalker System** - Important card type
8. **Advanced Mana System** - Resource management
9. **Comprehensive Targeting System** - Spell accuracy
10. **Special Card Types and Mechanics** - Format completeness

This prioritization ensures that the most fundamental game mechanics are implemented first, providing a solid foundation for more complex features.