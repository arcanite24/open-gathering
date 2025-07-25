# Game State

This directory contains classes and interfaces for managing the game state in the MTG engine.

## Structure

- `interfaces.ts` - Core interfaces defining the structure of game entities (IPlayer, IZone, ICardInstance, IGameState)
- `player.ts` - Implementation of the Player class
- `zone.ts` - Implementation of the Zone class
- `card_instance.ts` - Implementation of the CardInstance class
- `game_state.ts` - Implementation of the main GameState class that holds all game state

## Implementation Approach

Game state is managed through a set of classes that implement the corresponding interfaces. Each game entity has a unique ID and maintains references to other entities through their IDs rather than direct references.