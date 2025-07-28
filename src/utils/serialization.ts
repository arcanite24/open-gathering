/**
 * Utility functions for serializing and deserializing game state
 * to handle Maps and other complex objects in JSON
 */

import { IGameState } from '../core/game_state/interfaces';

/**
 * Converts a Map to a plain object for JSON serialization
 */
function mapToObject<T>(map: Map<string, T>): Record<string, T> {
    const obj: Record<string, T> = {};
    for (const [key, value] of map) {
        obj[key] = value;
    }
    return obj;
}

/**
 * Converts a plain object back to a Map
 */
function objectToMap<T>(obj: Record<string, T>): Map<string, T> {
    const map = new Map<string, T>();
    for (const [key, value] of Object.entries(obj)) {
        map.set(key, value);
    }
    return map;
}

/**
 * Serializes a game state for JSON transport
 */
export function serializeGameState(gameState: IGameState): any {
    return {
        ...gameState,
        players: mapToObject(gameState.players),
        zones: mapToObject(gameState.zones),
        cardInstances: mapToObject(gameState.cardInstances),
        cardDefinitions: mapToObject(gameState.cardDefinitions)
    };
}

/**
 * Deserializes a game state from JSON transport
 */
export function deserializeGameState(serializedState: any): IGameState {
    return {
        ...serializedState,
        players: objectToMap(serializedState.players),
        zones: objectToMap(serializedState.zones),
        cardInstances: objectToMap(serializedState.cardInstances),
        cardDefinitions: objectToMap(serializedState.cardDefinitions)
    };
}
