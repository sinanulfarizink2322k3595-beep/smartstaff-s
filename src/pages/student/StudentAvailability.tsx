import { useEffect, useState, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember, StaffAvailability as StaffAvailabilityType } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Users, Clock, Calendar, CheckCircle, Flame, Search, Zap } from "lucide-react";
import { StaffPresenceWidget } from "@/components/student/StaffPresenceWidget";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];

const StudentAvailability = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [availability, setAvailability] = useState<StaffAvailabilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [availableNowOnly, setAvailableNowOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [staffRes, availRes] = await Promise.all([
        supabase.from("staff_members").select("*").order("name"),
        supabase.from("staff_availability").select("*"),
      ]);
      if (staffRes.data) setStaffMembers(staffRes.data as StaffMember[]);
      if (availRes.data) setAvailability(availRes.data as StaffAvailabilityType[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Get current time for "available now" check
  const getCurrentDayAndTime = () => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7 + 1; // Convert JS day (Sun=0) to DB day (Mon=1)
    const hour = now.getHours();
    return { dayOfWeek, hour };
  };

  // Check if staff is available right now
  const isStaffAvailableNow = useCallback((staffId: string) => {
    const { dayOfWeek, hour } = getCurrentDayAndTime();
    return availability.some((a) => {
      if (a.staff_id !== staffId || !a.is_available) return false;
      if (a.day_of_week !== dayOfWeek) return false;
      const start = parseInt(a.start_time.split(":")[0]);
      const end = parseInt(a.end_time.split(":")[0]);
      return hour >= start && hour < end;
    });
  }, [availability]);

  // Get unique departments
  const departments = useMemo(
    () => [
      ...new Set(
        staffMembers
          .filter((s) => s.department)
          .map((s) => s.department)
      ),
    ].sort(),
    [staffMembers]
  );

  // Filter staff based on search and department
  const filteredStaffMembers = useMemo(() => {
    let filtered = staffMembers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((s) => s.department === departmentFilter);
    }

    // Available now filter
    if (availableNowOnly) {
      filtered = filtered.filter((s) => isStaffAvailableNow(s.id));
    }

    return filtered;
  }, [staffMembers, searchTerm, departmentFilter, availableNowOnly, isStaffAvailableNow]);

  // Heatmap data: for each day/hour, count how many staff are available
  const heatmapData: { day: string; hour: number; hourLabel: string; count: number }[] = [];
  dayNames.slice(1).forEach((day, dayIdx) => {
    const dayNum = dayIdx + 1;
    for (let hour = 9; hour <= 17; hour++) {
      const count = availability.filter((a) => {
        if (a.day_of_week !== dayNum || !a.is_available) return false;
        const start = parseInt(a.start_time.split(":")[0]);
        const end = parseInt(a.end_time.split(":")[0]);
        return hour >= start && hour < end;
      }).length;
      heatmapData.push({
        day,
        hour,
        hourLabel: hour <= 12 ? `${hour} AM` : `${hour - 12} PM`,
        count,
      });
    }
  });

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-muted";
    const intensity = count / maxCount;
    if (intensity <= 0.25) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (intensity <= 0.5) return "bg-emerald-300 dark:bg-emerald-700/50";
    if (intensity <= 0.75) return "bg-emerald-500 dark:bg-emerald-500/70";
    return "bg-emerald-700 dark:bg-emerald-400";
  };

  const getHeatText = (count: number) => {
    if (count === 0) return "text-muted-foreground/50";
    const intensity = count / maxCount;
    if (intensity <= 0.5) return "text-emerald-800 dark:text-emerald-200";
    return "text-white dark:text-emerald-50";
  };

  // Pie: total hours per staff member
  const staffHoursData = staffMembers.map((staff) => {
    const staffAvail = availability.filter((a) => a.staff_id === staff.id && a.is_available);
    const totalHours = staffAvail.reduce((total, a) => {
      const start = parseInt(a.start_time.split(":")[0]);
      const end = parseInt(a.end_time.split(":")[0]);
      return total + (end - start);
    }, 0);
    return { name: staff.name, value: totalHours };
  }).filter((d) => d.value > 0);

  const pieColors = [
    "hsl(217, 91%, 50%)",
    "hsl(199, 89%, 48%)",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
    "hsl(350, 80%, 55%)",
  ];

  // Bar chart: total staff available per day
  const barData = dayNames.slice(1).map((day, dayIdx) => {
    const dayNum = dayIdx + 1;
    const uniqueStaff = new Set(
      availability
        .filter((a) => a.day_of_week === dayNum && a.is_available)
        .map((a) => a.staff_id)
    );
    return { day, staff: uniqueStaff.size };
  });

  const getStaffAvailabilityDetails = (staff: StaffMember) => {
    return availability
      .filter((a) => a.staff_id === staff.id && a.is_available)
      .map((a) => ({
        day: dayNames[a.day_of_week],
        time: `${a.start_time.slice(0, 5)} - ${a.end_time.slice(0, 5)}`,
      }));
  };

  const colors = pieColors;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Staff Availability</h1>
          <p className="text-muted-foreground">
            View when staff are available for meetings with real-time search and filters
          </p>
        </div>

        {/* Live Staff Presence */}
        <StaffPresenceWidget />

        {/* Filters Card */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-semibold block mb-2">Search Staff</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setAvailableNowOnly(!availableNowOnly)}
                variant={availableNowOnly ? "default" : "outline"}
                className="gap-2 w-full"
              >
                <Zap className="w-4 h-4" />
                {availableNowOnly ? "Available Now" : "Show All"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Availability Heatmap
            </CardTitle>
            <p className="text-xs text-muted-foreground">Darker = more staff available at that time</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-xl" />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Header row */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${timeSlots.length}, 1fr)` }}>
                    <div />
                    {timeSlots.map((t) => (
                      <div key={t} className="text-center text-xs text-muted-foreground font-medium py-1">
                        {t}
                      </div>
                    ))}
                  </div>
                  {/* Data rows */}
                  {dayNames.slice(1).map((day) => (
                    <div
                      key={day}
                      className="grid gap-1 mt-1"
                      style={{ gridTemplateColumns: `60px repeat(${timeSlots.length}, 1fr)` }}
                    >
                      <div className="text-xs font-semibold text-foreground flex items-center">{day}</div>
                      {timeSlots.map((_, hourIdx) => {
                        const hour = 9 + hourIdx;
                        const cell = heatmapData.find((d) => d.day === day && d.hour === hour);
                        const count = cell?.count || 0;
                        return (
                          <div
                            key={hourIdx}
                            className={`rounded-md h-10 flex items-center justify-center text-xs font-bold transition-colors ${getHeatColor(count)} ${getHeatText(count)}`}
                            title={`${day} ${timeSlots[hourIdx]}: ${count} staff available`}
                          >
                            {count > 0 ? count : ""}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-4 justify-end">
                    <span className="text-xs text-muted-foreground">Less</span>
                    {["bg-muted", "bg-emerald-100 dark:bg-emerald-900/30", "bg-emerald-300 dark:bg-emerald-700/50", "bg-emerald-500 dark:bg-emerald-500/70", "bg-emerald-700 dark:bg-emerald-400"].map(
                      (cls, i) => (
                        <div key={i} className={`w-5 h-5 rounded ${cls}`} />
                      )
                    )}
                    <span className="text-xs text-muted-foreground">More</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart: Hours per Staff */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Weekly Hours by Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-52 bg-muted animate-pulse rounded-xl" />
              ) : staffHoursData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No availability data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={staffHoursData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {staffHoursData.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} hrs`, "Available"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "13px",
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart: Staff Count per Day */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                Staff Available per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-52 bg-muted animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="staff" fill="hsl(199, 89%, 48%)" radius={[6, 6, 0, 0]} name="Staff Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Staff Schedule Details
            {searchTerm || departmentFilter !== "all" || availableNowOnly ? (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredStaffMembers.length} results)
              </span>
            ) : null}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
                ))
              : filteredStaffMembers.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No staff found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              ) : (
              filteredStaffMembers.map((staff, index) => {
                  const details = getStaffAvailabilityDetails(staff);
                  const availableNow = isStaffAvailableNow(staff.id);

                  return (
                    <Card
                      key={staff.id}
                      className={`relative overflow-hidden border-0 shadow-card hover:shadow-elevated transition-all ${
                        availableNow ? "ring-2 ring-success" : ""
                      }`}
                    >
                      {availableNow && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-success text-white text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3" />
                          Available Now
                        </div>
                      )}
                      {staff.is_hod && !availableNow && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                          HOD
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform ${
                              availableNow ? "scale-110" : ""
                            }`}
                            style={{
                              background: `linear-gradient(135deg, ${colors[index % colors.length]}, ${colors[(index + 1) % colors.length]})`,
                            }}
                          >
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              {staff.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {staff.title}
                            </p>
                            {staff.department && (
                              <p className="text-xs text-primary font-medium">
                                {staff.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                            <Calendar className="w-3 h-3 text-primary" />
                            Available Slots
                          </p>
                          {details.length === 0 ? (
                            <p className="text-xs text-muted-foreground/60 italic">
                              No availability set
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {details.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <CheckCircle className="w-3 h-3 text-success shrink-0" />
                                  <span className="font-medium">{d.day}:</span>
                                  <span className="text-muted-foreground">
                                    {d.time}
                                  </span>
                                </div>
                              ))}
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

        {/* Tips */}
        <Card className="border-0 shadow-card bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              Best Times for Meetings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                <span><strong>Mon, Wed, Fri:</strong> Morning 9 AM - 11 AM</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 shrink-0" />
                <span><strong>Mon to Sat:</strong> Afternoon 2 PM - 5 PM</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-1 shrink-0" />
                <span>Peak availability: Afternoons Mon-Sat</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1 shrink-0" />
                <span>Schedule 24hrs ahead for best results</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentAvailability;
