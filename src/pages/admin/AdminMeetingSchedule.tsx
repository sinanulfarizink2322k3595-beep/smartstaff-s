import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember, Profile } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MeetingRow {
  id: string;
  purpose: string;
  meeting_type: string;
  requested_time: string;
  status: string;
  student?: { full_name: string };
  staff?: { name: string };
}

const AdminMeetingSchedule = () => {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [studentId, setStudentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [meetingType, setMeetingType] = useState("Admin Scheduled");
  const [purpose, setPurpose] = useState("");

  const fetchData = async () => {
    const [meetingRes, studentRes, staffRes] = await Promise.all([
      supabase
        .from("meeting_requests")
        .select(`*, student:profiles!meeting_requests_student_id_fkey(full_name), staff:staff_members!meeting_requests_staff_id_fkey(name)`)
        .order("requested_time", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "student"),
      supabase.from("staff_members").select("*"),
    ]);

    setMeetings((meetingRes.data || []) as MeetingRow[]);
    setStudents((studentRes.data || []) as Profile[]);
    setStaff((staffRes.data || []) as StaffMember[]);
  };

  useEffect(() => { fetchData(); }, []);

  const createSchedule = async () => {
    if (!studentId || !staffId || !requestedTime || !purpose) {
      toast.error("All fields are required");
      return;
    }
    const { error } = await supabase.from("meeting_requests").insert({
      student_id: studentId,
      staff_id: staffId,
      requested_time: new Date(requestedTime).toISOString(),
      meeting_type: meetingType,
      purpose,
      status: "approved",
      staff_remarks: "Scheduled by admin",
    } as Partial<MeetingRow>);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Meeting scheduled");
    setStudentId("");
    setStaffId("");
    setRequestedTime("");
    setPurpose("");
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Meeting / Schedule Management</h1>
          <p className="text-muted-foreground">Schedule teacher meetings and track staff availability for meetings</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Schedule New Meeting</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.department || "General"})</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="datetime-local" value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)} />
            <Input value={meetingType} onChange={(e) => setMeetingType(e.target.value)} placeholder="Meeting type" />
            <div className="md:col-span-2">
              <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Meeting purpose" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={createSchedule}>Schedule Meeting</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Scheduled Meetings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {meetings.slice(0, 30).map((m) => (
              <div key={m.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{m.student?.full_name || "Student"} → {m.staff?.name || "Staff"}</p>
                  <p className="text-sm text-muted-foreground">{m.meeting_type} • {m.purpose}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.requested_time).toLocaleString()}</p>
                </div>
                <Badge className={m.status === "approved" ? "bg-green-600 text-white" : m.status === "pending" ? "bg-yellow-600 text-white" : "bg-red-600 text-white"}>{m.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminMeetingSchedule;
