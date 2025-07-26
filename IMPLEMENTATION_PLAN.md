# Implementation Plan

## Phase 0: Core Setup & Interfaces

### Task ID: SETUP-01 ✅ COMPLETED

**Phase:** 0 - Core Setup

**Goal:** Initialize the project structure and basic configuration files.

**Input/Context:** README.md (Section 4 - Directory Structure).

**Instructions:**
1. Create the base directory structure as outlined in the README.
2. Initialize npm (npm init -y).
3. Install TypeScript (npm install typescript @types/node --save-dev).
4. Create a basic tsconfig.json file (target ES2020 or later, module NodeNext, outDir dist, rootDir src, strict mode enabled).
5. Install Jest for testing (npm install jest @types/jest ts-jest --save-dev).
6. Configure Jest to work with TypeScript (create jest.config.js using ts-jest preset).
7. Create placeholder README files within key directories (src/core/abilities/README.md, src/core/events/README.md, etc.) as mentioned in the main README.
8. Create docs/card_schema.md with a basic placeholder structure.

**Deliverables:** Project directory structure, package.json, tsconfig.json, jest.config.js, placeholder READMEs, empty docs/card_schema.md.

**Dependencies:** None.

**Verification:** Check directory structure matches README; config files exist and are syntactically valid; npm install and npm test run without errors (though no tests exist yet).

### Task ID: IFACE-01 ✅ COMPLETED

**Phase:** 0 - Core Setup

**Goal:** Define the core TypeScript interfaces for game state entities.

**Input/Context:** README.md (Sections 2, 3), general MTG knowledge.

**Instructions:**
1. Create src/core/game_state/interfaces.ts.
2. Define interface IPlayer with properties like id: string, life: number, manaPool: ManaPool (define a simple ManaPool type/interface like { W: number, U: number, ... }), handZoneId: string, libraryZoneId: string, graveyardZoneId: string, exileZoneId: string, battlefieldZoneId: string.
3. Define interface IZone with properties like id: string, name: string (e.g., 'Hand', 'Library'), cards: string[] (array of CardInstance IDs), ownerPlayerId: string.
4. Define interface ICardDefinition (placeholder for now, will be refined in DATA-01) with basic properties like id: string, name: string.
5. Define interface ICardInstance with properties like id: string (unique runtime ID), definitionId: string (links to ICardDefinition), ownerPlayerId: string, controllerPlayerId: string, currentZoneId: string, isTapped: boolean, damageMarked: number, counters: Map<string, number>, staticAbilities: string[] (ability instance IDs), triggeredAbilities: string[], activatedAbilities: string[].
6. Define interface IGameState containing players: Map<string, IPlayer>, zones: Map<string, IZone>, cardInstances: Map<string, ICardInstance>, activePlayerId: string, priorityPlayerId: string, turn: number, phase: string, step: string, stackZoneId: string.
7. Add basic JSDoc comments explaining each interface and property.

**Deliverables:** src/core/game_state/interfaces.ts file with the defined interfaces.

**Dependencies:** SETUP-01.

**Verification:** Check interfaces are defined with the specified properties and types; code is valid TypeScript.

### Task ID: IFACE-02 ✅ COMPLETED

**Phase:** 0 - Core Setup

**Goal:** Define the core TypeScript interfaces for Abilities and Effects.

**Input/Context:** README.md (Section 3 - Card Logic Implementation Strategy), IFACE-01.

**Instructions:**
1. Create src/core/abilities/interfaces.ts.
2. Define base interface IAbility with id: string, sourceCardInstanceId: string.
3. Define interface ICost (base interface for costs like mana, tapping).
4. Define interface IEffect with a method resolve(gameState: IGameState, context: EffectContext): IGameState; (Note: using immutable pattern - resolve returns new state). Define a basic EffectContext interface (e.g., { sourceCardInstanceId: string, targets?: Target[] }). Define Target type/interface.
5. Define interface IActivatedAbility extends IAbility adding costs: ICost[], effect: IEffect, canActivate(gameState: IGameState, playerId: string): boolean, activate(gameState: IGameState, playerId: string, targets?: Target[]): IGameState; (Note: activate likely queues the effect onto the stack).
6. Define interface ITriggeredAbility extends IAbility adding triggerCondition: TriggerCondition (define TriggerCondition type/interface), effect: IEffect, checkTrigger(event: GameEvent, gameState: IGameState): boolean, resolve(gameState: IGameState): IGameState; (queues effect). Define GameEvent type/interface (basic structure for now).
7. Define interface IStaticAbility extends IAbility adding applyEffect(gameState: IGameState): IGameState;, removeEffect(gameState: IGameState): IGameState;, getLayer(): number; (placeholder for layer system).
8. Add basic JSDoc comments.

