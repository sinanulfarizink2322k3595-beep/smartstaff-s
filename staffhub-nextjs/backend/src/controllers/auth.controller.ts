import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

type MockOrganization = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

// Mock users for development
const mockUsers = [
  {
    id: 'admin-1',
    email: 'farizisinanul@gmail.com',
    password: 'sfnk123#',
    fullName: 'Farizi Sinanul',
    role: 'ADMIN',
    organizationId: 'org-1',
  },
];

const mockOrganizations: MockOrganization[] = [
  {
    id: 'org-1',
    name: 'SmartStaff Demo',
    slug: 'smartstaff-demo',
    isActive: true,
  },
  {
    id: 'org-2',
    name: 'Nilgiri College',
    slug: 'nilgiri-college',
    isActive: true,
  },
];

const normalizeOrganizationCode = (value: string): string => value.trim().toLowerCase();

const isDatabaseUnavailableError = (error: any): boolean => {
  const errorName = error?.name || '';
  const errorMessage = String(error?.message || '').toLowerCase();

  return (
    errorName.includes('PrismaClientInitializationError') ||
    errorName.includes('PrismaClientKnownRequestError') ||
    errorMessage.includes('authentication failed against database server') ||
    errorMessage.includes('can\'t reach database server') ||
    errorMessage.includes('database credentials') ||
    errorMessage.includes('connection refused')
  );
};

// Helper function to generate JWT token
const generateToken = (payload: any): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRE as string) || '7d'
  } as any);
};

// Register new organization and admin user
export const register = async (req: any, res: Response, next: NextFunction) => {
  try {
    const {
      organizationName,
      organizationSlug,
      email,
      password,
      fullName
    } = req.body;

    const normalizedOrgSlug = normalizeOrganizationCode(organizationSlug || '');
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate required fields
    if (!organizationName || !normalizedOrgSlug || !normalizedEmail || !password || !fullName) {
      throw new AppError('All fields are required', 400);
    }

    let result: {
      organization: { id: string; name: string; slug: string };
      user: { id: string; email: string; fullName: string; role: string };
    };

    try {
      // Check if organization slug already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: normalizedOrgSlug }
      });

      if (existingOrg) {
        throw new AppError('Organization slug already taken', 400);
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create organization and admin user in a transaction
      const dbResult = await prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug: normalizedOrgSlug
          }
        });

        // Create admin user
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            fullName,
            role: 'ADMIN',
            organizationId: organization.id
          }
        });

        return { organization, user };
      });

      result = {
        organization: {
          id: dbResult.organization.id,
          name: dbResult.organization.name,
          slug: dbResult.organization.slug,
        },
        user: {
          id: dbResult.user.id,
          email: dbResult.user.email,
          fullName: dbResult.user.fullName,
          role: dbResult.user.role,
        },
      };
    } catch (dbError: any) {
      if (dbError instanceof AppError) {
        throw dbError;
      }

      if (!isDatabaseUnavailableError(dbError)) {
        throw dbError;
      }

      console.log('[DEV MODE] Using mock registration (database unavailable)');

      const existingMockOrg = mockOrganizations.find((org) => org.slug === normalizedOrgSlug);
      if (existingMockOrg) {
        throw new AppError('Organization slug already taken', 400);
      }

      const existingMockUser = mockUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
      if (existingMockUser) {
        throw new AppError('Email already registered', 400);
      }

      const mockOrganization = {
        id: `org-${Date.now()}`,
        name: organizationName,
        slug: normalizedOrgSlug,
        isActive: true,
      };
      mockOrganizations.push(mockOrganization);

      const mockUser = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        password,
        fullName,
        role: 'ADMIN',
        organizationId: mockOrganization.id,
      };
      mockUsers.push(mockUser);

      result = {
        organization: {
          id: mockOrganization.id,
          name: mockOrganization.name,
          slug: mockOrganization.slug,
        },
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
        },
      };
    }

    // Generate JWT token
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organizationId: result.organization.id
    });

    res.status(201).json({
      message: 'Organization registered successfully',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      }
    });
  } catch (error) {
    next(error);
  }
};

