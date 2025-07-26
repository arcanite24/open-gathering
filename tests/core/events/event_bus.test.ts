import { EventBus } from '../../../src/core/events/event_bus';
import { GameEvent } from '../../../src/core/events/event_types';

describe('EventBus', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    eventBus = new EventBus();
  });
  
  describe('subscribe and emit', () => {
    it('should call listeners when an event is emitted', () => {
      const mockListener = jest.fn();
      const event: GameEvent = { type: 'TEST_EVENT', payload: { message: 'Hello' } };
      
      eventBus.subscribe('TEST_EVENT', mockListener);
      eventBus.emit(event);
      
      expect(mockListener).toHaveBeenCalledWith(event);
    });
    
    it('should not call listeners for unrelated events', () => {
      const mockListener = jest.fn();
      const event: GameEvent = { type: 'TEST_EVENT', payload: { message: 'Hello' } };
      const unrelatedEvent: GameEvent = { type: 'UNRELATED_EVENT', payload: {} };
      
      eventBus.subscribe('TEST_EVENT', mockListener);
      eventBus.emit(unrelatedEvent);
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });
  
  describe('unsubscribe', () => {
    it('should remove a listener so it is no longer called', () => {
      const mockListener = jest.fn();
      const event: GameEvent = { type: 'TEST_EVENT', payload: { message: 'Hello' } };
      
      eventBus.subscribe('TEST_EVENT', mockListener);
      eventBus.unsubscribe('TEST_EVENT', mockListener);
      eventBus.emit(event);
      
      expect(mockListener).not.toHaveBeenCalled();
    });
    
    it('should not affect other listeners when one is unsubscribed', () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      const event: GameEvent = { type: 'TEST_EVENT', payload: { message: 'Hello' } };
      
      eventBus.subscribe('TEST_EVENT', mockListener1);
      eventBus.subscribe('TEST_EVENT', mockListener2);
      eventBus.unsubscribe('TEST_EVENT', mockListener1);
      eventBus.emit(event);
      
      expect(mockListener1).not.toHaveBeenCalled();
      expect(mockListener2).toHaveBeenCalledWith(event);
    });
  });
});