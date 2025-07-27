## Project Overview

This is a TypeScript project to build a headless Magic: The Gathering (MTG) game engine. The engine will be decoupled from any UI and run purely the game logic.

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
- Always run tests after making changes to ensure nothing is broken
- Always check for linting and compile errors
- Use enums and interfaces to define clear contracts for your code, avoid at all costs using magic strings or numbers