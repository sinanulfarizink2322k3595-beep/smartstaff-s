import { useEffect, useMemo, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type AvStatus = "Available" | "Not Available" | "In Meeting" | "Outpass" | "On Leave";

interface Row extends StaffMember {
  status: AvStatus;
}

const AdminAvailabilityDashboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [window, setWindow] = useState("now");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [staffRes, availabilityRes, meetingsRes, outpassRes] = await Promise.all([
      supabase.from("staff_members").select("*"),
      supabase.from("staff_availability").select("*"),
      supabase.from("meeting_requests").select("staff_id, status, requested_time"),
      supabase.from("outpass_requests").select("approved_by, status, departure_time, return_time"),
    ]);

    const staff = (staffRes.data || []) as StaffMember[];
    const availability = availabilityRes.data || [];
    const meetings = meetingsRes.data || [];
    const outpasses = outpassRes.data || [];

    const now = new Date();
    const day = now.getDay();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const enriched: Row[] = staff.map((s) => {
      const av = availability.filter((a: StaffAvailability) => a.staff_id === s.id && a.day_of_week === day && a.is_available);
      const hasSlotNow = av.some((a: StaffAvailability) => {
        const [sh, sm] = a.start_time.split(":").map(Number);
        const [eh, em] = a.end_time.split(":").map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        if (window === "next2h") {
          return start <= nowMins + 120 && end >= nowMins;
        }
        return nowMins >= start && nowMins <= end;
      });

      const inMeeting = meetings.some((m) => {
        if (m.staff_id !== s.id || m.status !== "approved") return false;
        const t = new Date(m.requested_time).getTime();
        const diff = Math.abs(t - now.getTime());
        return diff <= 60 * 60 * 1000;
      });

      const hasOutpassDuty = outpasses.some((o) => {
        if (o.approved_by !== s.id || o.status !== "approved") return false;
        return now >= new Date(o.departure_time) && now <= new Date(o.return_time);
      });

      let status: AvStatus = "Not Available";
      if (inMeeting) status = "In Meeting";
      else if (hasOutpassDuty) status = "Outpass";
      else if (hasSlotNow) status = "Available";
      else if (!av.length) status = "On Leave";

      return { ...s, status };
    });

    setRows(enriched);
    setLoading(false);
  }, [window]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const depts = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => r.department || "General")))], [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchesDept = dept === "all" || (r.department || "General") === dept;
      const matchesSearch = !q || r.name.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [rows, search, dept]);

  const statusCount = useMemo(() => {
    const count = { Available: 0, "Not Available": 0, "In Meeting": 0, Outpass: 0, "On Leave": 0 } as Record<AvStatus, number>;
    filtered.forEach((r) => { count[r.status] += 1; });
    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Staff Availability Dashboard</h1>
          <p className="text-muted-foreground">Real-time view of who is in staff room, in meeting, on leave, or outside</p>
        </div>

        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Search staff by name" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                {depts.map((d) => <SelectItem key={d} value={d}>{d === "all" ? "All Departments" : d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={window} onValueChange={setWindow}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Current Time</SelectItem>
                <SelectItem value="next2h">Next 2 Hours</SelectItem>
              </SelectContent>
            </Select>
            <Badge className="justify-center py-2">{filtered.length} Staff Visible</Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Availability Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusCount}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Daily & Weekly Reports</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Available now</span><span className="font-semibold">{filtered.filter((r) => r.status === "Available").length}</span></div>
              <div className="flex justify-between"><span>In meeting</span><span className="font-semibold">{filtered.filter((r) => r.status === "In Meeting").length}</span></div>
              <div className="flex justify-between"><span>On leave</span><span className="font-semibold">{filtered.filter((r) => r.status === "On Leave").length}</span></div>
              <div className="flex justify-between"><span>Outside (Outpass duty)</span><span className="font-semibold">{filtered.filter((r) => r.status === "Outpass").length}</span></div>
              <div className="text-xs text-muted-foreground pt-2">Tip: use "Next 2 Hours" filter for meeting-planning forecasts.</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Live Staff Status</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Loading...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((r) => (
                  <div key={r.id} className="border rounded-lg p-3 space-y-1">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.title} • {r.department || "General"}</p>
                    <Badge className={r.status === "Available" ? "bg-green-600 text-white" : r.status === "In Meeting" ? "bg-yellow-600 text-white" : r.status === "Outpass" ? "bg-orange-600 text-white" : r.status === "On Leave" ? "bg-purple-600 text-white" : "bg-muted text-foreground"}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAvailabilityDashboard;