// Sign up user to existing organization
export const signup = async (req: any, res: Response, next: NextFunction) => {
  try {
    const {
      organizationCode,
      email,
      password,
      fullName,
      role,
      department,
      rollNumber,
      phone
    } = req.body;

    const normalizedOrganizationCode = normalizeOrganizationCode(organizationCode || '');
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate required fields
    if (!normalizedOrganizationCode || !normalizedEmail || !password || !fullName || !role) {
      throw new AppError('Organization code, email, password, full name, and role are required', 400);
    }

    // Validate role
    const validRoles = ['STUDENT', 'STAFF', 'SECURITY'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role. Must be STUDENT, STAFF, or SECURITY', 400);
    }

    let organization: { id: string; name: string; slug: string; isActive?: boolean };
    let user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      department: string | null;
      rollNumber: string | null;
      phone?: string | null;
      organizationId: string;
    };

    let useMockMode = false;

    try {
      // Find organization by slug (code)
      const dbOrganization = await prisma.organization.findUnique({
        where: { slug: normalizedOrganizationCode }
      }).catch((dbError) => {
        // If database connection fails, trigger mock mode
        if (isDatabaseUnavailableError(dbError)) {
          useMockMode = true;
          return null;
        }
        throw dbError;
      });

      if (useMockMode) {
        throw new Error('DATABASE_UNAVAILABLE');
      }

      if (!dbOrganization || !dbOrganization.isActive) {
        throw new AppError('Invalid organization code', 404);
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }

      // Validate role-specific fields
      if (role === 'STUDENT' && !rollNumber) {
        throw new AppError('Roll number is required for students', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const dbUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          fullName,
          role,
          department: department || null,
          rollNumber: rollNumber || null,
          phone: phone || null,
          organizationId: dbOrganization.id
        }
      });

      organization = {
        id: dbOrganization.id,
        name: dbOrganization.name,
        slug: dbOrganization.slug,
        isActive: dbOrganization.isActive,
      };

      user = {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        role: dbUser.role,
        department: dbUser.department,
        rollNumber: dbUser.rollNumber,
        phone: dbUser.phone,
        organizationId: dbOrganization.id,
      };
    } catch (dbError: any) {
      if (dbError instanceof AppError) {
        throw dbError;
      }

      if (!isDatabaseUnavailableError(dbError) && dbError.message !== 'DATABASE_UNAVAILABLE') {
        throw dbError;
      }

      console.log('[DEV MODE] Using mock signup (database unavailable)');

      const mockOrganization = mockOrganizations.find((org) => org.slug === normalizedOrganizationCode && org.isActive);
      if (!mockOrganization) {
        throw new AppError('Invalid organization code', 404);
      }

      const existingMockUser = mockUsers.find((existing) => existing.email.toLowerCase() === normalizedEmail);
      if (existingMockUser) {
        throw new AppError('Email already registered', 400);
      }

      if (role === 'STUDENT' && !rollNumber) {
        throw new AppError('Roll number is required for students', 400);
      }

      const mockUser = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        password,
        fullName,
        role,
        department: department || null,
        rollNumber: rollNumber || null,
        phone: phone || null,
        organizationId: mockOrganization.id,
      };

      mockUsers.push(mockUser as any);

      organization = mockOrganization;
      user = {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        department: mockUser.department,
        rollNumber: mockUser.rollNumber,
        phone: mockUser.phone,
        organizationId: mockUser.organizationId,
      };
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: organization.id
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    try {
      // Try to authenticate with real database
      // Find user with organization
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          rollNumber: user.rollNumber
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug
        }
      });
    } catch (dbError) {
      // Fallback to mock authentication (for development)
      console.log('[DEV MODE] Using mock authentication (database unavailable)');

      const mockUser = mockUsers.find(
        (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase() && u.password === password
      );

      if (!mockUser) {
        throw new AppError('Invalid credentials', 401);
      }

      const token = generateToken({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        organizationId: mockUser.organizationId
      });

      const mockOrganization = mockOrganizations.find((org) => org.id === mockUser.organizationId);

      res.json({
        message: 'Login successful (mock mode)',
        token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role
        },
        organization: mockOrganization
          ? {
            id: mockOrganization.id,
            name: mockOrganization.name,
            slug: mockOrganization.slug,
          }
          : undefined,
        isDevelopmentMode: true
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify token
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({
      valid: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        rollNumber: true,
        phone: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
