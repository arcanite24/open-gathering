# Enhanced Testing Coverage for Card Implementations

This document defines the comprehensive testing strategy for card implementations in the Open Gathering engine. The goal is to ensure high-quality, reliable implementations through systematic and thorough testing.

## Testing Philosophy

Our testing approach follows these core principles:

1. **Comprehensiveness**: Test all functionality, edge cases, and interactions
2. **Automation**: Maximize automated testing to ensure consistency
3. **Speed**: Fast tests enable rapid development and iteration
4. **Clarity**: Tests should be readable and self-documenting
5. **Maintainability**: Tests should be easy to update and extend

## Test Structure and Organization

### Directory Structure
```
tests/
├── unit/
│   ├── abilities/           # Unit tests for individual abilities
│   │   ├── activated/       # Activated ability tests
│   │   ├── triggered/       # Triggered ability tests  
│   │   └── static/          # Static ability tests
│   └── effects/             # Unit tests for individual effects
│       ├── damage/          # Damage effect tests
│       ├── card_movement/   # Card movement effect tests
│       └── state_change/    # Game state change effect tests
├── integration/
│   ├── card_interactions/   # Tests for card combinations
│   ├── phase_transitions/   # Tests for turn and phase changes
│   └── combat/              # Comprehensive combat tests
├── scenarios/               # Realistic game scenarios
├── performance/             # Performance and stress tests
└── util/                    # Test utilities and helpers
```

### File Naming Convention
- Unit tests: `[ability/effect]_[name].test.ts`
- Integration tests: `[category]_integration.test.ts`
- Scenario tests: `[scenario-name].test.ts`
- Performance tests: `[category]_performance.test.ts`

## Unit Testing Strategy

### 1. Test Templates by Card Type

#### Basic Lands
```typescript
describe('Basic Land: [Land Name]', () => {
  let gameState: IGameState;
  let landCard: ICardInstance;
  let tapAbility: IActivatedAbility;
  
  beforeEach(() => {
    // Setup game state with land in battlefield
    gameState = createTestGameState();
    landCard = createCardInZone('basic_[land]', 'battlefield');
    tapAbility = landCard.activatedAbilities[0];
  });
  
  describe('Mana Ability', () => {
    it('should be activatable when untapped', () => {
      expect(tapAbility.canActivate(gameState)).toBe(true);
    });
    
    it('should not be activatable when tapped', () => {
      landCard.isTapped = true;
      expect(tapAbility.canActivate(gameState)).toBe(false);
    });
    
    it('should add correct mana when activated', () => {
      const newState = tapAbility.resolve(gameState);
      const player = newState.players.get('player1');
      expect(player?.manaPool.[color]).toBe(1);
    });
    
    it('should tap the land when activated', () => {
      const newState = tapAbility.resolve(gameState);
      const card = newState.cardInstances.get(landCard.id);
      expect(card?.isTapped).toBe(true);
    });
  });
});
```

#### Creatures
```typescript
describe('Creature: [Creature Name]', () => {
  let gameState: IGameState;
  let creature: ICardInstance;
  
  beforeEach(() => {
    gameState = createTestGameState();
    creature = createCardInZone('[creature-id]', 'battlefield');
  });
  
  describe('Combat', () => {
    it('should be able to attack if untapped and no summoning sickness', () => {
      creature.isTapped = false;
      creature.hasSummoningSickness = false;
      expect(canAttack(gameState, creature.id)).toBe(true);
    });
    
    it('should not be able to attack if tapped', () => {
      creature.isTapped = true;
      expect(canAttack(gameState, creature.id)).toBe(false);
    });
    
    it('should not be able to attack if has summoning sickness', () => {
      creature.hasSummoningSickness = true;
      expect(canAttack(gameState, creature.id)).toBe(false);
    });
  });
  
  describe('Abilities', () => {
    // Test each ability individually
  });
  
  describe('State-Based Actions', () => {
    it('should die when damage marked equals or exceeds toughness', () => {
      creature.damageMarked = parseInt(creature.toughness || '0');
      const newState = checkStateBasedActions(gameState);
      const zone = newState.zones.get(creature.currentZoneId);
      expect(zone?.name).toBe('Graveyard');
    });
  });
});
```