**Deliverables:** src/core/abilities/interfaces.ts file with the defined interfaces.

**Dependencies:** SETUP-01, IFACE-01.

**Verification:** Check interfaces are defined with specified properties/methods; code is valid TypeScript.

## Phase 1: Basic Turn Structure & Actions

### Task ID: DATA-01 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Define the JSON schema for CardDefinition and create sample data for basic lands.

**Input/Context:** README.md (Section 3 - Data Representation Example), IFACE-01, MTG basic land rules.

**Instructions:**
1. Update docs/card_schema.md to formally define the JSON structure for cards, including fields like id (unique string), name, manaCost (string format like "{G}"), cmc (number), types (string[]), subtypes (string[]), supertypes (string[]), oracleText, power (string), toughness (string), loyalty (string), abilities (array of objects with key and parameters), effects (array for sorceries/instants).
2. Create data/sets/basics.json.
3. Add JSON entries for basic lands (Plains, Island, Swamp, Mountain, Forest) following the schema. Use simple IDs like basic_plains. For lands, abilities might include an inherent mana ability key like "inherent_ability_tap_add_mana": { "mana": "{W}" } (even though this is usually intrinsic, representing it explicitly might be useful initially). Leave power/toughness null/absent for non-creatures.

**Deliverables:** Updated docs/card_schema.md, data/sets/basics.json with land data.

**Dependencies:** SETUP-01, IFACE-01.

**Verification:** Schema doc is clear; JSON file is valid and adheres to the schema.

### Task ID: STATE-01 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Implement basic GameStateManager components (Player, Zone classes).

**Input/Context:** IFACE-01, src/core/game_state/interfaces.ts.

**Instructions:**
1. Create src/core/game_state/player.ts. Implement class Player implements IPlayer. Include a constructor to initialize properties.
2. Create src/core/game_state/zone.ts. Implement class Zone implements IZone. Include a constructor. Add methods like addCard(cardId: string), removeCard(cardId: string).
3. Create src/core/game_state/card_instance.ts. Implement class CardInstance implements ICardInstance. Include a constructor.
4. Implement basic unit tests (*.test.ts) for each class, testing constructor initialization and simple methods (like Zone.addCard).

**Deliverables:** player.ts, zone.ts, card_instance.ts and corresponding *.test.ts files.

**Dependencies:** IFACE-01.

**Verification:** Classes implement the interfaces; constructors work; basic methods function as expected; tests pass.

### Task ID: STATE-02 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Implement the main GameState class to hold and manage the overall game state.

**Input/Context:** IFACE-01, STATE-01, src/core/game_state/interfaces.ts.

**Instructions:**
1. Create src/core/game_state/game_state.ts.
2. Implement class GameState implements IGameState.
3. The constructor should initialize the state, potentially taking player initializations (decks) as input to create Player instances and their starting zones (Library, Hand etc.). Create placeholder zones for Battlefield, Graveyard, Exile, Stack for each player.
4. Implement helper methods to retrieve specific entities (e.g., getPlayer(id: string): Player | undefined, getZone(id: string): Zone | undefined, getCardInstance(id: string): CardInstance | undefined).
5. Implement basic unit tests (game_state.test.ts) verifying state initialization and getter methods.

**Deliverables:** game_state.ts and game_state.test.ts.

**Dependencies:** IFACE-01, STATE-01.

**Verification:** Class implements the interface; constructor initializes state correctly (players, zones); getter methods work; tests pass.

### Task ID: RULE-01 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Implement a basic TurnManager to handle phases and steps.

**Input/Context:** IFACE-01, STATE-02, MTG Turn Structure rules (Untap, Upkeep, Draw, Main1, Combat, Main2, End, Cleanup).

**Instructions:**
1. Create src/core/rules/turn_manager.ts.
2. Define enums or constants for Phases (Beginning, PreCombatMain, Combat, PostCombatMain, Ending) and Steps (Untap, Upkeep, Draw, BeginCombat, DeclareAttackers, DeclareBlockers, CombatDamage, EndCombat, EndStep, Cleanup).
3. Implement class TurnManager. It should hold the current phase and step.
4. Implement a method advance(gameState: IGameState): IGameState that progresses the game to the next step/phase according to MTG rules, updating gameState.phase, gameState.step, and potentially gameState.activePlayerId at the end of the turn.
5. Initially, don't implement phase-specific actions (like untapping, drawing), just the progression logic. The method should return the new game state.
6. Implement basic unit tests (turn_manager.test.ts) verifying the progression through phases and steps for a couple of turns.

