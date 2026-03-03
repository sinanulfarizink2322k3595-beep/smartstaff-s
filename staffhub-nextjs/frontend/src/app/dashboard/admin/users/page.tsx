"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type UserRole = "ADMIN" | "STAFF" | "STUDENT" | "SECURITY";

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string | null;
  rollNumber?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptyNewUser = {
  fullName: "",
  email: "",
  password: "",
  role: "STUDENT" as UserRole,
  department: "",
  rollNumber: "",
  phone: "",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<UserRecord>>({});

  // Real data - empty until backend is running
  const users: UserRecord[] = useMemo(() => {
    return [];
  }, []);

  // Stub query
  const usersQuery = {
    refetch: async () => {
      toast({
        title: "Refreshed",
        description: "User list refreshed",
        variant: "default",
      });
    },
    data: [],
    isLoading: false,
  };

  // Stub mutations - backend not running yet
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createMutation = {
    isPending: isCreating,
    mutateAsync: async () => {
      setIsCreating(true);
      try {
        toast({
          title: "Coming Soon",
          description: "User creation will be available when backend is running",
          variant: "default",
        });
      } finally {
        setIsCreating(false);
      }
    },
  };

  const updateMutation = {
    isPending: isUpdating,
    mutateAsync: async (data: unknown) => {
      setIsUpdating(true);
      try {
        toast({
          title: "Coming Soon",
          description: "User updates will be available when backend is running",
          variant: "default",
        });
      } finally {
        setIsUpdating(false);
      }
    },
  };

  const deleteMutation = {
    isPending: isDeleting,
    mutate: (userId: string) => {
      setIsDeleting(true);
      try {
        toast({
          title: "Coming Soon",
          description: "User deletion will be available when backend is running",
          variant: "default",
        });
      } finally {
        setIsDeleting(false);
      }
    },
  };

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setEditingValues({
      fullName: user.fullName,
      role: user.role,
      department: user.department || "",
      rollNumber: user.rollNumber || "",
      phone: user.phone || "",
      isActive: user.isActive,
    });
  };

  const submitCreate = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast({
        title: "Missing fields",
        description: "Name, email and password are required.",
        variant: "destructive",
      });
      return;
    }
    await createMutation.mutateAsync();
  };

  const submitUpdate = async (id: string) => {
    await updateMutation.mutateAsync({ id, data: editingValues });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Users</h1>
        <p className="text-muted-foreground">Manage all users in your organization.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={newUser.fullName}
                onChange={(e) => setNewUser((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="User full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Temporary password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
                <option value="STUDENT">STUDENT</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={newUser.department}
                onChange={(e) => setNewUser((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="Department"
              />
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input
                value={newUser.rollNumber}
                onChange={(e) => setNewUser((prev) => ({ ...prev, rollNumber: e.target.value }))}
                placeholder="Student roll number"
              />
            </div>
          </div>
          <Button onClick={submitCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name/email/department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "ALL" | UserRole)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
              <option value="STUDENT">STUDENT</option>
              <option value="SECURITY">SECURITY</option>
            </select>
            <Button variant="outline" onClick={() => usersQuery.refetch()}>
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isEditing = editingId === user.id;
                  return (
                    <tr key={user.id} className="border-t">
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            value={(editingValues.fullName as string) || ""}
                            onChange={(e) =>
                              setEditingValues((prev) => ({ ...prev, fullName: e.target.value }))
                            }
                          />
                        ) : (
                          user.fullName
                        )}
                      </td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={(editingValues.role as UserRole) || user.role}
                            onChange={(e) =>
                              setEditingValues((prev) => ({ ...prev, role: e.target.value as UserRole }))
                            }
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="STAFF">STAFF</option>
                            <option value="STUDENT">STUDENT</option>
                            <option value="SECURITY">SECURITY</option>
                          </select>
                        ) : (
                          user.role
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            value={(editingValues.department as string) || ""}
                            onChange={(e) =>
                              setEditingValues((prev) => ({ ...prev, department: e.target.value }))
                            }
                          />
                        ) : (
                          user.department || "-"
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(editingValues.isActive)}
                              onChange={(e) =>
                                setEditingValues((prev) => ({ ...prev, isActive: e.target.checked }))
                              }
                            />
                            Active
                          </label>
                        ) : user.isActive ? (
                          <span className="text-green-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-600 font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="p-3 space-x-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => submitUpdate(user.id)}
                              disabled={updateMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(user.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                      {usersQuery.isLoading ? "Loading users..." : "No users found"}
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
