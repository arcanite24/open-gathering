/**
 * Represents a game event that can be emitted and listened to.
 */
export interface GameEvent {
  /** The type of event */
  type: string;
  
  /** Additional data associated with the event */
  payload: any;
}