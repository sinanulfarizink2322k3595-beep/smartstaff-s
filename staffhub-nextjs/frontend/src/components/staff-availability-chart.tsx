'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Calendar } from "lucide-react";
import React, { useMemo } from "react";

interface StaffAvailabilityChartProps {
  staffMembers?: Array<{
    id: string;
    name: string;
    department?: string;
    availability?: {
      day: string;
      isAvailable: boolean;
      slots: Array<{
        startTime: string;
        endTime: string;
        duration: number;
      }>;
    }[];
  }>;
  isLoading?: boolean;
}

interface DayHours {
  day: string;
  hours: number;
  percentage: number;
}

export function StaffAvailabilityChart({ staffMembers = [], isLoading = false }: StaffAvailabilityChartProps) {
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Default staff availability data if no live data available
  const defaultAvailability = [
    { day: 'Monday', hours: 6, slots: 2 },
    { day: 'Tuesday', hours: 5, slots: 2 },
    { day: 'Wednesday', hours: 4.5, slots: 2 },
    { day: 'Thursday', hours: 6, slots: 2 },
    { day: 'Friday', hours: 5, slots: 2 },
  ];

  const availabilityData = useMemo(() => {
    if (staffMembers && staffMembers.length > 0) {
      // Calculate total hours per day from all staff members
      const dayHours: Record<string, number> = {};
      
      DAYS_OF_WEEK.forEach(day => {
        dayHours[day] = 0;
      });

      staffMembers.forEach(staff => {
        if (staff.availability) {
          staff.availability.forEach(dayAvail => {
            if (dayAvail.isAvailable) {
              const hours = dayAvail.slots.reduce((sum, slot) => sum + (slot.duration / 60), 0);
              dayHours[dayAvail.day] = (dayHours[dayAvail.day] || 0) + hours;
            }
          });
        }
      });

      const totalHours = Object.values(dayHours).reduce((sum, h) => sum + h, 0);
      
      return DAYS_OF_WEEK.map(day => ({
        day,
        hours: parseFloat((dayHours[day] || 0).toFixed(1)),
        percentage: totalHours > 0 ? (dayHours[day] / totalHours) * 100 : 0,
      }));
    }

    // Use default availability if no staff members
    const totalHours = 26.5;
    return defaultAvailability.map(item => ({
      day: item.day,
      hours: item.hours,
      percentage: (item.hours / totalHours) * 100,
    }));
  }, [staffMembers]);

  const totalHours = availabilityData.reduce((sum, day) => sum + day.hours, 0);
  const avgHoursPerDay = (totalHours / 5).toFixed(1);

  // Color mapping for days
  const getColorClass = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-cyan-500',
      'bg-teal-500',
      'bg-emerald-500',
      'bg-green-500',
    ];
    return colors[index % colors.length];
  };

  const getColorText = (index: number): string => {
    const colors = [
      'text-blue-600',
      'text-cyan-600',
      'text-teal-600',
      'text-emerald-600',
      'text-green-600',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Availability Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading staff availability...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Weekly Hours</p>
                <p className="text-3xl font-bold mt-2">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                <p className="text-3xl font-bold mt-2">{avgHoursPerDay}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Days</p>
                <p className="text-3xl font-bold mt-2">{DAYS_OF_WEEK.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Distribution by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {availabilityData.map((day, index) => (
              <div key={day.day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{day.day}</span>
                  <span className={`text-sm font-semibold ${getColorText(index)}`}>
                    {day.hours}h ({day.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getColorClass(index)} rounded-full transition-all duration-300`}
                    style={{ width: `${day.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart Alternative - Visual Representation */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48">
              {/* Simple SVG Pie Chart */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {availabilityData.reduce((acc, day, index) => {
                  const circumference = 2 * Math.PI * 45;
                  const strokeDashoffset = circumference - (day.percentage / 100) * circumference;
                  const rotation = acc.rotation;

                  const element = (
                    <circle
                      key={day.day}
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={`hsl(${(index * 72)}, 70%, 60%)`}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: '50px 50px',
                      }}
                    />
                  );

                  return {
                    elements: [...acc.elements, element],
                    rotation: rotation + (day.percentage * 3.6),
                  };
                }, { elements: [] as React.ReactNode[], rotation: 0 }).elements}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">hours/week</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-8 w-full">
              {availabilityData.map((day, index) => (
                <div key={day.day} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 72}, 70%, 60%)` }}
                  />
                  <span className="text-xs font-medium">{day.day}: {day.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Day</th>
                  <th className="text-center py-2 px-2 font-semibold">Hours</th>
                  <th className="text-center py-2 px-2 font-semibold">Percentage</th>
                  <th className="text-right py-2 px-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {availabilityData.map((day, index) => (
                  <tr key={day.day} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{day.day}</td>
                    <td className="py-3 px-2 text-center">{day.hours}h</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`py-1 px-3 rounded-full text-xs font-semibold ${getColorText(index)} bg-opacity-10`} style={{ backgroundColor: `hsl(${index * 72}, 70%, 90%)` }}>
                        {day.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
