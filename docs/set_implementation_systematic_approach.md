# Systematic Approach for Implementing MTG Sets

This document defines the standardized, repeatable process for implementing Magic: The Gathering sets in the Open Gathering engine. The approach ensures consistency, quality, and efficiency across all set implementations.

## Implementation Workflow

The set implementation process follows a structured workflow with clear phases and deliverables.

### Phase 1: Set Analysis and Planning
Duration: 2-3 days

**Objectives:**
- Understand the set's mechanics and themes
- Identify new mechanics that require engine support
- Plan implementation priorities
- Estimate effort and resources

**Activities:**
1. **Set Research**: Study the set's official documentation, mechanics, and card list
2. **Mechanic Analysis**: Identify all card mechanics, especially new or modified ones
3. **Dependency Mapping**: Determine which mechanics depend on others
4. **Complexity Assessment**: Rate cards by implementation complexity (Simple, Medium, Complex, Expert)
5. **Implementation Roadmap**: Create a prioritized implementation plan

**Deliverables:**
- Set analysis report
- Mechanic dependency map
- Implementation roadmap
- Complexity assessment matrix

### Phase 2: Foundation Setup
Duration: 3-5 days

**Objectives:**
- Implement any new core mechanics required by the set
- Update the engine to support set-specific rules
- Prepare the implementation environment

**Activities:**
1. **Core Mechanics Implementation**: Implement any missing core mechanics identified in Phase 1
2. **Framework Updates**: Update card implementation frameworks as needed
3. **Testing Infrastructure**: Add any required test utilities or mock objects
4. **Data Structure Preparation**: Create JSON schema and validation rules for the set
5. **Documentation Updates**: Update implementation guides with set-specific information

**Deliverables:**
- Implemented core mechanics
- Updated frameworks and tools
- Ready-to-use implementation environment

### Phase 3: Card Implementation
Duration: Variable (depends on set size)

**Objectives:**
- Implement all cards in the set according to the prioritized plan
- Ensure consistent quality across implementations
- Maintain comprehensive documentation

**Activities:**
1. **Implementation by Type**: Implement cards in the following order:
   - Basic Lands
   - Common Cards
   - Uncommon Cards
   - Rare Cards
   - Mythic Rare Cards
   - Special Cards (e.g., promotional, unique mechanics)

2. **Implementation by Complexity**: Within each rarity, implement in order:
   - Simple cards (no abilities)
   - Medium cards (one straightforward ability)
   - Complex cards (multiple abilities or complex interactions)
   - Expert cards (unique mechanics or edge cases)

3. **Daily Implementation Cycle:**
   - Morning: Review implementation plan and assign cards
   - Development: Implement cards with tests
   - Afternoon: Code review and documentation
   - End of day: Integration testing and progress tracking

**Deliverables:**
- Implemented card abilities and effects
- Comprehensive unit tests
- Implementation documentation

### Phase 4: Integration and Testing
Duration: 5-7 days

**Objectives:**
- Ensure all cards work correctly together
- Validate complex interactions
- Identify and fix edge cases

**Activities:**
1. **Integration Testing**: Test card combinations and interactions
2. **Scenario Testing**: Create test scenarios for key interactions
3. **Performance Testing**: Test game performance with full set
4. **Edge Case Testing**: Test unusual game states and interactions
5. **Bug Fixing**: Address any issues found during testing

**Deliverables:**
- Integration test results
- Scenario test suite
- Performance benchmarks
- Bug report and fixes

### Phase 5: Documentation and Release
Duration: 2-3 days

**Objectives:**
- Complete all documentation
- Prepare release artifacts
- Archive implementation knowledge

**Activities:**
1. **Final Documentation**: Complete all implementation notes and guides
2. **Release Preparation**: Package the set for distribution
3. **Knowledge Transfer**: Document lessons learned
4. **Release**: Publish the implemented set

**Deliverables:**
- Complete documentation
- Release package
- Lessons learned report

## Card Implementation Prioritization

Cards should be implemented in a specific order to maximize efficiency and minimize dependencies.

### Priority 1: Foundation Cards
- Basic lands
- Simple creatures with no abilities
- Common mana sources
- Basic spells with straightforward effects

These cards establish the foundation and are needed for testing more complex cards.

### Priority 2: Core Mechanics
- Cards that demonstrate key set mechanics
- Cards that introduce new ability patterns
- Cards that test fundamental game rules

Implement these early to validate the core implementation approach.

### Priority 3: Common Interactions
- Cards that interact with multiple card types
- Cards with targeting effects
- Cards that modify game state in common ways

These cards help identify issues with the broader implementation.

### Priority 4: Complex Interactions
- Cards with multiple abilities
- Cards with conditional effects
- Cards that create game state loops

