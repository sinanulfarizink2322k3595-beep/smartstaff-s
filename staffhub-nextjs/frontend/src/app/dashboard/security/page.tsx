"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { outpassApi, userApi } from "@/lib/api";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  UserCheck,
  UserX,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type GateStatus = "ON_CAMPUS" | "LEFT" | "RETURNED";
type OutpassStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Student {
  id: string;
  fullName: string;
  rollNumber?: string;
  department?: string;
}

interface StaffApprover {
  id: string;
  name: string;
  title?: string;
}

interface Outpass {
  id: string;
  reason: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  status: OutpassStatus;
  gateStatus: GateStatus;
  gateVerifiedAt: string | null;
  requestedBySecurity: boolean;
  createdAt: string;
  student?: Student;
  approvedBy?: StaffApprover | null;
}

const statusClass: Record<OutpassStatus, string> = {
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const gateClass: Record<GateStatus, string> = {
  ON_CAMPUS: "bg-blue-100 text-blue-700",
  LEFT: "bg-orange-100 text-orange-700",
  RETURNED: "bg-green-100 text-green-700",
};

export default function SecurityDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<Outpass | null>(null);
  const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: outpassResponse, refetch: refetchOutpasses, isFetching } = useQuery({
    queryKey: ["outpasses", "security"],
    queryFn: async () => {
      const response = await outpassApi.getAll({ limit: 100 });
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: studentResponse } = useQuery({
    queryKey: ["security-students"],
    queryFn: async () => {
      const response = await userApi.getOrganizationUsers({ role: "STUDENT", limit: 100 });
      return response.data;
    },
    staleTime: 30000,
  });

  const outpasses: Outpass[] = useMemo(() => {
    if (!outpassResponse) return [];
    if (Array.isArray(outpassResponse)) return outpassResponse;
    if (Array.isArray(outpassResponse.data)) return outpassResponse.data;
    return [];
  }, [outpassResponse]);

  const students: Student[] = useMemo(() => {
    if (!studentResponse) return [];
    const raw = Array.isArray(studentResponse) ? studentResponse : studentResponse.data || [];
    return raw.map((s: any) => ({
      id: s.id,
      fullName: s.fullName,
      rollNumber: s.rollNumber,
      department: s.department,
    }));
  }, [studentResponse]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      (s.rollNumber || "").toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  const filteredOutpasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return outpasses;
    return outpasses.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      (o.student?.fullName || "").toLowerCase().includes(q) ||
      (o.student?.rollNumber || "").toLowerCase().includes(q)
    );
  }, [outpasses, searchQuery]);

  const approvedOutpasses = outpasses.filter((o) => o.status === "APPROVED");
  const emergencyRequests = outpasses.filter((o) => o.requestedBySecurity);
  const leftCampus = outpasses.filter((o) => o.gateStatus === "LEFT");
  const returned = outpasses.filter((o) => o.gateStatus === "RETURNED");

  const handleVerify = async () => {
    if (!verifyId.trim()) return;
    try {
      const response = await outpassApi.getById(verifyId.trim());
      const outpass = response.data?.outpass as Outpass | undefined;
      if (!outpass) {
        toast({ title: "Not found", description: "Outpass was not found", variant: "destructive" });
        return;
      }
      setVerifyResult(outpass);
      setSelectedOutpass(outpass);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error?.response?.data?.message || "Unable to verify outpass",
        variant: "destructive",
      });
    }
  };

  const handleGateUpdate = async (outpassId: string, gateStatus: "LEFT" | "RETURNED") => {
    try {
      await outpassApi.updateGateStatus(outpassId, { gateStatus });
      await refetchOutpasses();
      if (verifyResult?.id === outpassId) {
        setVerifyResult({ ...verifyResult, gateStatus, gateVerifiedAt: new Date().toISOString() });
      }
      if (selectedOutpass?.id === outpassId) {
        setSelectedOutpass({ ...selectedOutpass, gateStatus, gateVerifiedAt: new Date().toISOString() });
      }
      toast({ title: "Updated", description: `Gate status set to ${gateStatus}` });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.response?.data?.message || "Could not update gate status",
        variant: "destructive",
      });
    }
  };

  const handleEmergencyCreate = async () => {
    if (!selectedStudentId || !reason || !destination || !departureTime || !returnTime) {
      toast({ title: "Missing fields", description: "Fill all fields before submitting", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await outpassApi.create({
        studentId: selectedStudentId,
        reason,
        destination,
        departureTime,
        returnTime,
      });
      setReason("");
      setDestination("");
      setDepartureTime("");
      setReturnTime("");
      setStudentSearch("");
      setSelectedStudentId("");
      await refetchOutpasses();
      toast({ title: "Submitted", description: "Emergency outpass request sent for staff approval" });
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error?.response?.data?.message || "Unable to create emergency request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isVerifiedApproved = verifyResult?.status === "APPROVED";

  const stats = [
    {
      title: "Active Outpasses",
      value: approvedOutpasses.length,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Emergency Requests",
      value: emergencyRequests.length,
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      title: "Left Campus",
      value: leftCampus.length,
      icon: Clock,
      color: "text-orange-500",
    },
    {
      title: "Returned",
      value: returned.length,
      icon: Shield,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Verify staff approvals, check full outpass details, create manual requests, and track status live
          </p>
        </div>
        <BadgeLive isFetching={isFetching} />
      </div>

      {emergencyRequests.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-semibold text-red-900">Emergency Requests Pending</div>
              <div className="text-sm text-red-700">
                {emergencyRequests.length} emergency outpass request(s) require immediate attention
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1) Verify Outpass & Staff Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                placeholder="Enter outpass ID"
              />
              <Button onClick={handleVerify} className="gap-2">
                <Search className="w-4 h-4" /> Verify
              </Button>
            </div>

            {verifyResult && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-semibold">Outpass: {verifyResult.id}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[verifyResult.status]}`}>
                    {verifyResult.status}
                  </span>
                </div>

                <div className={`p-3 rounded-md text-sm ${isVerifiedApproved ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
                  {isVerifiedApproved ? (
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Approved by: <strong>{verifyResult.approvedBy?.name || "Staff"}</strong>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserX className="w-4 h-4" /> Not approved yet. Student is not cleared for exit.
                    </span>
                  )}
                </div>

                <Button variant="outline" onClick={() => setSelectedOutpass(verifyResult)}>
                  View Full Outpass Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Emergency / Manual Approval Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <Input
                placeholder="Type student name or roll number"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">Select student</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.rollNumber ? `(${s.rollNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div className="text-sm rounded-md bg-muted p-3">
                <p><strong>{selectedStudent.fullName}</strong></p>
                <p className="text-muted-foreground">{selectedStudent.rollNumber || "No roll"} • {selectedStudent.department || "No department"}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Emergency reason" />
            </div>

            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Departure</Label>
                <Input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Return</Label>
                <Input type="datetime-local" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
              </div>
            </div>

            <Button className="w-full" onClick={handleEmergencyCreate} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Staff Approval"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>3) Live Tracking of Requested Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, roll number, or outpass ID"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Student</th>
                  <th className="p-2">Outpass</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Approved By</th>
                  <th className="p-2">Gate</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutpasses.map((o) => (
                  <tr key={o.id} className="border-b align-top">
                    <td className="p-2">
                      <p className="font-medium">{o.student?.fullName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.student?.rollNumber || "—"}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{o.id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{o.reason}</p>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-2">{o.approvedBy?.name || "—"}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${gateClass[o.gateStatus]}`}>
                        {o.gateStatus}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setSelectedOutpass(o)}>
                          Details
                        </Button>
                        {o.status === "APPROVED" && o.gateStatus === "ON_CAMPUS" && (
                          <Button size="sm" onClick={() => handleGateUpdate(o.id, "LEFT")} className="gap-1">
                            <LogOut className="w-3 h-3" /> Exit
                          </Button>
                        )}
                        {o.status === "APPROVED" && o.gateStatus === "LEFT" && (
                          <Button size="sm" onClick={() => handleGateUpdate(o.id, "RETURNED")} className="gap-1">
                            <LogIn className="w-3 h-3" /> Return
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvedOutpasses.slice(0, 5).map((outpass: any) => (
                <div key={outpass.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{outpass.reason}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      outpass.gateStatus === "LEFT" ? "bg-orange-100 text-orange-700" :
                      outpass.gateStatus === "RETURNED" ? "bg-green-100 text-green-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {outpass.gateStatus || "APPROVED"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(outpass.fromDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {approvedOutpasses.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No approved outpasses</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students Currently Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leftCampus.slice(0, 5).map((outpass: any) => (
                <div key={outpass.id} className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                  <div className="font-medium">{outpass.reason}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Left: {new Date(outpass.updatedAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Expected return: {new Date(outpass.toDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {leftCampus.length === 0 && (
                <p className="text-muted-foreground text-center py-8">All students on campus</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedOutpass && (
        <Card>
          <CardHeader>
            <CardTitle>Outpass Full Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <Detail label="Outpass ID" value={selectedOutpass.id} />
              <Detail label="Status" value={selectedOutpass.status} />
              <Detail label="Student" value={selectedOutpass.student?.fullName || "—"} />
              <Detail label="Roll Number" value={selectedOutpass.student?.rollNumber || "—"} />
              <Detail label="Department" value={selectedOutpass.student?.department || "—"} />
              <Detail label="Approved By" value={selectedOutpass.approvedBy?.name || "—"} />
              <Detail label="Destination" value={selectedOutpass.destination} />
              <Detail label="Reason" value={selectedOutpass.reason} />
              <Detail label="Departure" value={new Date(selectedOutpass.departureTime).toLocaleString()} />
              <Detail label="Return" value={new Date(selectedOutpass.returnTime).toLocaleString()} />
              <Detail label="Gate Status" value={selectedOutpass.gateStatus} />
              <Detail label="Requested by Security" value={selectedOutpass.requestedBySecurity ? "Yes" : "No"} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}

function BadgeLive({ isFetching }: { isFetching: boolean }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isFetching ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
      {isFetching ? "Syncing..." : "Live updates on"}
    </span>
  );
}
