"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { outpassApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type OutpassStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Outpass {
  id: string;
  reason: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  status: OutpassStatus;
  gateStatus: "ON_CAMPUS" | "LEFT" | "RETURNED";
  requestedBySecurity: boolean;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    rollNumber?: string | null;
    department?: string | null;
  };
}

const badgeClass: Record<OutpassStatus, string> = {
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

export default function AdminOutpassesPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | OutpassStatus>("ALL");
  const [search, setSearch] = useState("");
  const [remarksById, setRemarksById] = useState<Record<string, string>>({});

  const outpassesQuery = useQuery({
    queryKey: ["admin-outpasses", statusFilter],
    queryFn: async () => {
      const response = await outpassApi.getAll({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
      });
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OutpassStatus }) => {
      return outpassApi.updateStatus(id, {
        status,
        remarks: remarksById[id] || undefined,
      });
    },
    onSuccess: async () => {
      toast({ title: "Updated", description: "Outpass status updated successfully." });
      await outpassesQuery.refetch();
    },
    onError: (error: unknown) => {
      const apiError = error as {response?: {data?: {error?: string}}};
      toast({
        title: "Update failed",
        description: apiError?.response?.data?.error || "Could not update outpass status",
        variant: "destructive",
      });
    },
  });

  const outpasses: Outpass[] = useMemo(() => {
    const payload = outpassesQuery.data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }, [outpassesQuery.data]);

  const filteredOutpasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return outpasses;
    return outpasses.filter((outpass) => {
      const studentName = outpass.student?.fullName?.toLowerCase() || "";
      const roll = outpass.student?.rollNumber?.toLowerCase() || "";
      return (
        outpass.id.toLowerCase().includes(q) ||
        outpass.reason.toLowerCase().includes(q) ||
        outpass.destination.toLowerCase().includes(q) ||
        studentName.includes(q) ||
        roll.includes(q)
      );
    });
  }, [outpasses, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Outpasses</h1>
        <p className="text-muted-foreground">Review and monitor outpass requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outpass Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by student, roll no, reason or destination"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | OutpassStatus)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <Button variant="outline" onClick={() => outpassesQuery.refetch()}>
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Reason</th>
                  <th className="text-left p-3">Destination</th>
                  <th className="text-left p-3">Timing</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutpasses.map((outpass) => {
                  const isPending = outpass.status === "PENDING";
                  return (
                    <tr key={outpass.id} className="border-t align-top">
                      <td className="p-3">
                        <div className="font-medium">{outpass.student?.fullName || "-"}</div>
                        <div className="text-xs text-muted-foreground">{outpass.student?.rollNumber || "-"}</div>
                      </td>
                      <td className="p-3">{outpass.reason}</td>
                      <td className="p-3">{outpass.destination}</td>
                      <td className="p-3">
                        <div>{new Date(outpass.departureTime).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">to {new Date(outpass.returnTime).toLocaleString()}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass[outpass.status]}`}>
                          {outpass.status}
                        </span>
                      </td>
                      <td className="p-3 space-y-2 min-w-[240px]">
                        <Input
                          placeholder="Remarks (optional)"
                          value={remarksById[outpass.id] || ""}
                          onChange={(e) =>
                            setRemarksById((prev) => ({
                              ...prev,
                              [outpass.id]: e.target.value,
                            }))
                          }
                          disabled={!isPending}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: outpass.id, status: "APPROVED" })}
                            disabled={!isPending || updateStatusMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate({ id: outpass.id, status: "REJECTED" })}
                            disabled={!isPending || updateStatusMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOutpasses.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                      {outpassesQuery.isLoading ? "Loading outpasses..." : "No outpass requests found"}
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
