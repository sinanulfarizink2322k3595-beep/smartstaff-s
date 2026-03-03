/**
 * Global Real-Time Event Emitter
 * Enables cross-dashboard live synchronization
 */

type EventCallback = (data: any) => void;
type EventType = 
  | 'outpass:create'
  | 'outpass:update'
  | 'outpass:approve'
  | 'outpass:reject'
  | 'meeting:create'
  | 'meeting:update'
  | 'meeting:schedule'
  | 'meeting:cancel'
  | 'emergency:create'
  | 'emergency:update'
  | 'emergency:resolve'
  | 'availability:update'
  | 'staff:update'
  | 'security:gate-status'
  | 'security:log'
  | 'broadcast:sync-all';

class RealtimeEmitter {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();
  private eventHistory: Map<EventType, any> = new Map();
  private maxHistorySize = 100;

  subscribe(event: EventType, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: EventType, data: any) {
    // Store in history
    this.eventHistory.set(event, {
      data,
      timestamp: Date.now(),
    });

    // Notify all listeners
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    // Broadcast to other tabs/windows via BroadcastChannel
    try {
      const channel = new BroadcastChannel('staffhub-realtime');
      channel.postMessage({
        event,
        data,
        timestamp: Date.now(),
      });
      channel.close();
    } catch (error) {
      // BroadcastChannel not supported, try localStorage
      try {
        localStorage.setItem(
          `staffhub:${event}`,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch {
        // Fallback silent fail
      }
    }
  }

  getLastEvent(event: EventType) {
    return this.eventHistory.get(event);
  }

  getAllEvents() {
    return Object.fromEntries(this.eventHistory);
  }

  clearHistory() {
    this.eventHistory.clear();
  }

  broadcastSync(data: any) {
    this.emit('broadcast:sync-all', {
      ...data,
      syncTime: Date.now(),
    });
  }
}

// Create global singleton instance
export const realtimeEmitter = new RealtimeEmitter();

// Set up cross-tab communication
if (typeof window !== 'undefined') {
  try {
    const channel = new BroadcastChannel('staffhub-realtime');
    channel.addEventListener('message', (event) => {
      const { eventType, data } = event.data;
      // Emit locally for this tab
      realtimeEmitter.emit(eventType, data);
    });

    // Store channel reference for cleanup if needed
    (window as any).__staffhubChannel = channel;
  } catch (error) {
    // BroadcastChannel not supported - will fallback to localStorage
    console.debug('BroadcastChannel not available, using fallback');
  }
}

export type { EventType };
