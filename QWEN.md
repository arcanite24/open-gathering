# Qwen Context for MTG Engine Project

## Project Overview

This is a TypeScript project to build a headless Magic: The Gathering (MTG) game engine. The engine will be decoupled from any UI and run purely the game logic.

## Current Status

The project is in its initial setup phase. We have defined the directory structure and implementation plan, and completed several core tasks.

## Implementation Plan Summary

The implementation is divided into phases:

### Phase 0: Core Setup & Interfaces
- ✅ Set up project structure, TypeScript, Jest
- ✅ Define core interfaces (IPlayer, IZone, ICardInstance, etc.)
- ✅ Define ability interfaces (IActivatedAbility, ITriggeredAbility, etc.)

### Phase 1: Basic Turn Structure & Actions
- ✅ Define card JSON schema
- ✅ Implement basic game state classes (Player, Zone, CardInstance, GameState)
- Implement turn and priority managers
- Implement "Play Land" action
- Create basic Engine orchestrator

### Phase 2: Creatures & Combat
- Add creature card definitions
- Implement "Cast Spell" action for simple creatures
- Implement Stack zone and StackManager
- Implement basic combat logic

### Phase 3: The Stack & Basic Spells/Abilities
- Implement event bus
- Implement ability registry
- Implement first activated ability (Tap for Mana)

## Key Design Principles

- Headless first
- Data-driven card definitions (JSON)
- Code-mapped card logic (TypeScript)
- Event-driven architecture
- Scalability and testability
- Type safety
- Initial scope: Standard 1v1 MTG

## Directory Structure

```
src/
├── core/
│   ├── game_state/
│   ├── rules/
│   ├── events/
│   ├── abilities/
│   └── engine.ts
├── implementations/
│   ├── abilities/
│   └── effects/
├── interfaces/
├── utils/
└── index.ts
data/
└── sets/
tests/
├── core/
├── implementations/
└── scenarios/
docs/
```

## How to Help

When helping with implementation tasks, please:
1. Follow the architecture and interfaces defined in the README
2. Use TypeScript best practices
3. Write clear, testable code
4. Add unit tests for new functionality
5. Adhere to the implementation plan's task breakdown

## Extra instructions
- Whenever you complete a task, update the relevant section in the README and IMPLEMENTATION_PLAN.md