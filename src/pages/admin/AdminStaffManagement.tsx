import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, Profile, StaffMember } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, UserCog } from "lucide-react";
import { toast } from "sonner";

type StaffStatus = "Present" | "Absent" | "On Leave" | "Outpass" | "In Meeting";

interface StaffRow extends StaffMember {
  profile?: Profile | null;
  status: StaffStatus;
}

const initialForm = {
  id: "",
  name: "",
  title: "Teacher",
  email: "",
  department: "",
  profile_id: "",
  is_hod: false,
  access_role: "staff",
};

const AdminStaffManagement = () => {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, profileRes, availabilityRes, meetingsRes, outpassRes] = await Promise.all([
        supabase.from("staff_members").select("*"),
        supabase.from("profiles").select("*").in("role", ["staff", "admin"]),
        supabase.from("staff_availability").select("*"),
        supabase.from("meeting_requests").select("staff_id, status, requested_time"),
        supabase.from("outpass_requests").select("student_id, status, departure_time, return_time"),
      ]);

      const staff = (staffRes.data || []) as StaffMember[];
      const profileList = (profileRes.data || []) as Profile[];
      const availability = availabilityRes.data || [];
      const meetings = meetingsRes.data || [];
      const outpasses = outpassRes.data || [];
      setProfiles(profileList);

      const now = new Date();
      const day = now.getDay();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const mapped: StaffRow[] = staff.map((s) => {
        const linkedProfile = profileList.find((p) => p.id === s.profile_id) || null;
        const staffAvail = availability.filter((a: any) => a.staff_id === s.id);
        const todays = staffAvail.filter((a: any) => a.day_of_week === day && a.is_available);
        const hasCurrentSlot = todays.some((a: any) => {
          const [sh, sm] = (a.start_time || "00:00").split(":").map(Number);
          const [eh, em] = (a.end_time || "00:00").split(":").map(Number);
          const start = sh * 60 + sm;
          const end = eh * 60 + em;
          return nowMinutes >= start && nowMinutes <= end;
        });

        const inMeeting = meetings.some((m: any) => {
          if (m.staff_id !== s.id || m.status !== "approved") return false;
          const t = new Date(m.requested_time).getTime();
          return Math.abs(t - now.getTime()) <= 60 * 60 * 1000;
        });

        const onOutpass = linkedProfile
          ? outpasses.some((o: any) =>
              o.student_id === linkedProfile.id &&
              o.status === "approved" &&
              now >= new Date(o.departure_time) &&
              now <= new Date(o.return_time)
            )
          : false;

        let status: StaffStatus = "Absent";
        if (inMeeting) status = "In Meeting";
        else if (onOutpass) status = "Outpass";
        else if (hasCurrentSlot) status = "Present";
        else if (!staffAvail.length) status = "On Leave";

        return { ...s, profile: linkedProfile, status };
      });

      setRows(mapped);
    } catch (e: any) {
      toast.error(e.message || "Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditing(false);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: StaffRow) => {
    setEditing(true);
    setForm({
      id: row.id,
      name: row.name,
      title: row.title || "Teacher",
      email: row.email || "",
      department: row.department || "",
      profile_id: row.profile_id || "",
      is_hod: !!row.is_hod,
      access_role: row.profile?.role === "admin" ? "admin" : "staff",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.department) {
      toast.error("Name and department are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("staff_members")
          .update({
            name: form.name,
            title: form.title,
            email: form.email || null,
            department: form.department,
            profile_id: form.profile_id || null,
            is_hod: form.is_hod,
          })
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_members").insert({
          name: form.name,
          title: form.title,
          email: form.email || null,
          department: form.department,
          profile_id: form.profile_id || null,
          is_hod: form.is_hod,
        });
        if (error) throw error;
      }

      if (form.profile_id) {
        const { error: roleErr } = await supabase
          .from("profiles")
          .update({ role: form.access_role as any, department: form.department })
          .eq("id", form.profile_id);
        if (roleErr) throw roleErr;
      }

      toast.success(editing ? "Staff updated" : "Staff added");
      setOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await supabase.from("staff_members").delete().eq("id", id);
      if (error) throw error;
      toast.success("Staff removed");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Add, edit, delete staff and assign roles (Teacher / HOD / Admin)</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Staff
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search staff by name/department/email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Profiles & Availability Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>{r.department || "—"}</TableCell>
                      <TableCell>{r.email || r.profile?.phone || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{r.is_hod ? "HOD" : "Teacher"}</Badge>
                          {r.profile?.role === "admin" && <Badge>Admin Access</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.status === "Present"
                              ? "bg-green-600 text-white"
                              : r.status === "In Meeting"
                              ? "bg-yellow-600 text-white"
                              : r.status === "Outpass"
                              ? "bg-orange-600 text-white"
                              : r.status === "On Leave"
                              ? "bg-purple-600 text-white"
                              : "bg-muted text-foreground"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Select value={form.title} onValueChange={(value) => setForm((f) => ({ ...f, title: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="HOD">HOD</SelectItem>
                    <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                    <SelectItem value="Professor">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Linked Profile (optional)</Label>
                <Select value={form.profile_id || "none"} onValueChange={(value) => setForm((f) => ({ ...f, profile_id: value === "none" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Select profile" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No profile</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Access Role</Label>
                <Select value={form.access_role} onValueChange={(value) => setForm((f) => ({ ...f, access_role: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <p className="font-medium text-sm">Assign as HOD</p>
                <p className="text-xs text-muted-foreground">HOD can be distinguished in reports</p>
              </div>
              <Button variant={form.is_hod ? "default" : "outline"} size="sm" onClick={() => setForm((f) => ({ ...f, is_hod: !f.is_hod }))}>
                <UserCog className="w-4 h-4 mr-2" /> {form.is_hod ? "Yes" : "No"}
              </Button>
            </div>
            <Button className="w-full" onClick={save} disabled={submitting}>{submitting ? "Saving..." : editing ? "Update Staff" : "Create Staff"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStaffManagement;
