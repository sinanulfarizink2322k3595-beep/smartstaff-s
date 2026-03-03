import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STORAGE_KEY = "smartstaff_departments";

const AdminDepartmentManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [deptName, setDeptName] = useState("");
  const [catalog, setCatalog] = useState<string[]>([]);
  const [staffId, setStaffId] = useState("");
  const [targetDept, setTargetDept] = useState("");

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff_members").select("*");
    setStaff((data || []) as StaffMember[]);
  };

  useEffect(() => {
    fetchStaff();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCatalog(JSON.parse(stored));
  }, []);

  const departments = useMemo(() => {
    const live = staff.map((s) => s.department || "General");
    return Array.from(new Set([...live, ...catalog])).filter(Boolean);
  }, [staff, catalog]);

  const addDepartment = () => {
    if (!deptName.trim()) return;
    const next = Array.from(new Set([...catalog, deptName.trim()]));
    setCatalog(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDeptName("");
    toast.success("Department added");
  };

  const assignDept = async () => {
    if (!staffId || !targetDept) {
      toast.error("Select staff and department");
      return;
    }
    const { error } = await supabase.from("staff_members").update({ department: targetDept }).eq("id", staffId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Department assigned");
    setStaffId("");
    setTargetDept("");
    fetchStaff();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Department Management</h1>
          <p className="text-muted-foreground">Add departments, assign staff, and view department-wise coverage</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Add Department</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
              <Button onClick={addDepartment}>Add</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Assign Staff to Department</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.department || "General"})</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={targetDept} onValueChange={setTargetDept}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={assignDept}>Assign</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Department-wise Availability View</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {departments.map((d) => {
              const members = staff.filter((s) => (s.department || "General") === d);
              return (
                <div key={d} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d}</p>
                    <p className="text-xs text-muted-foreground">{members.map((m) => m.name).join(", ") || "No staff"}</p>
                  </div>
                  <span className="text-sm font-semibold">{members.length} staff</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDepartmentManagement;
