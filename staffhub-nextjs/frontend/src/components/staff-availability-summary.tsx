'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertCircle } from 'lucide-react';

interface StaffAvailability {
  staffId: string;
  staffName: string;
  department: string;
  availableDays: string[];
  availableHours: string;
  nextAvailableSlot?: string;
  isAvailableNow: boolean;
  approvedOutpasses?: number;
  upcomingMeetings?: number;
}

interface StaffAvailabilitySummaryProps {
  staffMembers?: StaffAvailability[];
  isLoading?: boolean;
}

export function StaffAvailabilitySummary({
  staffMembers = [],
  isLoading = false,
}: StaffAvailabilitySummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading staff availability...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No staff availability data available yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Staff availability will be shown once data is loaded.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Staff Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {staffMembers.map((staff) => (
            <div
              key={staff.staffId}
              className="p-4 border rounded-lg space-y-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{staff.staffName}</h4>
                  <p className="text-xs text-muted-foreground">{staff.department}</p>
                </div>
                <Badge
                  variant={staff.isAvailableNow ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {staff.isAvailableNow ? "Available Now" : "Unavailable"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>{staff.availableHours} hrs/week</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">
                    {staff.approvedOutpasses || 0} approvals
                  </span>
                </div>
              </div>

              {staff.availableDays && staff.availableDays.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {staff.availableDays.map((day) => (
                    <Badge key={day} variant="outline" className="text-xs">
                      {day}
                    </Badge>
                  ))}
                </div>
              )}

              {staff.nextAvailableSlot && (
                <p className="text-xs text-muted-foreground italic">
                  Next slot: {staff.nextAvailableSlot}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default StaffAvailabilitySummary;
