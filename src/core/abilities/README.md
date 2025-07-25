# Abilities

This directory contains the core interfaces and base classes for implementing card abilities in the MTG engine.

## Structure

- `interfaces.ts` - Core interfaces for different types of abilities (IAbility, IActivatedAbility, ITriggeredAbility, IStaticAbility)
- Base classes for ability implementations will be added here as needed

## Implementation Approach

Abilities in this engine are implemented as TypeScript classes that adhere to specific interfaces. Each ability is referenced by a key in the card's JSON definition and is registered in the AbilityRegistry.