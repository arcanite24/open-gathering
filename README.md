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
