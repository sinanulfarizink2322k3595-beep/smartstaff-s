import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Row {
  id: string;
  student_id: string;
  reason: string;
  destination: string;
  departure_time: string;
  return_time: string;
  status: "pending" | "approved" | "rejected";
  hod_remarks?: string | null;
  requested_by_security: boolean;
  gate_status: string;
  student?: { full_name: string; roll_number?: string | null; department?: string | null };
  approver?: { name: string };
}

const AdminOutpassManagement = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);
  const [remarks, setRemarks] = useState("");
  const [approverId, setApproverId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [outRes, staffRes] = await Promise.all([
      supabase
        .from("outpass_requests")
        .select(`
          *,
          student:profiles!outpass_requests_student_id_fkey(full_name, roll_number, department),
          approver:staff_members!outpass_requests_approved_by_fkey(name)
        `)
        .order("created_at", { ascending: false }),
      supabase.from("staff_members").select("*"),
    ]);

    setRows((outRes.data || []) as any);
    setStaff((staffRes.data || []) as StaffMember[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (status: "approved" | "rejected") => {
    if (!selected) return;
    try {
      const payload: any = { status, hod_remarks: remarks || null };
      if (status === "approved" && approverId) payload.approved_by = approverId;

      const { error } = await supabase.from("outpass_requests").update(payload).eq("id", selected.id);
      if (error) throw error;

      if (selected.requested_by_security) {
        await supabase.from("notifications").insert({
          user_id: selected.student_id,
          title: "Emergency Outpass Updated",
          message: `Emergency outpass has been ${status}`,
          type: "outpass",
          related_id: selected.id,
        } as any);
      }

      toast.success(`Request ${status}`);
      setSelected(null);
      setRemarks("");
      setApproverId("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update request");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Outpass Management</h1>
          <p className="text-muted-foreground">Approve/reject requests, handle emergency outpasses, and keep full history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Outpass Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Loading...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Time Out / Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Emergency</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{r.student?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{r.student?.roll_number || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{r.destination}</p>
                        <p className="text-xs text-muted-foreground">{r.reason}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p>{new Date(r.departure_time).toLocaleString()}</p>
                        <p>{new Date(r.return_time).toLocaleString()}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={r.status === "approved" ? "bg-green-600 text-white" : r.status === "rejected" ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>{r.requested_by_security ? <Badge variant="outline">Emergency</Badge> : "—"}</TableCell>
                      <TableCell>{r.approver?.name || "—"}</TableCell>
                      <TableCell><Button variant="outline" size="sm" onClick={() => setSelected(r)}>Review</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review Outpass Request</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm space-y-1">
                <p><span className="font-medium">Student:</span> {selected.student?.full_name}</p>
                <p><span className="font-medium">Reason:</span> {selected.reason}</p>
                <p><span className="font-medium">Destination:</span> {selected.destination}</p>
                <p><span className="font-medium">Expected Return:</span> {new Date(selected.return_time).toLocaleString()}</p>
                {selected.requested_by_security && <Badge variant="outline">Emergency outpass request</Badge>}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Assign approving authority</p>
                <Select value={approverId} onValueChange={setApproverId}>
                  <SelectTrigger><SelectValue placeholder="Select approver" /></SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.title})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Remarks</p>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Approval/Rejection remarks" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => updateStatus("approved")} className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                <Button onClick={() => updateStatus("rejected")} variant="destructive">Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminOutpassManagement;