#### Enchantments
```typescript
describe('Enchantment: [Enchantment Name]', () => {
  let gameState: IGameState;
  let enchantment: ICardInstance;
  let staticAbility: IStaticAbility;
  
  beforeEach(() => {
    gameState = createTestGameState();
    enchantment = createCardInZone('[enchantment-id]', 'battlefield');
    staticAbility = enchantment.staticAbilities[0];
  });
  
  describe('Static Effect', () => {
    it('should apply effect when on battlefield', () => {
      const newState = applyContinuousEffects(gameState);
      // Verify effect is applied
    });
    
    it('should remove effect when not on battlefield', () => {
      // Move enchantment to graveyard
      const newState = applyContinuousEffects(gameState);
      // Verify effect is removed
    });
  });
  
  describe('Enters the Battlefield', () => {
    it('should trigger ETB ability if present', () => {
      // Test ETB trigger
    });
  });
  
  describe('Leaves the Battlefield', () => {
    it('should trigger LTB ability if present', () => {
      // Test LTB trigger
    });
  });
});
```

#### Instants and Sorceries
```typescript
describe('Spell: [Spell Name]', () => {
  let gameState: IGameState;
  let spell: ICardInstance;
  
  beforeEach(() => {
    gameState = createTestGameState();
    spell = createCardInZone('[spell-id]', 'hand');
  });
  
  describe('Casting', () => {
    it('should be castable from hand', () => {
      expect(canCastSpell(gameState, spell.id)).toBe(true);
    });
    
    it('should move to stack when cast', () => {
      const newState = castSpell(gameState, spell.id);
      const stackZone = newState.zones.get(newState.stackZoneId);
      expect(stackZone?.cards).toContain(spell.id);
    });
    
    it('should resolve correctly when on stack', () => {
      gameState = castSpell(gameState, spell.id);
      const newState = resolveStack(gameState);
      // Verify resolution effects
    });
  });
  
  describe('Effects', () => {
    // Test each effect individually
  });
  
  describe('Targeting', () => {
    it('should validate targets before resolution', () => {
      // Test target validation
    });
    
    it('should handle illegal targets at resolution', () => {
      // Test illegal target handling
    });
  });
});
```

### 2. Edge Case Testing

Every card implementation must test these edge cases:

#### General Edge Cases
- **Empty Game State**: Test with minimal game state
- **Multiple Instances**: Test with multiple copies of the same card
- **Timing Edge Cases**: Test at phase boundaries
- **Resource Limits**: Test with empty mana pool, empty hand, etc.
- **Invalid Actions**: Test attempting invalid actions

#### Combat Edge Cases
- **First Strike Interactions**: Test with multiple first strike creatures
- **Trample with Multiple Blockers**: Test trample damage assignment
- **Deathtouch with Indestructible**: Test lethal damage rules
- **Combat Damage with State Changes**: Test damage that causes state changes
- **Attacking with Limited Options**: Test attacking with few legal targets

#### Stack Edge Cases
- **Counter on Counter**: Test counterspells on counterspells
- **Copy on Copy**: Test copying spells that create copies
- **Interrupted Resolution**: Test state changes during resolution
- **Infinite Loops**: Test potential infinite ability chains
- **Priority Edge Cases**: Test passing priority at critical moments

#### State-Based Actions
- **Simultaneous SBAs**: Test multiple SBAs triggering at once
- **SBA Dependencies**: Test SBAs that affect other SBAs
- **SBA Loops**: Test potential infinite SBA loops
- **SBA Timing**: Test SBAs at different game moments
- **SBA Interactions**: Test SBAs with continuous effects

### 3. Performance Testing

Performance tests ensure the engine can handle complex scenarios efficiently.

#### Test Categories
- **Large Game States**: Test with 50+ permanents on battlefield
- **Complex Ability Chains**: Test long chains of triggered abilities
- **High Card Draw**: Test effects that draw many cards
- **Mass Removal**: Test board wipes with many permanents
- **Infinite Loops**: Test detection and handling of potential infinite loops

#### Performance Metrics
- **Execution Time**: Measure time to resolve complex actions
- **Memory Usage**: Monitor memory consumption during extended games
- **Frame Rate**: For UI integration, measure UI responsiveness
- **Garbage Collection**: Monitor GC frequency and impact

#### Performance Test Template
```typescript
describe('Performance: [Scenario Name]', () => {
  let gameState: IGameState;
  
  beforeEach(() => {
    // Setup complex game state
    gameState = createComplexGameState();
  });
  
  it('should resolve in acceptable time', () => {
    const startTime = performance.now();
    const newState = complexAction(gameState);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(1000); // Should resolve in under 1 second
  });
  
  it('should not exceed memory limits', () => {
    // This would require memory monitoring
    const initialStateSize = measureObjectSize(gameState);
    const newState = complexAction(gameState);
    const finalStateSize = measureObjectSize(newState);
    
    // Memory growth should be reasonable
    expect(finalStateSize / initialStateSize).toBeLessThan(2);
  });
});
```

