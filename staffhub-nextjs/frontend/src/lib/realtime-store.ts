/**
 * Realtime Data Store
 * Central store for managing shared state across all dashboards
 */

import { realtimeEmitter } from './realtime-emitter';

export interface SyncData {
  outpasses: any[];
  meetings: any[];
  emergencies: any[];
  staffAvailability: any[];
  securityLogs: any[];
  lastUpdate: Record<string, number>;
}

class RealtimeStore {
  private data: SyncData = {
    outpasses: [],
    meetings: [],
    emergencies: [],
    staffAvailability: [],
    securityLogs: [],
    lastUpdate: {},
  };

  private listeners: Set<() => void> = new Set();

  // Subscribe to store changes
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Get current data
  getState() {
    return { ...this.data };
  }

  // Update outpasses
  updateOutpasses(outpasses: any[]) {
    this.data.outpasses = outpasses;
    this.data.lastUpdate['outpasses'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('outpass:update', outpasses);
  }

  // Add outpass
  addOutpass(outpass: any) {
    this.data.outpasses = [outpass, ...this.data.outpasses];
    this.data.lastUpdate['outpasses'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('outpass:create', outpass);
  }

  // Update outpass status
  updateOutpassStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED') {
    this.data.outpasses = this.data.outpasses.map(op =>
      op.id === id ? { ...op, status } : op
    );
    this.data.lastUpdate['outpasses'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit(status === 'APPROVED' ? 'outpass:approve' : 'outpass:reject', { id, status });
  }

  // Update meetings
  updateMeetings(meetings: any[]) {
    this.data.meetings = meetings;
    this.data.lastUpdate['meetings'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('meeting:update', meetings);
  }

  // Schedule meeting
  scheduleMeeting(meetingId: string, slotId: string) {
    this.data.meetings = this.data.meetings.map(m =>
      m.id === meetingId ? { ...m, status: 'SCHEDULED', slotId } : m
    );
    this.data.lastUpdate['meetings'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('meeting:schedule', { meetingId, slotId });
  }

  // Update emergencies
  updateEmergencies(emergencies: any[]) {
    this.data.emergencies = emergencies;
    this.data.lastUpdate['emergencies'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('emergency:update', emergencies);
  }

  // Update emergency status
  updateEmergencyStatus(id: string, status: string) {
    this.data.emergencies = this.data.emergencies.map(e =>
      e.id === id ? { ...e, status } : e
    );
    this.data.lastUpdate['emergencies'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('emergency:update', this.data.emergencies);
  }

  // Update staff availability
  updateStaffAvailability(staffId: string, availability: any) {
    this.data.staffAvailability = this.data.staffAvailability.map(sa =>
      sa.staffId === staffId ? { ...sa, ...availability } : sa
    );
    if (!this.data.staffAvailability.some(sa => sa.staffId === staffId)) {
      this.data.staffAvailability.push({ staffId, ...availability });
    }
    this.data.lastUpdate['staffAvailability'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('availability:update', { staffId, availability });
  }

  // Log security event
  logSecurityEvent(event: any) {
    this.data.securityLogs = [event, ...this.data.securityLogs];
    this.data.lastUpdate['securityLogs'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('security:log', event);
  }

  // Gate status update
  updateGateStatus(outpassId: string, action: 'allowed' | 'rejected') {
    this.data.outpasses = this.data.outpasses.map(op =>
      op.id === outpassId ? { ...op, gateStatus: action } : op
    );
    this.data.lastUpdate['outpasses'] = Date.now();
    this.notifyListeners();
    realtimeEmitter.emit('security:gate-status', { outpassId, action });
  }

  // Clear old data
  clearOldData(maxAge: number = 86400000) { // 24 hours default
    const now = Date.now();
    Object.keys(this.data.lastUpdate).forEach(key => {
      if (now - this.data.lastUpdate[key] > maxAge) {
        this.data.lastUpdate[key] = 0;
      }
    });
  }

  // Reset store
  reset() {
    this.data = {
      outpasses: [],
      meetings: [],
      emergencies: [],
      staffAvailability: [],
      securityLogs: [],
      lastUpdate: {},
    };
    this.notifyListeners();
  }
}

export const realtimeStore = new RealtimeStore();

// Set up event listeners to auto-update store
if (typeof window !== 'undefined') {
  realtimeEmitter.subscribe('outpass:update', (data) => {
    if (Array.isArray(data)) {
      realtimeStore.updateOutpasses(data);
    }
  });

  realtimeEmitter.subscribe('meeting:update', (data) => {
    if (Array.isArray(data)) {
      realtimeStore.updateMeetings(data);
    }
  });

  realtimeEmitter.subscribe('emergency:update', (data) => {
    if (Array.isArray(data)) {
      realtimeStore.updateEmergencies(data);
    }
  });
}
