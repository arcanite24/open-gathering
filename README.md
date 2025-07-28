# Open Gathering

Open Gathering is a headless Magic: The Gathering (MTG) game engine built with TypeScript. It is designed to provide a robust, type-safe, and extensible foundation for running MTG game logic, completely decoupled from any user interface. This allows it to be used for game simulations, as a backend for various frontends (web, desktop, etc.), or for developing AI players.

## Core Architecture

The engine's architecture is modular, emphasizing a clear separation of concerns between the game state, rules enforcement, and card-specific logic.

```mermaid
graph LR
    subgraph "User Interfaces (CLI, Web)"
        A[Input API] --> C
    end

    subgraph "Core Engine"
        C[Game Engine]
        D[Game State]
        E[Rules Engine]
        F[Event Bus]
        G[Ability & Effect Registry]
    end

    subgraph "Data"
        H[Card Definitions (JSON)]
    end

    C -- Manages --> D
    C -- Uses --> E
    C -- Interacts via --> F
    C -- Looks up --> G
    G -- Reads --> H
    F -- Triggers --> G
    E -- Modifies --> D
```

### Key Modules

-   **Game Engine (`src/core/engine.ts`):** The central orchestrator. It initializes the game state and processes player actions, delegating logic to the appropriate modules.

-   **Game State (`src/core/game_state`):** Represents the entire state of the game at any point in time, including players, zones (battlefield, hand, library, etc.), and individual card instances. The state is designed to be serializable for easy transport over APIs.

-   **Rules Engine (`src/core/rules`):** Enforces the fundamental rules of Magic. This includes:
    -   **Turn Manager:** Manages the progression of turns, phases, and steps.
    -   **Priority Manager:** Handles the passing of priority between players.
    -   **Stack Manager:** Manages the stack for spell and ability resolution.
    -   **State-Based Actions (SBAs):** Checks for and applies automatic game actions like creatures dying from lethal damage.
    -   **Combat Manager:** Handles all aspects of the combat phase.

-   **Event Bus (`src/core/events`):** An event-driven system that decouples game actions from their consequences. Events (e.g., `CREATURE_DIED`) are emitted, and other parts of the engine, like triggered abilities, can subscribe and react to them.

-   **Card Logic (`src/implementations`):**
    -   **Data-Driven Definitions:** Static card data (name, cost, types, power/toughness) is defined in JSON files (`data/sets`).
    -   **Code-Mapped Logic:** Card abilities and effects are implemented as TypeScript classes. An **Ability Registry** (`src/core/abilities/registry.ts`) maps keys from the JSON definitions to their corresponding code implementations. This provides a powerful and type-safe way to define complex card behaviors.

## Development

This section provides guidance for developers contributing to the Open Gathering engine.

### Prerequisites

-   Node.js (v18 or higher)
-   npm (comes with Node.js)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/open-gathering.git
    cd open-gathering
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Key Scripts

-   **Run Tests:**
    ```bash
    npm test
    ```

-   **Compile TypeScript:**
    ```bash
    npm run build
    ```

-   **Check for Type Errors:**
    ```bash
    npx tsc --noEmit
    ```

-   **Start the Game Server:** The engine can be exposed via a WebSocket server for external clients.
    ```bash
    npm run server
    ```

-   **Run the Interactive CLI:** A command-line interface is available for testing and interacting with the engine directly.
    ```bash
    npm run cli
    ```

### CLI Usage

The CLI is a powerful tool for development and testing. It connects to the running game server and allows you to control the game flow.

**Basic Commands:**

-   `new-game [deck1] [deck2]`: Starts a new game.
-   `scenario [name]`: Loads a predefined game state for testing specific interactions.
-   `state` or `show`: Displays the current game state.
-   `help`: Shows all available commands.

**Game Actions:**

-   `play <card>`: Play a land from your hand.
-   `cast <card> [targets...]`: Cast a spell.
-   `activate <card> <ability>`: Activate a card's ability.
-   `pass`: Pass priority to the opponent.

**Automation Commands:**

To speed up testing, the CLI includes commands to automate game progression:

