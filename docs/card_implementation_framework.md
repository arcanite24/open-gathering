# Card Implementation Framework

This document defines the standardized framework for implementing Magic: The Gathering cards in the Open Gathering engine. The framework ensures consistency, maintainability, and testability across all card implementations.

## Implementation Principles

1. **Separation of Concerns**: Card data (JSON) is separate from card logic (TypeScript)
2. **Type Safety**: Use interfaces and enums to prevent errors
3. **Reusability**: Create reusable components for common mechanics
4. **Testability**: Design for easy unit and integration testing
5. **Documentation**: Comprehensive documentation for all implementations

## Card Type Frameworks

### 1. Lands

#### Base Implementation
- All lands extend from a common base class
- Implement basic land abilities (tapping for mana)
- Support land subtypes (Plains, Island, Swamp, Mountain, Forest)

#### Data Structure
```json
{
  "id": "basic_plains",
  "name": "Plains",
  "types": ["Land", "Plains"],
  "abilities": [
    {
      "key": "inherent_ability_tap_add_mana",
      "parameters": { "mana": "{W}" }
    }
  ]
}
```

#### Implementation Pattern
1. Create ability class that implements `IActivatedAbility`
2. Handle tap cost and mana generation
3. Register ability in `src/core/abilities/registry.ts`

#### Example Implementation
```typescript
// src/implementations/abilities/activated_tap_add_mana.ts
export class TapAddManaAbility implements IActivatedAbility {
  // Implementation details
}
```

### 2. Creatures

#### Base Implementation
- All creatures use the `CardInstance` class with creature-specific properties
- Support power/toughness, damage, and combat status
- Handle summoning sickness
- Support creature keywords as separate abilities

#### Data Structure
```json
{
  "id": "grizzly_bears",
  "name": "Grizzly Bears",
  "manaCost": "{1}{G}",
  "cmc": 2,
  "types": ["Creature"],
  "subtypes": ["Bear"],
  "power": "2",
  "toughness": "2"
}
```

#### Implementation Pattern
1. Define creature stats in JSON
2. Implement creature abilities as separate classes
3. Use triggered abilities for "when this creature dies" effects
4. Use static abilities for continuous effects (e.g., "other creatures get +1/+1")

#### Creature Keywords
- **Flying**: Boolean flag on card instance
- **Trample**: Combat damage assignment logic
- **First Strike**: Combat damage step handling
- **Double Strike**: Two combat damage steps
- **Deathtouch**: Lethal damage rules
- **Lifelink**: Life gain on damage
- **Vigilance**: No tap when attacking
- **Haste**: No summoning sickness

### 3. Enchantments

#### Base Implementation
- Two types: Global enchantments and Auras
- Global enchantments affect game state continuously
- Auras attach to permanents and modify them

#### Data Structure
```json
{
  "id": "crusade",
  "name": "Crusade",
  "manaCost": "{W}{W}",
  "types": ["Enchantment"],
  "oracleText": "White creatures get +1/+1.",
  "abilities": [
    {
      "key": "creatures_get_plus_one_plus_one",
      "parameters": { "power": 1, "toughness": 1 }
    }
  ]
}
```

#### Implementation Pattern
1. Use static abilities for continuous effects
2. Implement targeting for Auras
3. Handle aura attachment and detachment
4. Support "enters the battlefield" and "leaves the battlefield" triggers

### 4. Artifacts

#### Base Implementation
- Similar to enchantments but with artifact-specific rules
- Support artifact creatures
- Handle mana-producing artifacts

#### Data Structure
```json
{
  "id": "sol_ring",
  "name": "Sol Ring",
  "manaCost": "{1}",
  "types": ["Artifact"],
  "oracleText": "{T}: Add {C}{C}.",
  "abilities": [
    {
      "key": "inherent_ability_tap_add_mana",
      "parameters": { "mana": "{C}{C}" }
    }
  ]
}
```

#### Implementation Pattern
1. Use activated abilities for tap effects
2. Support artifact-specific interactions
3. Handle "sacrifice" abilities

### 5. Instants & Sorceries

#### Base Implementation
- Spells that resolve immediately (instants) or during main phases (sorceries)
- Use the stack for resolution
- Support targeting

#### Data Structure
```json
{
  "id": "lightning_bolt",
  "name": "Lightning Bolt",
  "manaCost": "{R}",
  "types": ["Instant"],
  "oracleText": "Lightning Bolt deals 3 damage to any target.",
  "effects": [
    {
      "key": "deal_damage",
      "parameters": { "damage": 3 }
    }
  ]
}
```

#### Implementation Pattern
1. Define effects in the `effects` array
2. Implement effect classes that resolve when spell resolves
3. Handle targeting system
4. Support spell copying and redirection

### 6. Planeswalkers

