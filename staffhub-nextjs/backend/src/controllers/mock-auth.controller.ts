// Mock LOGIN endpoint for testing without database
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';

export interface MockAuthRequest {
  email?: string;
  password?: string;
}

// Mock users database
const mockUsers = [
  {
    id: 'admin-1',
    email: 'farizisinanul@gmail.com',
    password: 'sfnk123#',
    fullName: 'Farizi Sinanul Admin',
    role: 'ADMIN',
    organizationId: 'org-1',
  },
  {
    id: 'student-1',
    email: 'student@example.com',
    password: 'password123',
    fullName: 'John Student',
    role: 'STUDENT',
    organizationId: 'org-1',
  },
  {
    id: 'staff-1',
    email: 'staff@example.com',
    password: 'password123',
    fullName: 'Dr. Jane Staff',
    role: 'STAFF',
    organizationId: 'org-1',
  },
];

const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRE as string) || '7d',
  } as any);
};

export const mockLogin = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user in mock database
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const mockGetUsers = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      Math.max(1, parseInt(limit as string, 10) || 10),
      100
    );

    // Mock users list for pagination demo
    const allUsers = [
      ...mockUsers,
      {
        id: 'user-2',
        email: 'test1@example.com',
        password: '',
        fullName: 'Test User 1',
        role: 'STUDENT',
        organizationId: 'org-1',
      },
      {
        id: 'user-3',
        email: 'test2@example.com',
        password: '',
        fullName: 'Test User 2',
        role: 'STUDENT',
        organizationId: 'org-1',
      },
      {
        id: 'user-4',
        email: 'test3@example.com',
        password: '',
        fullName: 'Test User 3',
        role: 'STAFF',
        organizationId: 'org-1',
      },
      {
        id: 'user-5',
        email: 'test4@example.com',
        password: '',
        fullName: 'Test User 4',
        role: 'STUDENT',
        organizationId: 'org-1',
      },
      {
        id: 'user-6',
        email: 'test5@example.com',
        password: '',
        fullName: 'Test User 5',
        role: 'SECURITY',
        organizationId: 'org-1',
      },
    ];

    const total = allUsers.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedUsers = allUsers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: paginatedUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: true,
        createdAt: new Date(),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const mockGetOutpasses = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      Math.max(1, parseInt(limit as string, 10) || 10),
      100
    );

    const mockOutpasses = [
      {
        id: '1',
        reason: 'Home leave',
        destination: 'Home',
        status: 'APPROVED',
        studentId: 'student-1',
        createdAt: new Date(),
      },
      {
        id: '2',
        reason: 'Medical appointment',
        destination: 'Hospital',
        status: 'PENDING',
        studentId: 'student-1',
        createdAt: new Date(),
      },
      {
        id: '3',
        reason: 'Family emergency',
        destination: 'City Center',
        status: 'REJECTED',
        studentId: 'student-1',
        createdAt: new Date(),
      },
      {
        id: '4',
        reason: 'Project work',
        destination: 'Office',
        status: 'APPROVED',
        studentId: 'student-1',
        createdAt: new Date(),
      },
      {
        id: '5',
        reason: 'Interview',
        destination: 'Company HQ',
        status: 'PENDING',
        studentId: 'student-1',
        createdAt: new Date(),
      },
    ];

    let filtered = mockOutpasses;
    if (status) {
      filtered = mockOutpasses.filter(
        (o) => o.status === (status as string).toUpperCase()
      );
    }

    const total = filtered.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedData = filtered.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
