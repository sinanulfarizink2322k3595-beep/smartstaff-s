'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { Calendar, Clock, Check, X, Users } from 'lucide-react';

interface MeetingSlot {
  id: string;
  day: string;
  time: string;
  duration: number;
  capacity: number;
  bookedCount: number;
}

interface MeetingRequest {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  topic: string;
  requestedDate: Date;
  preferredTime: string;
  status: 'REQUESTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

const mockAvailableSlots: MeetingSlot[] = [
  { id: 'S001', day: 'Monday', time: '10:00 AM', duration: 30, capacity: 2, bookedCount: 1 },
  { id: 'S002', day: 'Monday', time: '02:00 PM', duration: 30, capacity: 2, bookedCount: 0 },
  { id: 'S003', day: 'Wednesday', time: '10:00 AM', duration: 45, capacity: 1, bookedCount: 1 },
  { id: 'S004', day: 'Wednesday', time: '03:00 PM', duration: 30, capacity: 2, bookedCount: 0 },
  { id: 'S005', day: 'Friday', time: '11:00 AM', duration: 30, capacity: 2, bookedCount: 1 },
];

const mockMeetingRequests: MeetingRequest[] = [
  {
    id: 'MR001',
    studentId: 'STU001',
    studentName: 'Arun Kumar',
    department: 'Computer Science',
    topic: 'Academic guidance for project',
    requestedDate: new Date(Date.now() + 2 * 86400000),
    preferredTime: '10:00 AM',
    status: 'REQUESTED',
    createdAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: 'MR002',
    studentId: 'STU002',
    studentName: 'Divya Sharma',
    department: 'Electronics',
    topic: 'Internship opportunity discussion',
    requestedDate: new Date(Date.now() + 86400000),
    preferredTime: '02:00 PM',
    status: 'REQUESTED',
    createdAt: new Date(Date.now() - 1 * 3600000),
  },
  {
    id: 'MR003',
    studentId: 'STU003',
    studentName: 'Ravi Patel',
    department: 'Mechanical',
    topic: 'Career counseling',
    requestedDate: new Date(Date.now() + 5 * 86400000),
    preferredTime: '11:00 AM',
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 8 * 3600000),
  },
  {
    id: 'MR004',
    studentId: 'STU004',
    studentName: 'Pooja Singh',
    department: 'Civil',
    topic: 'Course recommendation',
    requestedDate: new Date(Date.now() - 5 * 86400000),
    preferredTime: '10:00 AM',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 48 * 3600000),
  },
];

export default function StaffMeetingsPage() {
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>(mockMeetingRequests);
  const [availableSlots] = useState<MeetingSlot[]>(mockAvailableSlots);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const filteredRequests = useMemo(() => {
    return meetingRequests.filter(req => {
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (searchTerm && !req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && !req.studentId.includes(searchTerm)) return false;
      return true;
    });
  }, [meetingRequests, statusFilter, searchTerm]);

  const stats = useMemo(() => ({
    requested: meetingRequests.filter(r => r.status === 'REQUESTED').length,
    scheduled: meetingRequests.filter(r => r.status === 'SCHEDULED').length,
    completed: meetingRequests.filter(r => r.status === 'COMPLETED').length,
    cancelled: meetingRequests.filter(r => r.status === 'CANCELLED').length,
  }), [meetingRequests]);

  const getStatusBadge = (status: string) => {
    const config = {
      REQUESTED: { bg: 'bg-blue-500/20', text: 'text-blue-700', label: 'Requested' },
      SCHEDULED: { bg: 'bg-green-500/20', text: 'text-green-700', label: 'Scheduled' },
      COMPLETED: { bg: 'bg-purple-500/20', text: 'text-purple-700', label: 'Completed' },
      CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-700', label: 'Cancelled' },
    };
    const style = config[status as keyof typeof config] || config.REQUESTED;
    return <span className={`${style.bg} ${style.text} px-2 py-1 rounded-full text-xs font-medium`}>{style.label}</span>;
  };

  const handleSchedule = (request: MeetingRequest) => {
    setSelectedRequest(request);
    setDialogMode('approve');
    setNotes('');
    setSelectedSlot('');
    setIsDialogOpen(true);
  };

  const handleReject = (request: MeetingRequest) => {
    setSelectedRequest(request);
    setDialogMode('reject');
    setNotes('');
    setIsDialogOpen(true);
  };

  const submitDecision = () => {
    if (!selectedRequest) return;
    const status = dialogMode === 'approve' ? 'SCHEDULED' : 'CANCELLED';
    setMeetingRequests(prev => prev.map(req => req.id === selectedRequest.id ? { ...req, status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' } : req));
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const availableSlotsInfo = useMemo(() => {
    return availableSlots.map(slot => `${slot.day} - ${slot.time} (${slot.capacity - slot.bookedCount} spots)`).join(', ');
  }, [availableSlots]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Meetings</h1>
        <p className="text-muted-foreground">Manage meeting requests and approvals.</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{stats.requested}</div>
            <p className="text-xs text-muted-foreground mt-1">Requested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground mt-1">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Available Meeting Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {availableSlots.map(slot => (
              <div key={slot.id} className="border rounded-lg p-3 hover:bg-muted">
                <p className="font-medium text-sm">{slot.day}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {slot.time}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{slot.duration} min</p>
                <p className="text-xs font-medium mt-2">
                  <Users className="w-3 h-3 inline mr-1" />
                  {slot.capacity - slot.bookedCount}/{slot.capacity} available
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="REQUESTED">Requested</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Topic</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Requested Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{request.studentName}</p>
                        <p className="text-xs text-muted-foreground">{request.studentId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{request.department}</td>
                    <td className="py-3 px-4 text-sm">{request.topic}</td>
                    <td className="py-3 px-4 text-sm">{format(request.requestedDate, 'MMM d, yyyy')}</td>
                    <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                    <td className="py-3 px-4">
                      {request.status === 'REQUESTED' && (
                        <div className="flex gap-2">
                          <Dialog open={isDialogOpen && selectedRequest?.id === request.id && dialogMode === 'approve'} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleSchedule(request)}>
                                <Check className="w-4 h-4 mr-1" /> Schedule
                              </Button>
                            </DialogTrigger>
                            {selectedRequest?.id === request.id && dialogMode === 'approve' && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Schedule Meeting</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium">{request.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{request.topic}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Select Slot</label>
                                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a time slot" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableSlots.filter(s => s.bookedCount < s.capacity).map(slot => (
                                          <SelectItem key={slot.id} value={slot.id}>
                                            {slot.day} {slot.time} ({slot.duration} min)
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Notes</label>
                                    <Textarea placeholder="Add meeting notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={submitDecision}>Confirm Schedule</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                          <Dialog open={isDialogOpen && selectedRequest?.id === request.id && dialogMode === 'reject'} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(request)}>
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </DialogTrigger>
                            {selectedRequest?.id === request.id && dialogMode === 'reject' && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Meeting Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium">{request.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{request.topic}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Reason for Rejection</label>
                                    <Textarea placeholder="Please provide a reason..." value={notes} onChange={(e) => setNotes(e.target.value)} />
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
