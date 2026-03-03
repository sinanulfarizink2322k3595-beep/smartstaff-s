import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  LogOut,
  LogIn,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface StaffRecord {
  id: string;
  name: string;
  staff_id: string;
  department: string;
  destination: string;
  exit_time?: string;
  return_time?: string;
  status: "outside" | "returned" | "late" | "no_outpass";
  expected_return?: string;
  duration_outside?: number;
}

const SecuritySearch = () => {
  const [allStaff, setAllStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "outside" | "returned" | "late">("all");
  const [filterDept, setFilterDept] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStaffData = async () => {
    try {
      // Fetch all approved outpasses (current and recent)
      const { data: outpassData, error: outpassError } = await supabase
        .from("outpass_requests")
        .select("id, student_id, destination, departure_time, return_time, status")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (outpassError) throw outpassError;

      if (!outpassData || outpassData.length === 0) {
        setAllStaff([]);
        setLoading(false);
        return;
      }

      // Fetch all student details
      const studentIds = [...new Set(outpassData.map((o) => o.student_id))];
      const { data: studentData } = await supabase
        .from("profiles")
        .select("id, full_name, department")
        .in("id", studentIds);

      // Extract departments
      if (studentData) {
        const depts = [
          ...new Set(studentData.map((s) => s.department).filter(Boolean)),
        ] as string[];
        setDepartments(depts);
      }

      // Fetch today's gate logs from localStorage
      const allLogs = JSON.parse(localStorage.getItem("gate_logs") || "[]");
      const today = new Date().toISOString().split("T")[0];
      const logsData = allLogs.filter((log: any) => {
        const logDate = new Date(log.verified_at).toISOString().split("T")[0];
        return logDate === today;
      });

      // Create maps for quick lookup
      const studentMap = new Map(
        (studentData || []).map((s) => [s.id, s])
      );
      const outpassMap = new Map(outpassData.map((o) => [o.id, o]));

      // Group logs by outpass_id
      const logsGrouped = new Map<string, Array<any>>();
      (logsData || []).forEach((log: any) => {
        if (!logsGrouped.has(log.outpass_id)) {
          logsGrouped.set(log.outpass_id, []);
        }
        logsGrouped.get(log.outpass_id)!.push(log);
      });

      // Build staff records
      const staffRecords: StaffRecord[] = outpassData.map((outpass) => {
        const student = studentMap.get(outpass.student_id);
        const logs = logsGrouped.get(outpass.id) || [];

        const exitLog = logs.find((l) => l.gate_action === "exit");
        const returnLog = logs.find((l) => l.gate_action === "entry");

        let status: StaffRecord["status"] = "no_outpass";
        let durationOutside = 0;

        if (exitLog && !returnLog) {
          status = "outside";
          durationOutside = Math.floor(
            (Date.now() - new Date(exitLog.verified_at).getTime()) / (1000 * 60)
          );
        } else if (exitLog && returnLog) {
          const expectedReturn = new Date(outpass.return_time).getTime();
          const actualReturn = new Date(returnLog.verified_at).getTime();
          status = actualReturn > expectedReturn ? "late" : "returned";
        }

        return {
          id: outpass.id,
          name: student?.full_name || "Unknown",
          staff_id: outpass.student_id,
          department: student?.department || "Unknown",
          destination: outpass.destination,
          exit_time: exitLog?.verified_at,
          return_time: returnLog?.verified_at,
          status,
          expected_return: outpass.return_time,
          duration_outside: durationOutside,
        };
      });

      setAllStaff(staffRecords);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Error fetching staff data";
      console.error(errMsg, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    return allStaff.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.destination.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || staff.status === filterStatus;

      const matchesDept = filterDept === "all" || staff.department === filterDept;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [allStaff, searchTerm, filterStatus, filterDept]);

  const getStatusBadge = (status: StaffRecord["status"]) => {
    switch (status) {
      case "outside":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Outside
          </Badge>
        );
      case "returned":
        return (
          <Badge className="bg-success text-success-foreground">
            Returned
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            Late Return
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            No Outpass
          </Badge>
        );
    }
  };

  const stats = {
    total: allStaff.length,
    outside: allStaff.filter((s) => s.status === "outside").length,
    returned: allStaff.filter((s) => s.status === "returned").length,
    late: allStaff.filter((s) => s.status === "late").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Staff Search</h1>
            <p className="text-muted-foreground mt-1">
              Search and filter staff by location and status
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TOTAL
                  </p>
                  <p className="text-lg font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    OUTSIDE
                  </p>
                  <p className="text-lg font-bold">{stats.outside}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    RETURNED
                  </p>
                  <p className="text-lg font-bold">{stats.returned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    LATE
                  </p>
                  <p className="text-lg font-bold">{stats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Search Staff
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Name, ID, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Filter Status
            </Label>
            <Select
              value={filterStatus}
              onValueChange={(v: any) => setFilterStatus(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="outside">Currently Outside</SelectItem>
                <SelectItem value="returned">Returned On Time</SelectItem>
                <SelectItem value="late">Late Returns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Filter Department
            </Label>
            <Select
              value={filterDept}
              onValueChange={(v) => setFilterDept(v)}
            >
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
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Results ({filteredStaff.length})
          </h2>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : filteredStaff.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <Search className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No staff found matching your search
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredStaff.map((staff) => (
                <Card
                  key={staff.id}
                  className="border-0 shadow-card hover:shadow-lg transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {staff.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {staff.staff_id}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold mb-1">
                              DEPARTMENT
                            </p>
                            <p className="font-medium">{staff.department}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold mb-1">
                              DESTINATION
                            </p>
                            <p className="font-medium truncate">
                              {staff.destination}
                            </p>
                          </div>
                        </div>

                        {staff.status === "outside" && (
                          <div className="flex items-center gap-2 text-xs text-warning mt-2">
                            <Clock className="w-3 h-3" />
                            {staff.duration_outside} minutes outside
                          </div>
                        )}

                        {staff.exit_time && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <LogOut className="w-3 h-3" />
                            Left:{" "}
                            {new Date(staff.exit_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}

                        {staff.return_time && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <LogIn className="w-3 h-3" />
                            Returned:{" "}
                            {new Date(staff.return_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}

                        {staff.expected_return && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            Expected return:{" "}
                            {new Date(
                              staff.expected_return
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(staff.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecuritySearch;