## Integration Testing Strategy

### 1. Card Interaction Patterns

Test common card interaction patterns:

#### Direct Interactions
- **Creature vs Creature**: Combat interactions
- **Spell vs Creature**: Removal spells
- **Spell vs Spell**: Counterspells
- **Enchantment vs Creature**: Auras and effects
- **Artifact vs Creature**: Equipment and effects

#### Indirect Interactions
- **Mana Source vs Spell**: Mana generation and spending
- **Card Draw vs Hand Size**: Drawing and discarding
- **Loyalty vs Damage**: Planeswalker damage
- **Token Creation vs Board State**: Token generation
- **SBA vs Continuous Effects**: State-based actions and modifiers

### 2. Scenario Testing

Create realistic game scenarios that test multiple cards and mechanics.

#### Scenario Template
```typescript
describe('Scenario: [Scenario Name]', () => {
  let gameState: IGameState;
  
  beforeEach(() => {
    // Setup scenario
    gameState = setupScenario('[scenario-id]');
  });
  
  it('should play out as expected', () => {
    // Execute scenario steps
    gameState = playerAction(gameState, 'player1', 'cast', 'lightning_bolt', 'creature1');
    gameState = playerAction(gameState, 'player2', 'pass');
    gameState = resolveStack(gameState);
    
    // Verify outcome
    const creature = gameState.cardInstances.get('creature1');
    expect(creature?.currentZoneId).toContain('graveyard');
  });
  
  it('should handle alternative player choices', () => {
    // Test different player decisions
  });
});
```

#### Example Scenarios
1. **Combat with First Strike**
   - Setup: Two creatures, one with first strike
   - Actions: Attack and block
   - Expected: First strike creature deals damage first

2. **Counterspell Chain**
   - Setup: Player casts spell, opponent has Counterspell, first player has another Counterspell
   - Actions: Cast spell, opponent counters, first player counters the counter
   - Expected: Original spell resolves

3. **Life Gain/Loss Race**
   - Setup: Both players at 5 life, each has a spell that deals 3 damage and gains 2 life
   - Actions: Both cast spells
   - Expected: Final life totals depend on casting order

4. **Board Wipe Recovery**
   - Setup: Board full of creatures, player has "return all creatures from graveyard" spell
   - Actions: Cast board wipe, then recovery spell
   - Expected: Creatures return to battlefield

## Test Automation Infrastructure

### 1. Test Utilities

Create reusable test utilities in `tests/util/`:

#### Game State Setup
```typescript
// tests/util/game_state_builder.ts
export function createTestGameState(): IGameState {
  // Create standard test game state
}

export function createCardInZone(cardId: string, zone: string, owner: string = 'player1'): ICardInstance {
  // Create card in specified zone
}

export function setupScenario(scenarioId: string): IGameState {
  // Setup specific test scenario
}
```

#### Card Creation
```typescript
// tests/util/card_factory.ts
export function createCreature(power: number, toughness: number, abilities: string[] = []): ICardDefinition {
  // Create creature card definition
}

export function createInstant(effects: string[], targets: number = 1): ICardDefinition {
  // Create instant card definition
}

export function createEnchantment(abilities: string[]): ICardDefinition {
  // Create enchantment card definition
}
```

#### State Verification
```typescript
// tests/util/state_verifier.ts
export function expectCardInZone(gameState: IGameState, cardId: string, zoneName: string): void {
  // Verify card is in specified zone
}

export function expectPlayerLife(gameState: IGameState, playerId: string, life: number): void {
  // Verify player life total
}

export function expectManaPool(gameState: IGameState, playerId: string, mana: Partial<ManaPool>): void {
  // Verify player mana pool
}
```

### 2. Mock Objects

Use mocks to isolate components:

```typescript
// tests/util/mocks.ts
export const mockGameState: IGameState = {
  // Minimal game state for testing
};

export const mockAbilityRegistry: AbilityRegistry = {
  createAbilityInstance: jest.fn(),
  registerAbility: jest.fn(),
  getAbilityFactory: jest.fn()
};

export const mockEventBus: EventBus = {
  emit: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
};
```

## Code Coverage Requirements

### 1. Coverage Standards

All implementations must meet these coverage requirements:

- **Unit Tests**: 100% coverage for all new code
- **Integration Tests**: 90% coverage for interactions
- **Scenario Tests**: 80% coverage for key scenarios
- **Edge Cases**: 100% coverage for identified edge cases

### 2. Coverage Measurement

Use Jest with Istanbul for coverage measurement:

```json
// package.json
"scripts": {
  "test:coverage": "jest --coverage --coverage-reporters=html,text-summary"
}
```

