import { GameEvent } from './event_types';

/**
 * Event bus for managing game events and listeners.
 */
export class EventBus {
  /** Map of event types to listener functions */
  private listeners: Map<string, Function[]>;
  
  /**
   * Creates a new EventBus instance.
   */
  constructor() {
    this.listeners = new Map<string, Function[]>();
  }
  
  /**
   * Subscribes a listener function to an event type.
   * @param eventType The type of event to listen for
   * @param listener The function to call when the event is emitted
   */
  subscribe(eventType: string, listener: Function): void {
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
  unsubscribe(eventType: string, listener: Function): void {
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
   */
  emit(event: GameEvent): void {
    if (!this.listeners.has(event.type)) {
      return;
    }
    
    const listeners = this.listeners.get(event.type)!;
    
    // Call each listener with the event
    for (const listener of listeners) {
      listener(event);
    }
  }
}