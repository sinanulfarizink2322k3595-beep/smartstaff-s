/**
 * React Hooks for Real-Time Synchronization
 * Enables seamless data sync across all dashboards
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeEmitter, type EventType } from '../lib/realtime-emitter';

/**
 * Hook to subscribe to real-time events
 * Usage: useRealtimeEvent('outpass:update', (data) => {...})
 */
export function useRealtimeEvent(
  event: EventType,
  callback: (data: any) => void
) {
  useEffect(() => {
    const unsubscribe = realtimeEmitter.subscribe(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

/**
 * Hook to emit real-time events from components
 */
export function useRealtimeEmitter() {
  return useCallback((event: EventType, data: any) => {
    realtimeEmitter.emit(event, data);
  }, []);
}

/**
 * Hook to keep local state in sync with realtime updates
 * Usage: const [data, setData] = useRealtimeSync('outpass:update', initialData)
 */
export function useRealtimeSync<T>(
  event: EventType,
  initialData: T
): [T, (data: T) => void] {
  const [data, setData] = useState(initialData);

  useRealtimeEvent(event, (newData) => {
    setData(prev => {
      // Merge objects, replace primitives
      if (typeof prev === 'object' && typeof newData === 'object') {
        return { ...prev, ...newData };
      }
      return newData;
    });
  });

  const updateData = useCallback((newData: T) => {
    setData(newData);
    realtimeEmitter.emit(event, newData);
  }, [event]);

  return [data, updateData];
}

/**
 * Hook to auto-refetch data when related events occur
 * Useful for keeping API queries fresh
 */
export function useRealtimeRefetch(
  queryKey: string[],
  events: EventType[]
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribers = events.map(event =>
      realtimeEmitter.subscribe(event, () => {
        queryClient.refetchQueries({ queryKey });
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, [queryKey, events, queryClient]);
}

/**
 * Hook to broadcast changes to all dashboards
 */
export function useBroadcastUpdate(event: EventType) {
  const emit = useRealtimeEmitter();

  return useCallback((data: any) => {
    emit(event, data);
    // Also send full broadcast for global sync
    realtimeEmitter.broadcastSync({ type: event, data });
  }, [event, emit]);
}

/**
 * Hook to listen for global sync events
 */
export function useGlobalSync(callback: (data: any) => void) {
  useRealtimeEvent('broadcast:sync-all', callback);
}

/**
 * Hook to get last event data
 */
export function useLastEvent(event: EventType) {
  const [eventData, setEventData] = useState(() => 
    realtimeEmitter.getLastEvent(event)
  );

  useRealtimeEvent(event, (data) => {
    setEventData(realtimeEmitter.getLastEvent(event));
  });

  return eventData;
}

/**
 * Hook for auto-sync of array items (for tables, lists)
 */
export function useRealtimeLiveArray<T extends { id: string }>(
  initialArray: T[],
  updateEvent: EventType,
  createEvent: EventType,
  deleteEvent: EventType
): [T[], (item: T) => void, (id: string) => void] {
  const [items, setItems] = useState(initialArray);

  // Listen for updates
  useRealtimeEvent(updateEvent, (updatedItem: T) => {
    setItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  });

  // Listen for new items
  useRealtimeEvent(createEvent, (newItem: T) => {
    setItems(prev => [newItem, ...prev]);
  });

  // Listen for deletions
  useRealtimeEvent(deleteEvent, (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  });

  const updateItem = useCallback((item: T) => {
    realtimeEmitter.emit(updateEvent, item);
  }, [updateEvent]);

  const removeItem = useCallback((id: string) => {
    realtimeEmitter.emit(deleteEvent, id);
  }, [deleteEvent]);

  return [items, updateItem, removeItem];
}