Implement these after the foundation is solid.

### Priority 5: Edge Cases and Specials
- Cards with unique or unusual mechanics
- Cards that test engine limits
- Promotional or special cards

Implement these last, as they often require special handling.

## Quality Assurance Process

A comprehensive QA process ensures high-quality implementations.

### 1. Code Review Checklist
Every implementation must pass this checklist:

**Design:**
- [ ] Uses appropriate design pattern
- [ ] Follows card implementation framework
- [ ] Minimizes code duplication
- [ ] Uses proper interfaces and types

**Functionality:**
- [ ] Correctly implements Oracle text
- [ ] Handles all edge cases
- [ ] Properly interacts with game state
- [ ] Follows MTG rules

**Performance:**
- [ ] Efficient state modifications
- [ ] No memory leaks
- [ ] Proper event handling
- [ ] Optimal algorithm complexity

**Testing:**
- [ ] 100% unit test coverage
- [ ] Integration tests for key interactions
- [ ] Edge case coverage
- [ ] Performance benchmarks

### 2. Testing Requirements

**Unit Tests:**
- Test all methods in isolation
- Test positive and negative cases
- Test edge cases and error conditions
- Use mock game states for controlled testing

**Integration Tests:**
- Test interactions with other card types
- Test common card combinations
- Test timing and priority rules
- Test state-based actions

**Scenario Tests:**
- Create realistic game scenarios
- Test complex interactions
- Test win/loss conditions
- Test unusual game states

**Performance Tests:**
- Measure execution time
- Test memory usage
- Benchmark complex ability chains
- Test large game states

### 3. Acceptance Criteria

A card implementation is complete when:
- [ ] All functionality is implemented
- [ ] All tests pass
- [ ] Code review is approved
- [ ] Documentation is complete
- [ ] Integration testing shows no issues

## Documentation Standards

Comprehensive documentation is required for all implementations.

### 1. Code Documentation
All code must have JSDoc comments:

```typescript
/**
 * Implements the "When this creature dies" triggered ability.
 * 
 * This ability triggers when the source creature is put into the graveyard
 * from the battlefield, and resolves by gaining life for the controller.
 * 
 * @implements {ITriggeredAbility}
 * @pattern {Triggered Ability}
 * @mtg-rules {Comprehensive Rules 603.6c, 119.3}
 * 
 * @example
 * // When Grizzly Bears dies, controller gains 1 life
 * const ability = new WhenCreatureDiesGainLifeAbility(
 *   'ability_1',
 *   'creature_1',
 *   { lifeGain: 1 }
 * );
 * 
 * @performance
 * Time complexity: O(1)
 * Space complexity: O(1)
 * 
 * @todo
 * - Add support for optional targets
 * - Implement replacement effects
 */
export class WhenCreatureDiesGainLifeAbility implements ITriggeredAbility {
  // Implementation
}
```

### 2. Implementation Notes
Each card must have implementation notes in the set documentation:

```markdown
## Card: Lightning Bolt (card_id: lightning_bolt)

**Oracle Text:** Lightning Bolt deals 3 damage to any target.

**Implementation Approach:**
- Uses DealDamageEffect with damage parameter set to 3
- Targets any creature, player, or planeswalker
- Resolves immediately when cast

**Edge Cases:**
- Target becomes illegal before resolution
- Target has protection from red
- Target has indestructible

**Testing Coverage:**
- [x] Basic damage to creature
- [x] Damage to player
- [x] Damage to planeswalker
- [x] Target with protection
- [x] Target with indestructible
- [x] Illegal target handling
```

### 3. Set Documentation
Each set must have comprehensive documentation:

```markdown
# Alpha Set Implementation

## Overview
- Total cards: 250
- Implemented: 250 (100%)
- Implementation period: MM/DD/YYYY - MM/DD/YYYY
- Implemented by: [Team/Individual]

## Mechanics Implemented
- [x] Basic lands
- [x] Creature combat
- [x] Instant and sorcery spells
- [x] Enchantment Auras
- [ ] Complex interactions (in progress)

## Progress Tracking
| Rarity | Total | Implemented | Progress |
|--------|-------|-------------|----------|
| Common | 100 | 100 | 100% |
| Uncommon | 80 | 80 | 100% |
| Rare | 50 | 50 | 100% |
| Mythic | 20 | 20 | 100% |

## Known Issues
1. **Issue:** Complex ability chains cause performance issues
   - **Status:** Investigating
   - **Workaround:** None
   - **Priority:** High

2. **Issue:** Some replacement effects not fully implemented
   - **Status:** In progress
   - **Workaround:** Avoid complex replacement scenarios
   - **Priority:** Medium
```

## Integration Testing Methodology

A systematic approach to integration testing ensures all card interactions work correctly.

