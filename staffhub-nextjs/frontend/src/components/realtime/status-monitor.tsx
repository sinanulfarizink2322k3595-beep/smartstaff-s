/**
 * Realtime Status Monitor & Provider
 * Shows real-time sync status and manages global realtime subscriptions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { realtimeEmitter } from '@/lib/realtime-emitter';
import { realtimeStore } from '@/lib/realtime-store';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface RealtimeContextType {
  isConnected: boolean;
  syncStatus: Record<string, number>;
  eventCount: number;
}

export const RealtimeContext = React.createContext<RealtimeContextType | null>(null);

/**
 * Provider Component - Wrap your app with this
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [syncStatus, setSyncStatus] = useState<Record<string, number>>({});
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Listen for broadcast sync events
    const unsubscribe = realtimeEmitter.subscribe('broadcast:sync-all', () => {
      setEventCount(prev => prev + 1);
      const state = realtimeStore.getState();
      setSyncStatus(state.lastUpdate);
    });

    return unsubscribe;
  }, []);

  return (
    <RealtimeContext.Provider value={{ isConnected, syncStatus, eventCount }}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to use realtime context
 */
export function useRealtimeContext() {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return context;
}

/**
 * Realtime Status Monitor Component
 * Shows connection status and recent updates
 */
export function RealtimeStatusMonitor() {
  const { isConnected, syncStatus, eventCount } = useRealtimeContext();
  const [recentEvents, setRecentEvents] = useState<string[]>([]);

  useEffect(() => {
    realtimeEmitter.subscribe('outpass:update', () => {
      setRecentEvents(prev => ['Outpass Updated', ...prev].slice(0, 5));
    });
    realtimeEmitter.subscribe('meeting:update', () => {
      setRecentEvents(prev => ['Meeting Updated', ...prev].slice(0, 5));
    });
    realtimeEmitter.subscribe('emergency:update', () => {
      setRecentEvents(prev => ['Emergency Updated', ...prev].slice(0, 5));
    });
    realtimeEmitter.subscribe('security:log', () => {
      setRecentEvents(prev => ['Security Log Recorded', ...prev].slice(0, 5));
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="font-semibold text-sm">Live Sync Status</span>
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-center">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            {Object.keys(syncStatus).length}
          </div>
          <div className="text-xs text-muted-foreground">Synced</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-center">
          <div className="text-xs font-semibold text-green-700 dark:text-green-300">
            {eventCount}
          </div>
          <div className="text-xs text-muted-foreground">Events</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 text-center">
          <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
            {recentEvents.length}
          </div>
          <div className="text-xs text-muted-foreground">Recent</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 text-center">
          <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">
            ✓
          </div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Recent Updates</div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {recentEvents.length > 0 ? (
            recentEvents.map((event, idx) => (
              <div
                key={idx}
                className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 flex items-center gap-1"
              >
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                {event}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic">No recent updates</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        Real-time sync active across all dashboards
      </div>
    </div>
  );
}

/**
 * Toast notification for sync events
 */
export function RealtimeSyncNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'success' | 'warning';
  } | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeEmitter.subscribe('broadcast:sync-all', (data) => {
      setNotification({
        message: `✓ Dashboard synced - ${data.type || 'Update'}`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 2000);
    });

    return unsubscribe;
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 z-50">
      <CheckCircle className="w-4 h-4 text-green-600" />
      <span className="text-sm text-green-700 dark:text-green-300">{notification.message}</span>
    </div>
  );
}