-   `next-turn`: Automatically passes priority until the next turn begins.
-   `to-main`: Advances to the next main phase.
-   `to-combat`: Advances to the combat phase.
-   `to-end`: Advances to the end step.

### Adding a New Card

To add a new card to the engine:

1.  **Define the Card in JSON:** Add a new entry to a relevant file in `data/sets`. Define its static properties like `name`, `manaCost`, `types`, `power`, and `toughness`.

2.  **Implement Abilities (if any):**
    -   If the card has abilities, create new TypeScript classes in `src/implementations/abilities` or `src/implementations/effects`.
    -   These classes must implement the appropriate interfaces (e.g., `IActivatedAbility`, `ITriggeredAbility`).
    -   The logic for the ability (costs, effects, trigger conditions) goes here.

3.  **Register the Ability:**
    -   In `src/core/abilities/registry.ts`, add a new entry that maps a unique ability `key` to your new ability class.
    -   Reference this `key` in the card's JSON definition.

4.  **Add a Test:** Create a new test file in the `tests/` directory to verify the card's functionality and any new interactions it introduces.

## Project Structure

```
.
├── data/             # JSON card definitions
├── docs/             # Project documentation
├── src/              # Source code
│   ├── cli/          # Interactive CLI for testing
│   ├── core/         # Core game engine logic
│   │   ├── abilities # Ability interfaces and registry
│   │   ├── actions   # Player action handlers
│   │   ├── events    # Event bus and event types
│   │   ├── game_state# Game state interfaces and classes
│   │   └── rules     # Game rules enforcement
│   ├── implementations/ # Concrete implementations of abilities, effects, etc.
│   ├── server/       # WebSocket server
│   └── utils/        # Utility functions
├── tests/            # Unit and integration tests
└── package.json      # Project dependencies and scripts
```

## Error Handling & User Guidance

The Open Gathering engine provides comprehensive error handling with user-friendly messages and helpful suggestions. The error system is designed to help users understand what went wrong and how to fix it.

### Error Architecture

The error system consists of several components:

- **ErrorCode Enum**: Categorizes different types of errors for programmatic handling
- **GameError Class**: Enhanced error class with contextual information and suggestions
- **ErrorReporter**: CLI-specific error display with game state context
- **Network Error Handling**: Automatic conversion of API/network errors to user-friendly messages

### Error Types

The engine categorizes errors into several types:

#### General Errors
- `UNKNOWN_ERROR`: Catch-all for unexpected errors
- `COMMAND_NOT_FOUND`: CLI command doesn't exist
- `INVALID_COMMAND`: Command syntax is incorrect

#### Card-related Errors
- `CARD_NOT_FOUND`: Card doesn't exist in the specified location
- `CARD_NOT_IN_HAND`: Trying to play a card that's not in hand
- `CARD_NOT_ON_BATTLEFIELD`: Trying to activate abilities on cards not in play
- `INVALID_CARD`: Card reference is invalid (wrong number, etc.)

#### Game State Errors
- `NOT_ENOUGH_MANA`: Insufficient mana to cast a spell
- `NOT_YOUR_TURN`: Trying to take actions when it's not your turn
- `ACTION_NOT_ALLOWED`: Action violates game rules
- `GAME_PHASE_RESTRICTION`: Action not allowed in current phase

#### CLI-specific Errors
- `INVALID_ARGUMENTS`: Command arguments are invalid
- `INSUFFICIENT_ARGUMENTS`: Not enough arguments provided
- `AMBIGUOUS_COMMAND`: Multiple cards match the provided name

### Using the Error System

#### In CLI Applications

```typescript
import { GameError, ErrorCode } from './src/core/errors';
import { ErrorReporter } from './src/cli/error_reporter';

try {
    // Game action that might fail
    engine.castSpell(playerId, cardId);
} catch (error) {
    // Display user-friendly error with context
    ErrorReporter.displayError(error, gameState);
}
```

#### Creating Custom Errors

```typescript
// Simple error with suggestion
throw new GameError(
    ErrorCode.CARD_NOT_IN_HAND,
    'Card "Lightning Bolt" not found in hand',
    'Use card numbers (1, 2, 3...) or check the exact spelling'
);

// Error with additional context
throw new GameError(
    ErrorCode.INSUFFICIENT_ARGUMENTS,
    'Missing card identifier for cast command',
    'Specify which card to cast using its number or name',
    {
        usage: 'cast <card_identifier> [targets...]',
        example: 'cast 2  or  cast Lightning Bolt player1',
        handSize: 5
    }
);
```