### 3. Coverage Thresholds

Set minimum coverage thresholds in Jest config:

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## Testing Workflow

### 1. Development Cycle

Follow this testing workflow during development:

1. **Write Test First**: Create tests before implementation
2. **Implement**: Write code to make tests pass
3. **Refactor**: Improve code while keeping tests green
4. **Expand Tests**: Add edge cases and integration tests
5. **Verify Coverage**: Ensure coverage requirements are met

### 2. Pull Request Requirements

Every pull request must include:

- [ ] Unit tests for new functionality
- [ ] Integration tests for key interactions
- [ ] Edge case tests
- [ ] Updated documentation
- [ ] Code coverage report
- [ ] Performance considerations

### 3. Continuous Integration

Set up CI pipeline with:

1. **Pre-commit Hooks**: Run tests and linting before commit
2. **Pull Request Checks**: Require passing tests and coverage
3. **Automated Testing**: Run full test suite on every push
4. **Coverage Reporting**: Generate and display coverage reports
5. **Performance Monitoring**: Track performance over time

## Test-Driven Development Approach

Adopt TDD for all new implementations:

### 1. Red-Green-Refactor Cycle
1. **Red**: Write a failing test for new functionality
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code structure without changing behavior

### 2. Example TDD Process
```typescript
// Step 1: Write failing test
it('should gain life when creature dies', () => {
  const ability = new WhenCreatureDiesGainLifeAbility('ability1', 'creature1', { lifeGain: 1 });
  const gameState = setupGameStateWithCreature('creature1');
  
  // Kill creature
  const damagedState = applyDamage(gameState, 'creature1', 2);
  const newState = checkStateBasedActions(damagedState);
  
  expect(newState.players.get('player1')?.life).toBe(21);
});

// Step 2: Implement minimal code to pass
class WhenCreatureDiesGainLifeAbility implements ITriggeredAbility {
  resolve(gameState: IGameState): IGameState {
    const player = gameState.players.get('player1');
    if (player) {
      player.life += 1;
    }
    return gameState;
  }
}

// Step 3: Refactor for better design
class WhenCreatureDiesGainLifeAbility implements ITriggeredAbility {
  private lifeGain: number;
  
  constructor(id: string, sourceCardId: string, parameters: { lifeGain: number }) {
    this.lifeGain = parameters.lifeGain;
  }
  
  resolve(gameState: IGameState): IGameState {
    const sourceCard = gameState.cardInstances.get(this.sourceCardId);
    if (!sourceCard) return gameState;
    
    const controller = gameState.players.get(sourceCard.controllerPlayerId);
    if (!controller) return gameState;
    
    controller.life += this.lifeGain;
    return gameState;
  }
}
```

## Manual Testing Protocol

For scenarios that can't be automated:

### 1. Test Case Template
```markdown
## Test Case: [Test Case Name]

**Objective:** [What the test verifies]

**Setup:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Execution:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Expected Results:**
- [Expected outcome 1]
- [Expected outcome 2]
- [Expected outcome 3]

**Actual Results:**
- [Actual outcome 1]
- [Actual outcome 2]
- [Actual outcome 3]

**Status:** [Pass/Fail]
**Notes:** [Any observations or issues]
```

### 2. Testing Environment
- Use the CLI interface for manual testing
- Start with predefined scenarios when possible
- Document all actions and results
- Report any inconsistencies or bugs

## Bug Reporting and Tracking

### 1. Bug Report Template
```markdown
## Bug Report

**Title:** [Brief description of the bug]

**Environment:**
- Engine version: [version]
- Node.js version: [version]
- OS: [operating system]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:** [What should happen]

**Actual Behavior:** [What actually happens]

**Impact:** [How severe is the bug]

**Additional Context:** [Screenshots, error messages, etc.]
```

### 2. Bug Severity Levels
- **Critical**: Game-breaking, prevents play
- **High**: Major functionality broken
- **Medium**: Minor functionality affected
- **Low**: Cosmetic or minor issue

## Quality Gates

Implement quality gates to ensure high standards:

### 1. Pre-Merge Requirements
- [ ] All tests pass
- [ ] Code coverage meets thresholds
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] No linting errors

### 2. Release Requirements
- [ ] All critical bugs fixed
- [ ] 100% test coverage for new features
- [ ] Performance benchmarks met
- [ ] User documentation complete
- [ ] Release notes prepared

This enhanced testing coverage strategy ensures that all card implementations are thoroughly tested, reliable, and maintainable. By following these guidelines, we can deliver high-quality MTG set implementations that accurately reflect the game's rules and provide an excellent user experience.