### 1. Test Matrix
Create a test matrix that covers all card type interactions:

| Source \ Target | Creature | Player | Planeswalker | Land | Enchantment | Artifact | Instant | Sorcery |
|----------------|----------|--------|--------------|------|-------------|----------|---------|---------|
| Creature | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |
| Instant | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |
| Sorcery | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |
| Enchantment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| Artifact | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| Land |  |  |  |  |  |  |  |  |
| Planeswalker | ✓ |  | ✓ |  | ✓ | ✓ |  |  |

### 2. Scenario Testing
Create test scenarios for key interactions:

**Scenario 1: Combat with First Strike**
- Setup: Two creatures, one with first strike
- Actions: Attack and block
- Expected: First strike creature deals damage first

**Scenario 2: Counterspell Interaction**
- Setup: Player casts spell, opponent has Counterspell
- Actions: Cast spell, opponent casts Counterspell
- Expected: Spell is countered and goes to graveyard

**Scenario 3: Life Gain and Loss**
- Setup: Player has 5 life, casts spell that deals 3 damage and gains 2 life
- Actions: Resolve spell
- Expected: Player has 4 life

### 3. Automated Testing Framework
Use an automated testing framework to run integration tests:

```typescript
// tests/integration/set_integration.test.ts
describe('Alpha Set Integration Tests', () => {
  // Test suite for common interactions
  describe('Common Interactions', () => {
    it('should handle creature combat correctly', () => {
      // Test creature vs creature combat
    });
    
    it('should handle spell vs creature interactions', () => {
      // Test instant spells vs creatures
    });
  });
  
  // Test suite for complex interactions
  describe('Complex Interactions', () => {
    it('should handle multiple triggered abilities', () => {
      // Test chain of triggered abilities
    });
    
    it('should handle state-based actions correctly', () => {
      // Test SBA resolution
    });
  });
});
```

### 4. Manual Testing Protocol
For scenarios that can't be automated:

1. **Test Case Definition**: Clearly define the test scenario
2. **Setup Instructions**: Step-by-step setup
3. **Execution Steps**: Actions to perform
4. **Expected Results**: What should happen
5. **Result Recording**: Document actual results

## Version Control and Collaboration

Follow these practices for version control and collaboration:

### 1. Branching Strategy
- **Main Branch**: Stable, production-ready code
- **Set Implementation Branches**: One branch per set (e.g., `set/alpha`)
- **Feature Branches**: For implementing specific mechanics
- **Hotfix Branches**: For urgent bug fixes

### 2. Commit Guidelines
- Use conventional commits:
  - `feat: ` for new features
  - `fix: ` for bug fixes
  - `docs: ` for documentation
  - `test: ` for tests
  - `chore: ` for maintenance
- Include card ID in commit message when relevant
- Reference issues or tasks when applicable

### 3. Pull Request Process
1. Create PR from feature branch to set branch
2. Include:
   - Description of changes
   - Related issues
   - Test results
   - Documentation updates
3. Request review from at least one other team member
4. Address all feedback
5. Merge after approval

### 4. Code Ownership
- Each set has a primary implementer
- Core mechanics have designated owners
- Regular knowledge sharing sessions
- Pair programming for complex implementations

## Risk Management

Identify and mitigate risks throughout the implementation process.

### 1. Risk Identification
- **Technical Risks**: Engine limitations, performance issues
- **Scope Risks**: Underestimating complexity, feature creep
- **Quality Risks**: Bugs, incomplete implementations
- **Schedule Risks**: Delays, resource constraints

### 2. Risk Mitigation
- **Technical Risks**: Spike solutions, proof of concepts
- **Scope Risks**: Clear scope definition, regular reviews
- **Quality Risks**: Comprehensive testing, code reviews
- **Schedule Risks**: Realistic estimates, buffer time

### 3. Contingency Planning
- **Scope Reduction**: Prioritize essential cards
- **Resource Allocation**: Reallocate team members as needed
- **Timeline Adjustment**: Extend deadlines if necessary
- **Quality Trade-offs**: Focus on core functionality first

## Continuous Improvement

Regularly review and improve the implementation process.

### 1. Retrospectives
After each set implementation:
- What went well?
- What could be improved?
- What should we start/stop/continue?

### 2. Metrics Tracking
Track key metrics:
- Cards implemented per day
- Bugs per card
- Test coverage
- Implementation time per complexity level

### 3. Process Refinement
Use retrospective findings to:
- Update implementation guides
- Improve tools and frameworks
- Enhance testing processes
- Optimize workflows

This systematic approach provides a comprehensive framework for implementing MTG sets consistently and efficiently. By following this process, we ensure high-quality implementations that are maintainable, testable, and aligned with MTG rules.