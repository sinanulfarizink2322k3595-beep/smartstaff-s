// API Response Types
export interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  settings?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "STUDENT" | "SECURITY";
  department?: string;
  avatar?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Outpass Types
export interface Outpass {
  id: string;
  studentId: string;
  studentName?: string;
  department?: string;
  reason: string;
  fromDate: string | Date;
  toDate: string | Date;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  approvedBy?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Meeting Types
export interface MeetingRequest {
  id: string;
  studentId: string;
  staffId?: string;
  studentName?: string;
  staffName?: string;
  purpose?: string;
  topic?: string;
  requestedDate: Date | string;
  requestedTime?: string;
  preferredTime?: string;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "PENDING" | "APPROVED" | "REJECTED";
  roomId?: string;
  remarks?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Staff Availability Types
export interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
}

export interface DayAvailability {
  day: string;
  isAvailable: boolean;
  slots: TimeSlot[];
}

export interface StaffAvailabilityData {
  staffId: string;
  staffName: string;
  availability: DayAvailability[];
  totalHours: number;
  daysAvailable: number;
  approvedOutpasses?: number;
  upcomingMeetings?: number;
}

// Feedback Types
export interface Feedback {
  id: string;
  studentId: string;
  rating: number;
  comment?: string;
  category?: string;
  createdAt?: Date;
}

// Analytics Types
export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalOutpasses: number;
  pendingOutpasses: number;
  approvedOutpasses: number;
  totalMeetings: number;
  pendingMeetings: number;
  approvedMeetings: number;
  completedMeetings: number;
  totalFeedback: number;
  avgFeedbackRating: string;
}
