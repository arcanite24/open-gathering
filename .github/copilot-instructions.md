This is a TypeScript project to build a headless Magic: The Gathering (MTG) game engine. The engine will be decoupled from any UI and run purely the game logic.

## Key Design Principles

- Headless first
- Data-driven card definitions (JSON)
- Code-mapped card logic (TypeScript)
- Event-driven architecture
- Scalability and testability
- Type safety

When helping with implementation tasks, please:
1. Follow the architecture and interfaces defined in the README
2. Use TypeScript best practices
3. Write clear, testable code
4. Add unit tests for new functionality
5. Adhere to the implementation plan's task breakdown

## Extra instructions
- Always run tests after making changes to ensure nothing is broken
- Always check for linting and compile errors.
- Use enums and interfaces to define clear contracts for your code, avoid at all costs using magic strings or numbers
- Re-use as much code as possible, avoid duplicating logic, mainly when writing tests. There's the folder `tests/util` that houses utility files to help with common test setups. Add any new utilities there.