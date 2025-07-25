# Rules

This directory contains implementations of the core MTG rules systems.

## Structure

- `turn_manager.ts` - Implementation of turn structure and phase progression
- `priority_manager.ts` - Implementation of priority handling
- `stack_manager.ts` - Implementation of the stack and spell/ability resolution
- `combat_manager.ts` - Implementation of combat phases and mechanics
- `sba_checker.ts` - Implementation of state-based actions

## Implementation Approach

Each rules system is implemented as a separate class that operates on the game state. These classes are used by the main Engine orchestrator to manage the game flow.