#### Base Implementation
- Use loyalty counters instead of power/toughness
- Activate loyalty abilities by paying loyalty cost
- Can be damaged, reducing loyalty
- Zero loyalty means removal from battlefield

#### Data Structure
```json
{
  "id": "chandra_nalaar",
  "name": "Chandra Nalaar",
  "manaCost": "{2}{R}{R}",
  "types": ["Planeswalker"],
  "subtypes": ["Chandra"],
  "loyalty": "4",
  "abilities": [
    {
      "key": "planeswalker_loyalty_ability",
      "parameters": { 
        "cost": -1,
        "effect": "deal_damage",
        "effectParameters": { "damage": 1, "target": "opponent" }
      }
    }
  ]
}
```

#### Implementation Pattern
1. Use loyalty property instead of power/toughness
2. Implement loyalty abilities as activated abilities
3. Handle damage to planeswalkers
4. Support "ultimate" abilities

## Implementation Process

### 1. Ability Registration
All card abilities must be registered in `src/core/abilities/registry.ts`:

```typescript
// Register the tap add mana ability
registry.registerAbility('inherent_ability_tap_add_mana', (params, sourceCardInstanceId, gameState) => {
  const id = `ability_${sourceCardInstanceId}_${Date.now()}`;
  const manaType = params.mana.replace(/[{}]/g, '');
  return new TapAddManaAbility(id, sourceCardInstanceId, manaType);
});
```

### 2. Class Structure
Each ability/effect should follow this structure:

```typescript
/**
 * [Brief description of the ability/effect]
 * 
 * @implements {IActivatedAbility | ITriggeredAbility | IStaticAbility}
 * @pattern [Pattern name, e.g., "Mana Ability"]
 * 
 * @example
 * // Example usage
 * const ability = new ExampleAbility(id, cardId, params);
 */
export class ExampleAbility implements IActivatedAbility {
  // Properties
  id: string;
  sourceCardInstanceId: string;
  parameters: any;
  
  // Constructor
  constructor(id: string, sourceCardInstanceId: string, parameters: any) {
    this.id = id;
    this.sourceCardInstanceId = sourceCardInstanceId;
    this.parameters = parameters;
  }
  
  // Interface methods
  canActivate(gameState: IGameState): boolean {
    // Logic to determine if ability can be activated
  }
  
  resolve(gameState: IGameState): IGameState {
    // Logic to resolve the ability
  }
}
```

### 3. Testing Template
Each implementation must have corresponding tests:

```typescript
describe('[Ability/Effect Name]', () => {
  let gameState: IGameState;
  let cardInstance: ICardInstance;
  let ability: IActivatedAbility | ITriggeredAbility | IStaticAbility;
  
  beforeEach(() => {
    // Setup test environment
  });
  
  describe('canActivate/canTrigger', () => {
    it('should return true when conditions are met', () => {
      // Test positive case
    });
    
    it('should return false when conditions are not met', () => {
      // Test negative cases
    });
  });
  
  describe('resolve', () => {
    it('should correctly modify game state', () => {
      // Test state changes
    });
    
    it('should handle edge cases', () => {
      // Test edge cases
    });
  });
  
  describe('interactions', () => {
    it('should work correctly with other game elements', () => {
      // Test interactions
    });
  });
});
```

## Code Organization

### Directory Structure
```
src/
├── implementations/
│   ├── abilities/           # All ability implementations
│   │   ├── activated/       # Activated abilities
│   │   ├── triggered/       # Triggered abilities  
│   │   └── static/          # Static abilities
│   └── effects/             # Effect implementations
│       ├── damage/          # Damage effects
│       ├── card_movement/   # Card movement effects
│       └── state_change/    # Game state change effects
└── core/
    └── abilities/
        └── registry.ts      # Ability registration
```

### File Naming
- Use descriptive names: `deal_damage_effect.ts`, `tap_add_mana_ability.ts`
- Prefix with pattern type: `triggered_when_creature_dies.ts`
- Use snake_case for file names

## Quality Assurance

### 1. Code Review Checklist
- [ ] Proper interface implementation
- [ ] Comprehensive error handling
- [ ] Edge case coverage
- [ ] Performance considerations
- [ ] Documentation completeness
- [ ] Test coverage (100%)

### 2. Testing Requirements
- Unit tests for all methods
- Integration tests for card interactions
- Scenario tests for complex situations
- Performance tests for ability chains

### 3. Documentation Requirements
- JSDoc comments for all classes and methods
- Implementation notes for complex cards
- Examples for usage patterns
- Performance characteristics

## Migration Path

For existing implementations, follow this migration path:

1. Review current implementation
2. Refactor to use new framework patterns
3. Update tests to new standards
4. Document changes and rationale
5. Verify functionality with existing tests

This framework provides a solid foundation for implementing MTG cards consistently and maintainably. By following these patterns, we ensure high-quality implementations that are easy to test, maintain, and extend.