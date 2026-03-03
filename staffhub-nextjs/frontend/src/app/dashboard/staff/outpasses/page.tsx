'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRealtimeEvent, useBroadcastUpdate } from "@/hooks/use-realtime";
import { format } from 'date-fns';
import { Check, X, Clock, AlertCircle, Zap } from 'lucide-react';

interface OutpassRequest {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  reason: string;
  departureTime: Date;
  returnTime: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: Date;
}

const mockOutpassRequests: OutpassRequest[] = [
  {
    id: 'OP001',
    studentId: 'STU001',
    studentName: 'Raj Kumar',
    department: 'Computer Science',
    reason: 'Medical appointment at city hospital',
    departureTime: new Date(Date.now() + 2 * 86400000),
    returnTime: new Date(Date.now() + 2 * 86400000 + 3 * 3600000),
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: 'OP002',
    studentId: 'STU002',
    studentName: 'Priya Singh',
    department: 'Electronics',
    reason: 'Family emergency',
    departureTime: new Date(Date.now() + 86400000),
    returnTime: new Date(Date.now() + 86400000 + 6 * 3600000),
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 1 * 3600000),
  },
  {
    id: 'OP003',
    studentId: 'STU003',
    studentName: 'Amit Patel',
    department: 'Mechanical',
    reason: 'Job interview preparation',
    departureTime: new Date(Date.now() + 3 * 86400000),
    returnTime: new Date(Date.now() + 3 * 86400000 + 4 * 3600000),
    status: 'APPROVED',
    requestedAt: new Date(Date.now() - 5 * 3600000),
  },
  {
    id: 'OP004',
    studentId: 'STU004',
    studentName: 'Neha Gupta',
    department: 'Civil',
    reason: 'Internship work',
    departureTime: new Date(Date.now() + 86400000),
    returnTime: new Date(Date.now() + 86400000 + 8 * 3600000),
    status: 'APPROVED',
    requestedAt: new Date(Date.now() - 8 * 3600000),
  },
  {
    id: 'OP005',
    studentId: 'STU005',
    studentName: 'Vikram Reddy',
    department: 'Chemical',
    reason: 'Sports tournament',
    departureTime: new Date(Date.now() - 86400000),
    returnTime: new Date(Date.now()),
    status: 'COMPLETED',
    requestedAt: new Date(Date.now() - 48 * 3600000),
  },
];

export default function StaffOutpassesPage() {
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>(mockOutpassRequests);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutpass, setSelectedOutpass] = useState<OutpassRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject'>('approve');
  const [syncNotif, setSyncNotif] = useState(false);

  // Real-time synchronization
  const broadcastUpdate = useBroadcastUpdate('outpass:update');

  useRealtimeEvent('outpass:approve', (data) => {
    setOutpasses(prev => prev.map(op => op.id === data.id ? { ...op, status: 'APPROVED' } : op));
    setSyncNotif(true);
    setTimeout(() => setSyncNotif(false), 2000);
  });

  useRealtimeEvent('outpass:reject', (data) => {
    setOutpasses(prev => prev.map(op => op.id === data.id ? { ...op, status: 'REJECTED' } : op));
    setSyncNotif(true);
    setTimeout(() => setSyncNotif(false), 2000);
  });

  const filteredOutpasses = useMemo(() => {
    return outpasses.filter(op => {
      if (statusFilter !== 'ALL' && op.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && op.department !== departmentFilter) return false;
      if (searchTerm && !op.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && !op.studentId.includes(searchTerm)) return false;
      return true;
    });
  }, [outpasses, statusFilter, departmentFilter, searchTerm]);

  const handleApproveReject = (outpass: OutpassRequest, action: 'approve' | 'reject') => {
    setSelectedOutpass(outpass);
    setDialogMode(action);
    setRemarks('');
    setIsDialogOpen(true);
  };

  const submitDecision = () => {
    if (!selectedOutpass) return;
    const status = dialogMode === 'approve' ? 'APPROVED' : 'REJECTED';
    setOutpasses(prev => prev.map(op => op.id === selectedOutpass.id ? { ...op, status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' } : op));
    
    // Broadcast the update to all dashboards
    broadcastUpdate(outpasses.map(op => op.id === selectedOutpass.id ? { ...op, status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' } : op));
    
    setIsDialogOpen(false);
    setSelectedOutpass(null);
    setRemarks('');
  };

  const stats = useMemo(() => ({
    pending: outpasses.filter(o => o.status === 'PENDING').length,
    approved: outpasses.filter(o => o.status === 'APPROVED').length,
    rejected: outpasses.filter(o => o.status === 'REJECTED').length,
    completed: outpasses.filter(o => o.status === 'COMPLETED').length,
  }), [outpasses]);

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-700', label: 'Pending' },
      APPROVED: { bg: 'bg-green-500/20', text: 'text-green-700', label: 'Approved' },
      REJECTED: { bg: 'bg-red-500/20', text: 'text-red-700', label: 'Rejected' },
      COMPLETED: { bg: 'bg-blue-500/20', text: 'text-blue-700', label: 'Completed' },
    };
    const style = config[status as keyof typeof config] || config.PENDING;
    return <span className={`${style.bg} ${style.text} px-2 py-1 rounded-full text-xs font-medium`}>{style.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Outpass Requests</h1>
            <p className="text-muted-foreground">Review and process student outpass requests.</p>
          </div>
          {syncNotif && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">Live synced across dashboards</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Chemical">Chemical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outpass Queue ({filteredOutpasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Reason</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutpasses.map((outpass) => (
                  <tr key={outpass.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{outpass.studentName}</p>
                        <p className="text-xs text-muted-foreground">{outpass.studentId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{outpass.department}</td>
                    <td className="py-3 px-4 text-sm">{outpass.reason}</td>
                    <td className="py-3 px-4 text-sm">
                      {format(outpass.departureTime, 'MMM d')} - {format(outpass.returnTime, 'MMM d')}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(outpass.status)}</td>
                    <td className="py-3 px-4">
                      {outpass.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Dialog open={isDialogOpen && selectedOutpass?.id === outpass.id && dialogMode === 'approve'} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveReject(outpass, 'approve')}>
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                            </DialogTrigger>
                            {selectedOutpass?.id === outpass.id && dialogMode === 'approve' && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Outpass Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium">{outpass.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{outpass.reason}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Remarks (optional)</label>
                                    <Textarea placeholder="Add any remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={submitDecision}>Confirm Approval</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                          <Dialog open={isDialogOpen && selectedOutpass?.id === outpass.id && dialogMode === 'reject'} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => handleApproveReject(outpass, 'reject')}>
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </DialogTrigger>
                            {selectedOutpass?.id === outpass.id && dialogMode === 'reject' && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Outpass Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium">{outpass.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{outpass.reason}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Reason for Rejection</label>
                                    <Textarea placeholder="Please provide a reason..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={submitDecision}>Confirm Rejection</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