#### Handling Network Errors

```typescript
// Automatic conversion of API errors
try {
    const response = await apiRequest('POST', '/games');
} catch (error) {
    // Automatically converted to GameError with helpful suggestions
    const gameError = GameError.fromNetworkError(
        error,
        'Make sure the server is running on port 3000'
    );
    ErrorReporter.displayError(gameError);
}
```

### Error Display Features

The error reporter provides several helpful features:

#### Contextual Information
Errors automatically show relevant game state information:
- Cards in hand when card lookup fails
- Available abilities when activation fails
- Current turn and phase information
- Valid command suggestions

#### Smart Suggestions
The system provides intelligent suggestions based on the error:
- Shows available cards when card not found
- Suggests correct command syntax
- Provides examples of proper usage
- Shows contextual help for current game state

#### Visual Formatting
Errors are displayed with clear visual formatting:
- ❌ Error indicators
- 💡 Suggestion highlights  
- 📋 Context sections with relevant information
- 🎯 Game status indicators

### Example Error Messages

#### Card Not Found Error
```
❌ Error:
No card matching "bolt" found in hand
💡 Suggestion: Use the card number or check the exact spelling
📝 Context:
  - searchTerm: bolt
  - handSize: 3
  - availableCards: 
    - 1. Plains
    - 2. Lightning Bolt
    - 3. Mountain

📋 Cards in your hand:
  1. Plains
  2. Lightning Bolt  
  3. Mountain
```

#### Network Connection Error
```
❌ Error:
Cannot connect to game server
💡 Suggestion: Make sure the server is running on the correct port (default: 3000)
📝 Context:
  - originalError: connect ECONNREFUSED 127.0.0.1:3000
```

#### Insufficient Arguments Error
```
❌ Error:
Missing arguments for activate command
💡 Suggestion: Specify both the card and ability to activate
📝 Context:
  - usage: activate <card_identifier> <ability_identifier> [targets...]
  - example: activate 1 1  or  activate "Llanowar Elves" 1

⚔️ Cards on your battlefield:
  1. Llanowar Elves
  2. Forest

💡 Quick Help:
  • To activate an ability: "activate <card number> <ability number>"
  • To see game state: "state"
  • For all commands: "help"
```

### Best Practices for Error Handling

#### For Engine Developers
1. **Use Specific Error Codes**: Choose the most specific error code available
2. **Provide Context**: Include relevant game state information in error context
3. **Write Clear Messages**: Error messages should be user-friendly, not technical
4. **Suggest Solutions**: Always provide actionable suggestions when possible

#### For CLI Users
1. **Read Error Messages Carefully**: They contain helpful context and suggestions
2. **Use the Help System**: Type "help" for general guidance, errors show contextual help
3. **Check Game State**: Use "state" command to understand current situation
4. **Use Card Numbers**: More reliable than partial name matching

#### For API Consumers
1. **Handle GameError Types**: Check error codes for programmatic responses
2. **Parse Error Context**: Use context information for detailed error handling
3. **Implement Retry Logic**: For network errors with appropriate backoff
4. **Show User-Friendly Messages**: Convert technical errors to user-understandable text

### Testing Error Scenarios

The error system includes comprehensive tests for various scenarios:

```typescript
// Test specific error types
it('should throw CARD_NOT_IN_HAND error when card not found', () => {
    expect(() => {
        commandHandler.parsePlayAction(['nonexistent'], player, gameState);
    }).toThrow(GameError);
});

// Test error context
it('should include available cards in error context', () => {
    try {
        commandHandler.parsePlayAction(['invalid'], player, gameState);
    } catch (error) {
        expect(error.context.availableCards).toBeDefined();
        expect(error.suggestion).toContain('card number');
    }
});
```

This comprehensive error handling system ensures that users receive clear, actionable feedback when things go wrong, making the CLI much more user-friendly and reducing frustration during gameplay.