**Deliverables:** turn_manager.ts and turn_manager.test.ts.

**Dependencies:** IFACE-01, STATE-02.

**Verification:** Class correctly cycles through phases/steps; updates gameState properties; tests pass.

### Task ID: RULE-02 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Implement a basic PriorityManager.

**Input/Context:** IFACE-01, STATE-02, MTG Priority rules.

**Instructions:**
1. Create src/core/rules/priority_manager.ts.
2. Implement class PriorityManager.
3. Implement a method passPriority(gameState: IGameState): IGameState. This method should update the gameState.priorityPlayerId. If the non-active player passes, and the active player already had priority, it might signify moving to the next step or resolving the stack (stack logic comes later). For now, just handle passing between the active and non-active player. Assume 2 players.
4. Implement a method setActivePlayerPriority(gameState: IGameState): IGameState to give priority to the current active player (e.g., at the start of a step).
5. Implement basic unit tests (priority_manager.test.ts) verifying priority passing between two players.

**Deliverables:** priority_manager.ts and priority_manager.test.ts.

**Dependencies:** IFACE-01, STATE-02.

**Verification:** Priority correctly passes between players and can be set to the active player; tests pass.

### Task ID: ACTION-01 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Implement the "Play Land" action logic.

**Input/Context:** IFACE-01, STATE-02, MTG rules for playing lands.

**Instructions:**
1. Create src/core/actions/play_land.ts.
2. Implement a function canPlayLand(gameState: IGameState, playerId: string, cardInstanceId: string): boolean. This should check:
   - Is it the player's turn (playerId === gameState.activePlayerId)?
   - Is it a main phase (gameState.phase is PreCombatMain or PostCombatMain)?
   - Is the stack empty (placeholder check for now, always true)?
   - Does the player have priority (playerId === gameState.priorityPlayerId)?
   - Is the card (cardInstanceId) in the player's hand zone?
   - Is the card a Land type? (Check its CardDefinition).
   - Has the player already played a land this turn? (Requires adding landsPlayedThisTurn: number to IPlayer - Modify IFACE-01 and STATE-01 task deliverables accordingly).
3. Implement a function executePlayLand(gameState: IGameState, playerId: string, cardInstanceId: string): IGameState. This function (assuming canPlayLand is true):
   - Moves the CardInstance from the player's hand zone to their battlefield zone.
   - Increments the player's landsPlayedThisTurn count.
   - Returns the new game state.
4. Implement unit tests (play_land.test.ts) covering legality checks and the state change upon execution. Requires mocking GameState, Player, Zone, CardInstance, CardDefinition.

**Deliverables:** play_land.ts, play_land.test.ts, updated IPlayer interface/class, updated player.test.ts.

**Dependencies:** IFACE-01, STATE-01, STATE-02, DATA-01 (implicitly needs card defs).

**Verification:** Legality checks are correct; state is updated correctly (card moves zone, land count increments); tests pass.

### Task ID: ENGINE-01 ✅ COMPLETED

**Phase:** 1 - Basic Turn Structure & Actions

**Goal:** Implement the basic Engine orchestrator class structure.

**Input/Context:** README.md (Section 2), all previous interfaces and classes.

**Instructions:**
1. Create src/core/engine.ts.
2. Implement class Engine.
3. The constructor should initialize internal instances of TurnManager, PriorityManager, and potentially load card definitions (basic loading for now). It should create the initial GameState.
4. Implement a method startGame(player1Deck: CardDefinition[], player2Deck: CardDefinition[]) to initialize a new game state. This involves creating players, shuffling decks into library zones, drawing initial hands (implement basic draw logic).
5. Implement a method getState(): IGameState to return the current state.
6. Implement a basic submitAction(playerId: string, action: Action) method. Define a simple Action type (e.g., { type: 'PLAY_LAND', cardId: string } or { type: 'PASS_PRIORITY' }). This method should:
   - Check if it's the player's turn to act (based on priority).
   - Call the relevant action logic (e.g., canPlayLand, executePlayLand from ACTION-01 or passPriority from RULE-02).
   - Update the internal GameState.
   - (Later: Emit events/state changes).
7. Implement basic unit tests (engine.test.ts) for startGame and submitting a valid PASS_PRIORITY action.

**Deliverables:** engine.ts and engine.test.ts.

