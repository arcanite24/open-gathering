# Events

This directory contains the event bus implementation and event definitions for the MTG engine.

## Structure

- `event_bus.ts` - Implementation of the central event bus for the engine
- `definitions.ts` - Definitions of all game events that can be emitted and listened to

## Implementation Approach

The engine uses an event-driven architecture where game events are emitted and systems can subscribe to them. This promotes loose coupling between different parts of the engine.