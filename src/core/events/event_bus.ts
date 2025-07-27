import { IGameState } from '../game_state/interfaces';
import { GameEvent } from './event_types';

type EventListener = (event: GameEvent, gameState: IGameState) => void;


/**
 * Event bus for managing game events and listeners.
 */
export class EventBus {
  /** Map of event types to listener functions */
  private listeners: Map<string, EventListener[]>;
  
  /**
   * Creates a new EventBus instance.
   */
  constructor() {
    this.listeners = new Map<string, EventListener[]>();
  }
  
  /**
   * Subscribes a listener function to an event type.
   * @param eventType The type of event to listen for
   * @param listener The function to call when the event is emitted
   */
  subscribe(eventType: string, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);
  }
  
  /**
   * Unsubscribes a listener function from an event type.
   * @param eventType The type of event to unsubscribe from
   * @param listener The function to unsubscribe
   */
  unsubscribe(eventType: string, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      return;
    }
    
    const listeners = this.listeners.get(eventType)!;
    const index = listeners.indexOf(listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Emits an event, calling all subscribed listeners.
   * @param event The event to emit
   * @param gameState The current game state
   */
  emit(event: GameEvent, gameState: IGameState): void {
    if (this.listeners.has(event.type)) {
      const listeners = this.listeners.get(event.type)!;
      for (const listener of listeners) {
        listener(event, gameState);
      }
    }
  }
}