**Dependencies:** All previous IFACE-*, STATE-*, RULE-*, ACTION-* tasks.

**Verification:** Engine initializes; startGame creates a valid initial state; submitAction delegates correctly for pass priority; tests pass.

## Phase 2: Creatures & Combat (Selected Tasks)

### Task ID: DATA-02 ✅ COMPLETED

**Phase:** 2 - Creatures & Combat

**Goal:** Add JSON definitions for simple vanilla creatures (no abilities).

**Input/Context:** docs/card_schema.md, DATA-01, MTG basic creature examples.

**Instructions:**
1. Create data/sets/simple_creatures.json.
2. Add entries for simple creatures like "Grizzly Bears" (2/2 for {1}{G}), "Runeclaw Bear" (2/2 for {1}{G} - functionally identical for now), "Merfolk of the Pearl Trident" (1/1 for {U}).
3. Ensure power and toughness fields are populated correctly.

**Deliverables:** data/sets/simple_creatures.json.

**Dependencies:** DATA-01.

**Verification:** JSON is valid and conforms to the schema; P/T values are correct.

### Task ID: ACTION-02 ✅ COMPLETED

**Phase:** 2 - Creatures & Combat

**Goal:** Implement "Cast Spell" action logic for simple creatures.

**Input/Context:** IFACE-01, IFACE-02, STATE-02, RULE-02, ACTION-01 (for structure), MTG rules for casting creature spells.

**Instructions:**
1. Modify IPlayer to include a more robust manaPool representation if the simple { W: number, ...} isn't sufficient (e.g., handling generic mana). Update STATE-01 deliverables.
2. Create src/core/actions/cast_spell.ts.
3. Implement cost calculation logic (calculateCost(cardDefinition: ICardDefinition): ManaCost).
4. Implement mana payment logic (canPayCost(player: IPlayer, cost: ManaCost) and payCost(player: IPlayer, cost: ManaCost): IPlayer). This involves manipulating the manaPool.
5. Implement canCastSpell(gameState: IGameState, playerId: string, cardInstanceId: string): boolean. Checks:
   - Player turn, main phase, priority, stack empty (basic checks like playLand).
   - Card is in hand.
   - Card has a type that can be cast (Creature, Instant, Sorcery, etc. - check CardDefinition.types).
   - Player can pay the mana cost.
