'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Trash2, Clock, Check } from 'lucide-react';
import type { TimeSlot, DayAvailability } from '@/types';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const mockAvailability: DayAvailability[] = [
  {
    day: 'Monday',
    isAvailable: true,
    slots: [
      { id: '1', day: 'Monday', startTime: '09:00', endTime: '12:00', duration: 180, isActive: true },
      { id: '2', day: 'Monday', startTime: '14:00', endTime: '17:00', duration: 180, isActive: true },
    ],
  },
  {
    day: 'Tuesday',
    isAvailable: true,
    slots: [
      { id: '3', day: 'Tuesday', startTime: '09:00', endTime: '11:00', duration: 120, isActive: true },
      { id: '6', day: 'Tuesday', startTime: '14:00', endTime: '17:00', duration: 180, isActive: true },
    ],
  },
  {
    day: 'Wednesday',
    isAvailable: true,
    slots: [
      { id: '7', day: 'Wednesday', startTime: '10:00', endTime: '12:00', duration: 120, isActive: true },
      { id: '8', day: 'Wednesday', startTime: '15:00', endTime: '17:30', duration: 150, isActive: true },
    ],
  },
  {
    day: 'Thursday',
    isAvailable: true,
    slots: [
      { id: '4', day: 'Thursday', startTime: '09:00', endTime: '12:00', duration: 180, isActive: true },
      { id: '9', day: 'Thursday', startTime: '14:00', endTime: '17:00', duration: 180, isActive: true },
    ],
  },
  {
    day: 'Friday',
    isAvailable: true,
    slots: [
      { id: '5', day: 'Friday', startTime: '09:00', endTime: '12:00', duration: 180, isActive: true },
      { id: '10', day: 'Friday', startTime: '14:00', endTime: '16:00', duration: 120, isActive: true },
    ],
  },
];

export default function StaffAvailabilityPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>(mockAvailability);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Load availability from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedAvailability = localStorage.getItem('staffAvailability');
    if (savedAvailability) {
      try {
        setAvailability(JSON.parse(savedAvailability));
      } catch {
        // If parsing fails, use default availability
        setAvailability(mockAvailability);
      }
    }
  }, []);

  // Save availability to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('staffAvailability', JSON.stringify(availability));
    }
  }, [availability, isMounted]);

  const toggleDayAvailability = (day: string) => {
    setAvailability(prev => prev.map(av => av.day === day ? { ...av, isAvailable: !av.isAvailable, slots: av.isAvailable ? [] : av.slots } : av));
  };

  const openAddSlotDialog = (day: string) => {
    setSelectedDay(day);
    setStartTime('');
    setEndTime('');
    setIsAddDialogOpen(true);
  };

  const addTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) return;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (duration <= 0) return;

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      day: selectedDay,
      startTime,
      endTime,
      duration,
      isActive: true,
    };

    setAvailability(prev => prev.map(av => av.day === selectedDay ? { ...av, slots: [...av.slots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)) } : av));
    setIsAddDialogOpen(false);
    setSelectedDay(null);
    setStartTime('');
    setEndTime('');
  };

  const removeTimeSlot = (day: string, slotId: string) => {
    setAvailability(prev => prev.map(av => av.day === day ? { ...av, slots: av.slots.filter(s => s.id !== slotId) } : av));
  };

  const calculateTotalHours = () => {
    return availability.reduce((total, day) => {
      return total + day.slots.reduce((dayTotal, slot) => dayTotal + slot.duration, 0);
    }, 0) / 60;
  };

  const convertTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Availability Manager</h1>
        <p className="text-muted-foreground">Set and maintain your available time slots for meetings.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{availability.filter(a => a.isAvailable).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Days Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{availability.reduce((acc, a) => acc + a.slots.length, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Slots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">{calculateTotalHours().toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">Total Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availability.map((dayAv) => (
              <div key={dayAv.day} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{dayAv.day}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${dayAv.isAvailable ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'}`}>
                      {dayAv.isAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={dayAv.isAvailable ? 'default' : 'outline'}
                    onClick={() => toggleDayAvailability(dayAv.day)}
                  >
                    {dayAv.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                </div>

                {dayAv.isAvailable && (
                  <div>
                    {dayAv.slots.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {dayAv.slots.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between bg-muted p-3 rounded">
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}
                                </p>
                                <p className="text-xs text-muted-foreground">{slot.duration} minutes</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeTimeSlot(dayAv.day, slot.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">No slots added yet</p>
                    )}

                    <Dialog open={isAddDialogOpen && selectedDay === dayAv.day} onOpenChange={(open) => { if (!open) setIsAddDialogOpen(false); setSelectedDay(null); }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddSlotDialog(dayAv.day)}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Slot
                        </Button>
                      </DialogTrigger>
                      {selectedDay === dayAv.day && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Time Slot for {dayAv.day}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Start Time</label>
                              <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">End Time</label>
                              <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                              />
                            </div>
                            {startTime && endTime && (() => {
                              const [sh, sm] = startTime.split(':').map(Number);
                              const [eh, em] = endTime.split(':').map(Number);
                              const duration = (eh * 60 + em) - (sh * 60 + sm);
                              return duration > 0 ? (
                                <p className="text-sm text-green-600 flex items-center gap-2">
                                  <Check className="w-4 h-4" /> Duration: {Math.floor(duration / 60)}h {duration % 60}m
                                </p>
                              ) : (
                                <p className="text-sm text-red-600 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" /> End time must be after start time
                                </p>
                              );
                            })()}
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setSelectedDay(null); }}>Cancel</Button>
                              <Button onClick={addTimeSlot}>Add Slot</Button>
                            </div>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Pro Tip</p>
              <p className="text-sm text-blue-800 mt-1">Set your availability slots to help students schedule meetings efficiently. You can add multiple slots per day and adjust them anytime.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
