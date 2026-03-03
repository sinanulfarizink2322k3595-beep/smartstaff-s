"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staffApi } from "@/lib/api";

interface StaffMember {
  id: string;
  name: string;
  title: string;
  email?: string | null;
  department: string;
  isHod: boolean;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const staffQuery = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const response = await staffApi.getAll();
      return response.data;
    },
  });

  const staff: StaffMember[] = useMemo(() => {
    const payload = staffQuery.data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }, [staffQuery.data]);

  const departments = useMemo(() => {
    const depts = new Set(staff.map((s) => s.department));
    return Array.from(depts);
  }, [staff]);

  const filteredStaff = useMemo(() => {
    let result = staff;

    if (departmentFilter !== "all") {
      result = result.filter((s) => s.department === departmentFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [staff, departmentFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Staff</h1>
        <p className="text-muted-foreground">View and manage staff members.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">HODs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{staff.filter((s) => s.isHod).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, title, department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => staffQuery.refetch()}>
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="border-t">
                    <td className="p-3 font-medium">{member.name}</td>
                    <td className="p-3">{member.title}</td>
                    <td className="p-3">{member.department}</td>
                    <td className="p-3">{member.email || "-"}</td>
                    <td className="p-3">
                      {member.isHod ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          HOD
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Staff</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                      {staffQuery.isLoading ? "Loading staff..." : "No staff members found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