6. Implement executeCastSpell(gameState: IGameState, playerId: string, cardInstanceId: string): IGameState. This function:
   - Pays the mana cost (updates player's mana pool).
   - Moves the CardInstance from Hand zone to the Stack zone (requires Stack zone implementation - Add Task ZONE-01 to implement Stack zone).
   - (Later: Gives priority to opponent).
   - Returns the new game state.
7. Implement unit tests (cast_spell.test.ts) covering legality checks (mana cost, timing) and state changes (mana pool, card moves to stack).

**Deliverables:** cast_spell.ts, cast_spell.test.ts, potentially updated player.ts/IPlayer.

**Dependencies:** IFACE-01, IFACE-02, STATE-01, STATE-02, RULE-02, DATA-02, ZONE-01 (New Task).

**Verification:** Legality checks work; mana payment is correct; card moves to stack; tests pass.

### Task ID: ZONE-01 ✅ COMPLETED

**Phase:** 2 - Creatures & Combat (Prerequisite for ACTION-02)

**Goal:** Define and implement the Stack zone logic.

**Input/Context:** IFACE-01, STATE-01, MTG Stack rules (LIFO).

**Instructions:**
1. Update STATE-02's GameState constructor to create a single, global Stack zone (or potentially one per game if needed later). Ensure gameState.stackZoneId points to it.
2. Consider if the Zone class needs modification for LIFO behavior or if the StackManager (later task) will handle the LIFO logic by reading the Zone.cards array in reverse. For now, ensure cards can be added to the Stack zone via Zone.addCard.
3. Add tests to zone.test.ts or game_state.test.ts verifying the Stack zone's existence and ability to hold card instance IDs.

**Deliverables:** Updated game_state.ts, updated tests.

**Dependencies:** IFACE-01, STATE-01, STATE-02.

**Verification:** Stack zone is created; card IDs can be added to it; tests pass.

### Task ID: RULE-03 ✅ COMPLETED

**Phase:** 2 - Creatures & Combat

**Goal:** Implement basic StackManager to resolve the top item (simple creature spell).

**Input/Context:** IFACE-01, STATE-02, ZONE-01, ACTION-02, MTG Stack resolution.

**Instructions:**
1. Create src/core/rules/stack_manager.ts.
2. Implement class StackManager.
3. Implement resolveTop(gameState: IGameState): IGameState. This method should:
   - Check if the stack zone is not empty.
   - Get the top card instance ID from the stack zone (last element in the Zone.cards array).
   - Get the corresponding CardInstance and its CardDefinition.
   - For a simple creature spell: Move the CardInstance from the Stack zone to the controller's Battlefield zone. Set controller/owner appropriately.
   - Handle summoning sickness (add needsToUntap: boolean or turnEnteredBattlefield: number to ICardInstance? Modify IFACE-01, STATE-01). Mark the creature as summoning sick if applicable.
   - Remove the card instance ID from the Stack zone.
   - Return the new game state.
4. Modify PriorityManager.passPriority (RULE-02): If both players pass priority in succession and the stack is not empty, call StackManager.resolveTop.
5. Implement unit tests (stack_manager.test.ts) verifying resolution of a creature spell (moves to battlefield, summoning sick status).

**Deliverables:** stack_manager.ts, stack_manager.test.ts, updated priority_manager.ts, updated ICardInstance/CardInstance.

**Dependencies:** IFACE-01, STATE-01, STATE-02, ZONE-01, RULE-02, ACTION-02.

**Verification:** Creature spell resolves correctly from stack to battlefield; summoning sickness is applied; priority manager calls resolution correctly; tests pass.

## Phase 3: The Stack & Basic Spells/Abilities

### Task ID: EVENT-01 ✅ COMPLETED

**Phase:** 3 - Stack & Basic Spells/Abilities

**Goal:** Implement a basic Action/Event Bus.

**Input/Context:** README.md (Section 2), Observer design pattern.

**Instructions:**
1. Create src/core/events/event_bus.ts.
2. Define a basic GameEvent interface/type (e.g., { type: string, payload: any }). Refine IFACE-02.
3. Implement class EventBus. Use a simple listener pattern (e.g., Map<string, Function[]>).
4. Implement subscribe(eventType: string, listener: Function).
5. Implement unsubscribe(eventType: string, listener: Function).
6. Implement emit(event: GameEvent). Iterates through listeners for the event type and calls them.
7. Implement basic unit tests (event_bus.test.ts) for subscribing, emitting, and unsubscribing.

**Deliverables:** event_bus.ts, event_bus.test.ts, updated IFACE-02.

**Dependencies:** SETUP-01, IFACE-02.

**Verification:** Can subscribe to events; emitting calls the correct listeners; unsubscribing works; tests pass.

### Task ID: ABILITY-01 ✅ COMPLETED

**Phase:** 3 - Stack & Basic Spells/Abilities

**Goal:** Implement the AbilityRegistry and the first activated ability (Tap for Mana).

**Input/Context:** IFACE-02, DATA-01 (land ability key), STATE-02, MTG mana abilities.

**Instructions:**
1. Create src/core/abilities/registry.ts. Implement a simple AbilityRegistry (e.g., const abilityRegistry = new Map<string, AbilityFactory>();). Define AbilityFactory type. Export functions to registerAbility and createAbilityInstance(key: string, params: any, sourceCardInstanceId: string, gameState: IGameState): IAbility | null.
2. Create src/implementations/costs/tap_cost.ts. Implement class TapCost implements ICost. Add logic to check if the source card can be tapped (is not already tapped, handles summoning sickness for creatures - requires summoning sickness check from RULE-03). Add logic to apply the cost (set isTapped = true on the source card instance).
3. Create src/implementations/effects/add_mana.ts. Implement class AddManaEffect implements IEffect. The resolve method should add the specified mana (from params) to the controller's manaPool.
4. Create src/implementations/abilities/activated_tap_add_mana.ts. Implement class TapAddManaAbility implements IActivatedAbility.
   - Constructor takes source card ID and mana type parameter.
   - costs array includes an instance of TapCost.
   - effect is an instance of AddManaEffect.
   - canActivate checks legality (source isn't tapped, etc. - using TapCost check). Mana abilities usually ignore timing restrictions/priority/stack (verify this rule!).
   - activate applies the cost and resolves the effect immediately (mana abilities don't use the stack).
5. In registry.ts, register the key (e.g., "inherent_ability_tap_add_mana") to a factory function that creates TapAddManaAbility.
6. Modify Engine or GameState initialization: When creating CardInstance objects from CardDefinition, check cardDefinition.abilities, and use the AbilityRegistry to create and attach ability instances to the CardInstance. Update ICardInstance if needed to store these instances.
7. Implement unit tests for TapCost, AddManaEffect, TapAddManaAbility, and the registration/creation process.

**Deliverables:** registry.ts, tap_cost.ts, add_mana.ts, activated_tap_add_mana.ts, corresponding tests, updated Engine/GameState initialization logic, updated ICardInstance/CardInstance.

**Dependencies:** IFACE-02, STATE-01, STATE-02, RULE-03, DATA-01.

**Verification:** Ability registers and can be instantiated; cost checks work; effect adds mana; activation resolves immediately; tests pass.

### Task ID: RULE-04

**Phase:** 3 - Stack & Basic Spells/Abilities

**Goal:** Implement State-Based Actions (SBA) checker.

**Input/Context:** IFACE-01, STATE-02, MTG SBA rules (lethal damage, 0 toughness, etc.).

**Instructions:**
1. Create src/core/rules/sba_checker.ts.
2. Implement class SBAChecker.
3. Implement checkAndApplySBAs(gameState: IGameState): IGameState. This method should:
   - Check for creatures with lethal damage (damage >= toughness).
   - Check for players with <= 0 life.
   - Check for tokens that should cease to exist.
   - Check for legend rule violations (if implemented).
   - For each violation found, apply the appropriate state change (move card to graveyard, set player to lose, etc.).
   - Return the updated game state.
4. Integrate SBAChecker into the game flow (e.g., after stack resolution, after phases).
5. Implement unit tests (sba_checker.test.ts) verifying correct identification and handling of SBAs.

**Deliverables:** sba_checker.ts, sba_checker.test.ts.

**Dependencies:** IFACE-01, STATE-02.

**Verification:** SBAs are correctly identified and applied; game state is updated appropriately; tests pass.

### Task ID: ACTION-03

**Phase:** 3 - Stack & Basic Spells/Abilities

**Goal:** Implement combat-related actions (declare attackers, declare blockers).

**Input/Context:** IFACE-01, STATE-02, MTG combat rules.

**Instructions:**
1. Create src/core/actions/combat_actions.ts.
2. Implement functions for declareAttackers(gameState: IGameState, playerId: string, attackers: string[]): IGameState and declareBlockers(gameState: IGameState, playerId: string, blockers: { blockerId: string, attackerId: string }[]): IGameState.
3. Add combat-related properties to ICardInstance (attacking: boolean, blocking: boolean, blockedBy: string[], blocking: string).
4. Update CardInstance class to include these new properties.
5. Implement legality checks for combat actions (correct phase, correct player, valid creatures, etc.).
6. Implement state changes for combat actions (marking creatures as attacking/blocking, establishing combat relationships).
7. Implement unit tests (combat_actions.test.ts) covering combat declaration legality and state changes.

**Deliverables:** combat_actions.ts, combat_actions.test.ts, updated ICardInstance/CardInstance.

**Dependencies:** IFACE-01, STATE-01, STATE-02, RULE-01.

**Verification:** Combat actions are legal only when appropriate; state changes correctly reflect combat relationships; tests pass.

### Task ID: RULE-05

**Phase:** 3 - Stack & Basic Spells/Abilities

**Goal:** Implement CombatManager to handle combat damage steps.

**Input/Context:** IFACE-01, STATE-02, ACTION-03, MTG combat damage rules.

**Instructions:**
1. Create src/core/rules/combat_manager.ts.
2. Implement class CombatManager.
3. Implement resolveCombatDamage(gameState: IGameState): IGameState. This method should:
   - Calculate damage for each attacking creature (accounting for trample, first strike, double strike if implemented).
   - Calculate damage for each blocking creature.
   - Apply damage to creatures (mark damage, which will be checked by SBA).
   - Handle combat damage to players.
4. Integrate CombatManager with the TurnManager for proper combat phase progression.
5. Implement unit tests (combat_manager.test.ts) verifying correct damage assignment and application.

**Deliverables:** combat_manager.ts, combat_manager.test.ts.

**Dependencies:** IFACE-01, STATE-02, ACTION-03, RULE-04.

**Verification:** Combat damage is correctly calculated and applied; creatures take damage appropriately; tests pass.

## Phase 4: Advanced Features

### Task ID: ABILITY-02

**Phase:** 4 - Advanced Features

**Goal:** Implement triggered abilities.

**Input/Context:** IFACE-02, EVENT-01, MTG triggered abilities.

**Instructions:**
1. Create src/implementations/abilities/triggered_ability_base.ts. Implement a base class for triggered abilities.
2. Create src/implementations/abilities/specific_triggered_abilities.ts for sample triggered abilities (e.g., "When this creature dies, gain 1 life").
3. Implement the triggered ability registration and check mechanism.
4. Update the EventBus integration to check for triggered abilities when events are emitted.
5. Implement unit tests for triggered ability triggering and resolution.

**Deliverables:** triggered_ability_base.ts, specific_triggered_abilities.ts, updated event system integration, tests.

**Dependencies:** IFACE-02, EVENT-01, ABILITY-01.

**Verification:** Triggered abilities correctly trigger on appropriate events; effects are queued properly; tests pass.

### Task ID: EFFECT-01

**Phase:** 4 - Advanced Features

**Goal:** Implement targeted effects system.

**Input/Context:** IFACE-02, MTG targeted spells/abilities.

**Instructions:**
1. Create src/implementations/effects/targeted_effect_base.ts. Implement a base class for targeted effects.
2. Enhance the IEffect interface to handle target selection.
3. Implement target validation logic.
4. Create sample targeted effects (e.g., "Destroy target creature").
5. Implement unit tests for targeted effects.

**Deliverables:** targeted_effect_base.ts, updated IEffect, target validation logic, sample effects, tests.

**Dependencies:** IFACE-02, ABILITY-01.

**Verification:** Targeted effects correctly validate targets; effects are applied to correct targets; tests pass.

### Task ID: ABILITY-03

**Phase:** 4 - Advanced Features

**Goal:** Implement static abilities and continuous effects.

**Input/Context:** IFACE-02, MTG static abilities and continuous effects.

**Instructions:**
1. Create src/implementations/abilities/static_ability_base.ts. Implement a base class for static abilities.
2. Implement a layer system for continuous effects (Layer 1: Copy, Layer 2: Control, Layer 3: Text-changing, Layer 4: Type, Layer 5: Color, Layer 6: Abilities, Layer 7: Power/Toughness).
3. Create sample static abilities (e.g., "Creatures you control get +1/+1").
4. Implement application and removal of continuous effects.
5. Implement unit tests for static abilities and continuous effects.

**Deliverables:** static_ability_base.ts, layer system implementation, sample static abilities, tests.

**Dependencies:** IFACE-02, ABILITY-01.

**Verification:** Static abilities are correctly applied; continuous effects modify game state as expected; layer system works correctly; tests pass.

## Phase 5: Complex Cards & Interactions

### Task ID: DATA-03

**Phase:** 5 - Complex Cards & Interactions

**Goal:** Add JSON definitions for complex cards with abilities.

**Input/Context:** docs/card_schema.md, DATA-01/02, MTG complex cards.

**Instructions:**
1. Create data/sets/complex_cards.json.
2. Add entries for cards with triggered abilities, activated abilities, and static abilities.
3. Ensure ability definitions are complete and correctly reference implementation keys.

**Deliverables:** data/sets/complex_cards.json.

**Dependencies:** DATA-01, DATA-02, ABILITY-01, ABILITY-02, ABILITY-03.

**Verification:** JSON is valid and conforms to the schema; ability references are correct.

### Task ID: ACTION-04

**Phase:** 5 - Complex Cards & Interactions

**Goal:** Implement advanced action types (activate ability, etc.).

**Input/Context:** IFACE-02, ABILITY-01/02/03, MTG advanced actions.

**Instructions:**
1. Create src/core/actions/advanced_actions.ts.
2. Implement activateAbility(gameState: IGameState, playerId: string, cardInstanceId: string, abilityId: string, targets?: Target[]): IGameState.
3. Implement other advanced actions as needed.
4. Add proper legality checks and cost payment for ability activation.
5. Implement unit tests for advanced actions.

**Deliverables:** advanced_actions.ts, tests.

**Dependencies:** IFACE-01, IFACE-02, STATE-02, ABILITY-01/02/03.

**Verification:** Advanced actions work correctly with complex abilities; legality checks are thorough; tests pass.

## Phase 6: HTTP Server Foundation

### Task ID: SERVER-01

**Phase:** 6 - HTTP Server Foundation

**Goal:** Lay the foundation for an HTTP server to expose the engine functionality.

**Input/Context:** Existing engine, Express.js (or similar framework), REST API design principles.

**Instructions:**
1. Install Express.js (or chosen framework) and related dependencies.
2. Create src/server/index.ts to set up the basic server structure.
3. Define API routes for core game operations:
   - POST /games - Create a new game
   - GET /games/:id - Get game state
   - POST /games/:id/actions - Submit an action to a game
4. Implement basic request/response handling.
5. Add error handling middleware.
6. Implement unit tests for the server endpoints.

**Deliverables:** Basic HTTP server with API endpoints, tests.

**Dependencies:** ENGINE-01 and all previous tasks.

**Verification:** Server starts successfully; API endpoints respond correctly; error handling works; tests pass.

### Task ID: SERVER-02

**Phase:** 6 - HTTP Server Foundation

**Goal:** Implement game session management in the HTTP server.

**Input/Context:** SERVER-01, in-memory storage, game state management.

**Instructions:**
1. Implement in-memory storage for active game sessions.
2. Create a GameSessionManager class to handle creation, retrieval, and cleanup of game sessions.
3. Add session timeout functionality.
4. Implement proper cleanup of finished games.
5. Add tests for session management.

**Deliverables:** GameSessionManager, session storage mechanism, tests.

**Dependencies:** SERVER-01.

**Verification:** Game sessions are properly created, retrieved, and cleaned up; timeout works correctly; tests pass.

## Phase 7: Server Robustness & Testing

### Task ID: SERVER-03

**Phase:** 7 - Server Robustness & Testing

**Goal:** Make the HTTP server robust and production-ready.

**Input/Context:** SERVER-01, SERVER-02, security best practices, performance considerations.

**Instructions:**
1. Add input validation for all API endpoints.
2. Implement rate limiting to prevent abuse.
3. Add request logging for debugging and monitoring.
4. Implement proper CORS handling.
5. Add health check endpoint.
6. Add comprehensive error handling with appropriate HTTP status codes.
7. Implement proper shutdown handling.
8. Add integration tests for the complete server workflow.

**Deliverables:** Robust HTTP server with security and performance enhancements, comprehensive tests.

**Dependencies:** SERVER-01, SERVER-02.

**Verification:** Server handles invalid input gracefully; rate limiting works; logging is appropriate; CORS is handled; health check works; shutdown is clean; integration tests pass.

### Task ID: SERVER-04

**Phase:** 7 - Server Robustness & Testing

**Goal:** Add WebSocket support for real-time game updates.

**Input/Context:** SERVER-01, SERVER-02, SERVER-03, WebSocket protocol.

**Instructions:**
1. Install WebSocket library (e.g., ws or socket.io).
2. Implement WebSocket endpoint for real-time game state updates.
3. Add client connection management.
4. Implement broadcasting of game state changes to connected clients.
5. Add authentication/authorization for WebSocket connections.
6. Add tests for WebSocket functionality.

**Deliverables:** WebSocket support for real-time updates, tests.

**Dependencies:** SERVER-01, SERVER-02, SERVER-03.

**Verification:** WebSocket connections are established correctly; game state updates are broadcast; authentication works; tests pass.

## Phase 8: Visual Testing Tooling

### Task ID: TOOL-01

**Phase:** 8 - Visual Testing Tooling

**Goal:** Create a CLI tool for visually testing the engine.

**Input/Context:** Existing engine, command-line interface design.

**Instructions:**
1. Create src/cli/index.ts for the CLI entry point.
2. Implement commands for:
   - Starting a new game
   - Displaying current game state
   - Submitting actions
   - Loading predefined scenarios
3. Implement a text-based game state display.
4. Add command history and autocomplete.
5. Implement save/load functionality for game states.
6. Add tests for CLI functionality.

**Deliverables:** CLI tool for testing the engine, tests.

**Dependencies:** ENGINE-01 and all previous engine tasks.

**Verification:** CLI commands work correctly; game state is displayed properly; actions can be submitted; save/load works; tests pass.

### Task ID: TOOL-02

**Phase:** 8 - Visual Testing Tooling

**Goal:** Create a web-based visual testing interface.

**Input/Context:** SERVER-01/02/03/04, frontend framework (e.g., React), web development.

**Instructions:**
1. Choose a frontend framework (e.g., React, Vue).
2. Create a basic web interface with:
   - Game board display
   - Player information panels
   - Action submission controls
   - Game state visualization
3. Implement WebSocket client to receive real-time updates.
4. Add scenario loading functionality.
5. Implement a simple AI player for testing.
6. Add tests for the web interface components.

**Deliverables:** Web-based visual testing interface, tests.

**Dependencies:** SERVER-01, SERVER-02, SERVER-03, SERVER-04.

**Verification:** Web interface displays game state correctly; actions can be submitted through UI; WebSocket updates work; scenario loading works; AI player functions; tests pass.