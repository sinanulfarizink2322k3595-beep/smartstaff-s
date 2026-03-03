import { Request, Response, NextFunction } from 'express';

// Mock Users
const mockUsers = [
  {
    id: 'admin-1',
    email: 'farizisinanul@gmail.com',
    fullName: 'Farizi Sinanul',
    role: 'ADMIN',
    department: 'Administration',
    organizationId: 'org-1',
    lastLoginAt: new Date()
  },
  {
    id: 'staff-1',
    email: 'staff@example.com',
    fullName: 'John Smith',
    role: 'STAFF',
    department: 'IT',
    organizationId: 'org-1',
    lastLoginAt: new Date()
  },
  {
    id: 'staff-2',
    email: 'teacher@example.com',
    fullName: 'Jane Doe',
    role: 'STAFF',
    department: 'Physics',
    organizationId: 'org-1',
    lastLoginAt: new Date()
  },
  {
    id: 'student-1',
    email: 'student@example.com',
    fullName: 'Alex Johnson',
    role: 'STUDENT',
    department: 'Computer Science',
    organizationId: 'org-1',
    rollNumber: '2024001',
    lastLoginAt: new Date()
  },
  {
    id: 'student-2',
    email: 'student2@example.com',
    fullName: 'Sarah Williams',
    role: 'STUDENT',
    department: 'Electronics',
    organizationId: 'org-1',
    rollNumber: '2024002',
    lastLoginAt: new Date()
  },
  {
    id: 'student-3',
    email: 'student3@example.com',
    fullName: 'Mike Brown',
    role: 'STUDENT',
    department: 'Mechanical',
    organizationId: 'org-1',
    rollNumber: '2024003',
    lastLoginAt: new Date()
  },
];

// Mock Outpasses
const mockOutpasses = [
  {
    id: 'outpass-1',
    studentId: 'student-1',
    student: mockUsers.find(u => u.id === 'student-1'),
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 172800000),
    reason: 'Home leave',
    status: 'APPROVED',
    approvedBy: 'admin-1',
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
  },
  {
    id: 'outpass-2',
    studentId: 'student-2',
    student: mockUsers.find(u => u.id === 'student-2'),
    startDate: new Date(Date.now() + 172800000), // 2 days from now
    endDate: new Date(Date.now() + 259200000), // 3 days from now
    reason: 'Medical appointment',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: 'outpass-3',
    studentId: 'student-1',
    student: mockUsers.find(u => u.id === 'student-1'),
    startDate: new Date(Date.now() - 518400000),
    endDate: new Date(Date.now() - 432000000),
    reason: 'Family event',
    status: 'APPROVED',
    approvedBy: 'staff-1',
    createdAt: new Date(Date.now() - 604800000), // 1 week ago
  },
  {
    id: 'outpass-4',
    studentId: 'student-3',
    student: mockUsers.find(u => u.id === 'student-3'),
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 172800000),
    reason: 'Interview',
    status: 'REJECTED',
    rejectionReason: 'Outside allowed dates',
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'outpass-5',
    studentId: 'student-2',
    student: mockUsers.find(u => u.id === 'student-2'),
    startDate: new Date(Date.now() - 86400000),
    endDate: new Date(Date.now()),
    reason: 'Emergency',
    status: 'APPROVED',
    approvedBy: 'admin-1',
    createdAt: new Date(Date.now() - 86400000),
  },
];

// Mock Meetings
const mockMeetings = [
  {
    id: 'meeting-1',
    title: 'Staff Meeting',
    description: 'Monthly staff sync meeting',
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 90000000),
    location: 'Conference Room A',
    organizerId: 'admin-1',
    attendees: ['staff-1', 'staff-2'],
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 259200000),
  },
  {
    id: 'meeting-2',
    title: 'Student Orientation',
    description: 'New student orientation program',
    startTime: new Date(Date.now() + 172800000),
    endTime: new Date(Date.now() + 180000000),
    location: 'Auditorium',
    organizerId: 'staff-1',
    attendees: ['student-1', 'student-2', 'student-3'],
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'meeting-3',
    title: 'Department Review',
    description: 'Q1 Department performance review',
    startTime: new Date(Date.now() - 86400000),
    endTime: new Date(Date.now() - 82800000),
    location: 'Board Room',
    organizerId: 'admin-1',
    attendees: ['staff-1', 'staff-2'],
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 604800000),
  },
];

// Pagination helper
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  pages: number;
}

function paginate<T>(items: T[], page: number = 1, limit: number = 10): { data: T[]; meta: PaginationMeta } {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  
  return {
    data: items.slice(startIndex, endIndex),
    meta: {
      page,
      limit,
      total,
      hasMore: endIndex < total,
      pages
    }
  };
}

// Get all users with pagination
export const getMockUsers = (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;

    let filteredUsers = mockUsers;
    if (role) {
      filteredUsers = mockUsers.filter(u => u.role === role.toUpperCase());
    }

    const result = paginate(filteredUsers, page, limit);
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.meta,
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile
export const getMockProfile = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const user = mockUsers[0]; // Return first user (admin)
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};

// Get all outpasses with pagination
export const getMockOutpasses = (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    let filteredOutpasses = mockOutpasses;
    if (status) {
      filteredOutpasses = mockOutpasses.filter(o => o.status === status.toUpperCase());
    }

    const result = paginate(filteredOutpasses, page, limit);
    
    res.json({
      success: true,
      message: 'Outpasses retrieved successfully',
      data: result.data,
      pagination: result.meta,
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};

// Get all meetings with pagination
export const getMockMeetings = (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    let filteredMeetings = mockMeetings;
    if (status) {
      filteredMeetings = mockMeetings.filter(m => m.status === status);
    }

    const result = paginate(filteredMeetings, page, limit);
    
    res.json({
      success: true,
      message: 'Meetings retrieved successfully',
      data: result.data,
      pagination: result.meta,
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};

// Get statistics/dashboard data
export const getMockStats = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOutpasses = mockOutpasses.filter(o => o.status === 'APPROVED').length;
    const pendingOutpasses = mockOutpasses.filter(o => o.status === 'PENDING').length;
    const totalUsers = mockUsers.length;
    const totalMeetings = mockMeetings.length;

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalUsers,
        totalMeetings,
        activeOutpasses,
        pendingOutpasses,
        approvalRate: ((mockOutpasses.filter(o => o.status === 'APPROVED').length / mockOutpasses.length) * 100).toFixed(1),
        upcomingMeetings: mockMeetings.filter(m => m.status === 'SCHEDULED').length,
        staffCount: mockUsers.filter(u => u.role === 'STAFF').length,
        studentCount: mockUsers.filter(u => u.role === 'STUDENT').length,
      },
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};

// Create mock outpass (just returns success for demo)
export const createMockOutpass = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, startDate, endDate, reason } = req.body;

    const newOutpass = {
      id: `outpass-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'PENDING',
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: 'Outpass created successfully (mock)',
      data: newOutpass,
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};

// Approve mock outpass
export const approveMockOutpass = (req: Request, res: Response, next: NextFunction): any => {
  try {
    const { id } = req.params;
    const outpass = mockOutpasses.find(o => o.id === id);

    if (!outpass) {
      return res.status(404).json({
        success: false,
        message: 'Outpass not found',
      });
    }

    outpass.status = 'APPROVED';
    outpass.approvedBy = 'admin-1';

    return res.json({
      success: true,
      message: 'Outpass approved successfully (mock)',
      data: outpass,
      isDevelopmentMode: true
    });
  } catch (error) {
    next(error);
  }
};
