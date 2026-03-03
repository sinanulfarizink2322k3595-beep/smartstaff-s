import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LogRow {
  id: string;
  student_name: string;
  roll_number?: string;
  gate_status: string;
  gate_verified_at: string | null;
  departure_time: string;
  return_time: string;
  status: string;
}

const AdminAttendanceLogs = () => {
  const [rows, setRows] = useState<LogRow[]>([]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("outpass_requests")
      .select("id, gate_status, gate_verified_at, departure_time, return_time, status, student:profiles!outpass_requests_student_id_fkey(full_name, roll_number)")
      .order("updated_at", { ascending: false });

    const mapped = ((data || []) as any[]).map((d) => ({
      id: d.id,
      student_name: d.student?.full_name || "Unknown",
      roll_number: d.student?.roll_number || "",
      gate_status: d.gate_status,
      gate_verified_at: d.gate_verified_at,
      departure_time: d.departure_time,
      return_time: d.return_time,
      status: d.status,
    }));
    setRows(mapped);
  };

  useEffect(() => { fetchData(); }, []);

  const lateAlerts = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => r.gate_status === "left" && new Date(r.return_time).getTime() < now);
  }, [rows]);

  const exportCsv = () => {
    const headers = "Student,Roll Number,Gate Status,Verified At,Departure,Return,Request Status\n";
    const body = rows.map((r) => `${r.student_name},${r.roll_number || ""},${r.gate_status},${r.gate_verified_at || ""},${r.departure_time},${r.return_time},${r.status}`).join("\n");
    const blob = new Blob([headers + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">Attendance & Logs</h1>
            <p className="text-muted-foreground">Check-in/check-out records, time tracking, and late entry alerts</p>
          </div>
          <Button onClick={exportCsv}>Export CSV</Button>
        </div>

        {lateAlerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader><CardTitle>Late Return Alerts ({lateAlerts.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {lateAlerts.slice(0, 10).map((r) => (
                <div key={r.id} className="text-sm flex items-center justify-between border-b pb-1">
                  <span>{r.student_name} ({r.roll_number || "—"})</span>
                  <Badge className="bg-orange-600 text-white">Return overdue</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Check-in / Check-out Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {rows.slice(0, 40).map((r) => (
              <div key={r.id} className="border rounded-md p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-medium">{r.student_name} {r.roll_number ? `(${r.roll_number})` : ""}</p>
                  <p className="text-muted-foreground">Out: {new Date(r.departure_time).toLocaleString()} • Return: {new Date(r.return_time).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.gate_status}</Badge>
                  <Badge className={r.status === "approved" ? "bg-green-600 text-white" : r.status === "pending" ? "bg-yellow-600 text-white" : "bg-red-600 text-white"}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAttendanceLogs;
