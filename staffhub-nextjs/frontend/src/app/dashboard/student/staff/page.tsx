"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Mail, Phone, MapPin, Clock, Calendar, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { staffApi } from "@/lib/api";

interface Staff {
  id: string;
  userId: string;
  user: {
    fullName: string;
    email: string;
    phone?: string;
    department?: string;
  };
  availability?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  isAvailable?: boolean;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudentStaffPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch staff list
  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await staffApi.getAll();
      return response.data.staff || response.data || [];
    },
  });

  // Filter staff based on search query
  const filteredStaff = staffList?.filter((staff: Staff) => {
    const query = searchQuery.toLowerCase();
    return (
      staff.user.fullName.toLowerCase().includes(query) ||
      staff.user.email.toLowerCase().includes(query) ||
      staff.user.department?.toLowerCase().includes(query)
    );
  }) || [];

  const getAvailabilitySlots = (availability: any) => {
    if (!availability) return [];
    const slots: { day: string; times: string[] }[] = [];
    
    daysOfWeek.forEach(day => {
      const dayKey = day.toLowerCase() as keyof typeof availability;
      if (availability[dayKey] && availability[dayKey].length > 0) {
        slots.push({ day, times: availability[dayKey] });
      }
    });
    
    return slots;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Staff Availability</h1>
        <p className="text-muted-foreground">View staff members and their available time slots.</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total Staff: {staffList?.length || 0}</span>
            <span>•</span>
            <span>Showing: {filteredStaff.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Staff Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <Card className="col-span-2">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading staff directory...</p>
            </CardContent>
          </Card>
        ) : filteredStaff.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {searchQuery ? "No staff members found matching your search." : "No staff members available."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredStaff.map((staff: Staff) => {
            const availabilitySlots = getAvailabilitySlots(staff.availability);
            const hasAvailability = availabilitySlots.length > 0;

            return (
              <Card key={staff.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1">{staff.user.fullName}</CardTitle>
                      <div className="space-y-1">
                        {staff.user.department && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{staff.user.department}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{staff.user.email}</span>
                        </div>
                        {staff.user.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{staff.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {staff.isAvailable !== false && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Available
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Calendar className="w-4 h-4" />
                      <span>Available Time Slots</span>
                    </div>
                    
                    {hasAvailability ? (
                      <div className="space-y-3">
                        {availabilitySlots.map(({ day, times }) => (
                          <div key={day} className="space-y-2">
                            <p className="text-sm font-medium text-primary">{day}</p>
                            <div className="flex flex-wrap gap-2">
                              {times.map((time, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted text-sm"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          No availability schedule set
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact staff member directly for appointment
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
