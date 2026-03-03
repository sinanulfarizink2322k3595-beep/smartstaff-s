# SMARTSTAFF NILGIRI - COMPLETE CODE DUMP FOR DEBUGGING

## INDEX
1. [Database Schema](#database-schema)
2. [Backend Server Setup](#backend-server-setup)
3. [Backend Middleware](#backend-middleware)
4. [Backend Controllers](#backend-controllers)
5. [Backend Routes](#backend-routes)
6. [Backend Services](#backend-services)
7. [Frontend Auth](#frontend-auth)
8. [Frontend API Client](#frontend-api-client)
9. [Frontend Login Page](#frontend-login-page)
10. [Configuration Files](#configuration-files)

---

## DATABASE SCHEMA

### File: `staffhub-nextjs/backend/prisma/schema.prisma`

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  ADMIN
  STAFF
  STUDENT
  SECURITY
}

enum OutpassStatus {
  PENDING
  APPROVED
  REJECTED
}

enum GateStatus {
  ON_CAMPUS
  LEFT
  RETURNED
}

enum MeetingStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}

// Multi-tenant: Organizations
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  domain    String?  @unique
  logo      String?
  settings  Json?    // Organization-specific settings
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users            User[]
  staff            StaffMember[]
  outpassRequests  OutpassRequest[]
  meetingRequests  MeetingRequest[]
  feedback         Feedback[]
  departments      Department[]
  customRoles      CustomRole[]

  @@map("organizations")
}

// Users table
model User {
  id             String       @id @default(uuid())
  email          String       @unique
  password       String
  fullName       String
  role           UserRole     @default(STUDENT)
  phone          String?
  department     String?
  rollNumber     String?      // For students
  isActive       Boolean      @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Department link
  departmentId   String?
  departmentObj  Department?  @relation(fields: [departmentId], references: [id], onDelete: SetNull)

  // Relations
  outpassRequests  OutpassRequest[]
  meetingRequests  MeetingRequest[]
  staffMember      StaffMember?
  feedback         Feedback[]

  @@unique([email, organizationId])
  @@index([organizationId, role])
  @@index([departmentId])
  @@map("users")
}

// Staff members (extended from User)
model StaffMember {
  id          String   @id @default(uuid())
  name        String
  title       String
  email       String?
  department  String   @default("Computer Science")
  isHod       Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Link to User
  userId     String?       @unique
  user       User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Relations
  availability      StaffAvailability[]
  meetingRequests   MeetingRequest[]
  approvedOutpasses OutpassRequest[]

  @@index([organizationId])
  @@map("staff_members")
}

// Staff availability schedules
model StaffAvailability {
  id          String   @id @default(uuid())
  dayOfWeek   Int      // 0-6 (Sunday-Saturday)
  startTime   String   // HH:mm format
  endTime     String   // HH:mm format
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())

  staffId      String
  staff        StaffMember @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId, dayOfWeek])
  @@map("staff_availability")
}

// Outpass requests
model OutpassRequest {
  id                   String        @id @default(uuid())
  reason               String
  destination          String
  departureTime        DateTime
  returnTime           DateTime
  status               OutpassStatus @default(PENDING)
  hodRemarks           String?
  gateStatus           GateStatus    @default(ON_CAMPUS)
  gateVerifiedAt       DateTime?
  requestedBySecurity  Boolean       @default(false)
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  // Student who requested
  studentId    String
  student      User         @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Staff who approved
  approvedById String?
  approvedBy   StaffMember? @relation(fields: [approvedById], references: [id], onDelete: SetNull)

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, status])
  @@index([studentId])
  @@map("outpass_requests")
}

// Meeting requests
model MeetingRequest {
  id            String        @id @default(uuid())
  purpose       String
  meetingType   String
  requestedTime DateTime
  status        MeetingStatus @default(PENDING)
  staffRemarks  String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Student who requested
  studentId String
  student   User   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Staff member
  staffId String
  staff   StaffMember @relation(fields: [staffId], references: [id], onDelete: Cascade)

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, status])
  @@index([studentId])
  @@index([staffId])
  @@map("meeting_requests")
}

// Feedback
model Feedback {
  id          String   @id @default(uuid())
  message     String
  rating      Int?     // 1-5
  category    String   @default("general")
  isAnonymous Boolean  @default(false)
  createdAt   DateTime @default(now())

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@map("feedback")
}

// FAQ
model FAQ {
  id           String   @id @default(uuid())
  question     String
  answer       String
  category     String   @default("general")
  displayOrder Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("faq")
}

// AI-Generated Organization Structure Models

// Departments with hierarchy support
model Department {
  id          String   @id @default(uuid())
  name        String
  description String?
  level       Int      @default(0)
  color       String?
  icon        String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Hierarchy
  parentId       String?
  parent         Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children       Department[] @relation("DepartmentHierarchy")

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Relations
  users          User[]
  customRoles    CustomRole[]

  @@index([organizationId])
  @@index([parentId])
  @@map("departments")
}

// Custom roles beyond the basic enum
model CustomRole {
  id          String   @id @default(uuid())
  name        String
  description String?
  level       Int      @default(0)
  color       String?
  icon        String?
  isActive    Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Department link
  departmentId   String?
  department     Department?  @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  // Relations
  permissions    Permission[]

  @@index([organizationId])
  @@index([departmentId])
  @@map("custom_roles")
}

// Permissions for custom roles
model Permission {
  id          String   @id @default(uuid())
  resource    String
  action      String
  conditions  Json?
  createdAt   DateTime @default(now())

  // Role link
  roleId      String
  role        CustomRole @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, resource, action])
  @@index([roleId])
  @@map("permissions")
}
```

---

## BACKEND SERVER SETUP

### File: `staffhub-nextjs/backend/src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import outpassRoutes from './routes/outpass.routes';
import meetingRoutes from './routes/meeting.routes';
import staffRoutes from './routes/staff.routes';
import feedbackRoutes from './routes/feedback.routes';
import orgbuilderRoutes from './routes/orgbuilder.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/outpass', outpassRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/orgbuilder', orgbuilderRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export default app;
```

---

## BACKEND MIDDLEWARE

### File: `staffhub-nextjs/backend/src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Middleware to ensure user belongs to the same organization
export const checkOrganization = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const organizationId = req.params.organizationId || req.body.organizationId;

  if (organizationId && req.user?.organizationId !== organizationId) {
    return next(new AppError('Access denied to this organization', 403));
  }

  next();
};
```

### File: `staffhub-nextjs/backend/src/middleware/error.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.errors
    })
  });
};

export class AppError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

---

## BACKEND CONTROLLERS

### File: `staffhub-nextjs/backend/src/controllers/auth.controller.ts`

```typescript
import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

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

    // Validate required fields
    if (!organizationName || !organizationSlug || !email || !password || !fullName) {
      throw new AppError('All fields are required', 400);
    }

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: organizationSlug }
    });

    if (existingOrg) {
      throw new AppError('Organization slug already taken', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug
        }
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: 'ADMIN',
          organizationId: organization.id
        }
      });

      return { organization, user };
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.organization.id
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

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

// Login user
export const login = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

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
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

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
      include: { organization: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        rollNumber: true,
        createdAt: true
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
```

### File: `staffhub-nextjs/backend/src/controllers/outpass.controller.ts`

```typescript
import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Create outpass request
export const createOutpass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reason, destination, departureTime, returnTime, studentId } = req.body;
    const user = req.user!;

    // Validate required fields
    if (!reason || !destination || !departureTime || !returnTime) {
      throw new AppError('All fields are required', 400);
    }

    // Determine student ID (if security is creating on behalf of student)
    const actualStudentId = user.role === 'SECURITY' ? studentId : user.id;

    if (user.role === 'SECURITY' && !studentId) {
      throw new AppError('Student ID required for emergency requests', 400);
    }

    // Verify student belongs to same organization
    if (user.role === 'SECURITY') {
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          organizationId: user.organizationId
        }
      });

      if (!student) {
        throw new AppError('Student not found in your organization', 404);
      }
    }

    // Create outpass request
    const outpass = await prisma.outpassRequest.create({
      data: {
        reason,
        destination,
        departureTime: new Date(departureTime),
        returnTime: new Date(returnTime),
        studentId: actualStudentId,
        organizationId: user.organizationId,
        requestedBySecurity: user.role === 'SECURITY'
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            rollNumber: true,
            department: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Outpass request created successfully',
      outpass
    });
  } catch (error) {
    next(error);
  }
};

// Get outpass requests (with filtering based on role)
export const getOutpasses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { status, requestedBySecurity } = req.query;

    let whereClause: any = {
      organizationId: user.organizationId
    };

    // Filter based on role
    if (user.role === 'STUDENT') {
      whereClause.studentId = user.id;
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter emergency requests
    if (requestedBySecurity !== undefined) {
      whereClause.requestedBySecurity = requestedBySecurity === 'true';
    }

    const outpasses = await prisma.outpassRequest.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            rollNumber: true,
            department: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ outpasses });
  } catch (error) {
    next(error);
  }
};

// Get outpass by ID
export const getOutpassById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const outpass = await prisma.outpassRequest.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        student: true,
        approvedBy: true
      }
    });

    if (!outpass) {
      throw new AppError('Outpass not found', 404);
    }

    res.json({ outpass });
  } catch (error) {
    next(error);
  }
};

// Update outpass status (approve/reject)
export const updateOutpassStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, hodRemarks } = req.body;
    const user = req.user!;

    // Validate status
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    // Find staff member
    const staffMember = await prisma.staffMember.findUnique({
      where: { userId: user.id }
    });

    if (!staffMember) {
      throw new AppError('Only staff can approve outpasses', 403);
    }

    const outpass = await prisma.outpassRequest.update({
      where: { id },
      data: {
        status,
        hodRemarks,
        approvedById: status === 'APPROVED' ? staffMember.id : null,
        updatedAt: new Date()
      },
      include: {
        student: true,
        approvedBy: true
      }
    });

    res.json({
      message: `Outpass ${status.toLowerCase()} successfully`,
      outpass
    });
  } catch (error) {
    next(error);
  }
};
```

### File: `staffhub-nextjs/backend/src/controllers/orgbuilder.controller.ts`

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiService, GeneratedDepartment, OrganizationStructure } from '../services/ai.service';

const prisma = new PrismaClient();

// Generate organization structure using AI
export const generateStructure = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const user = (req as any).user;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Try AI generation first, fallback to manual if it fails
    let structure: OrganizationStructure;
    try {
      structure = await aiService.generateOrganizationStructure(prompt);
    } catch (aiError: any) {
      console.warn('AI generation failed, using fallback:', aiError.message);
      // Use fallback structure
      structure = aiService.generateFallbackStructure(prompt);
    }

    res.json({
      success: true,
      structure,
      usedAI: true,
    });
  } catch (error: any) {
    console.error('Generate structure error:', error);
    res.status(500).json({ error: 'Failed to generate structure', details: error.message });
  }
};

// Apply generated structure to database
export const applyStructure = async (req: Request, res: Response) => {
  try {
    const { structure } = req.body;
    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!structure || !structure.departments || !structure.roles) {
      return res.status(400).json({ error: 'Invalid structure data' });
    }

    // Use transaction to ensure all or nothing
    const result = await prisma.$transaction(async (tx) => {
      // Create departments recursively
      const departmentMap = new Map<string, string>();

      const createDepartments = async (
        departments: GeneratedDepartment[],
        parentId: string | null = null,
        level: number = 0
      ) => {
        for (const dept of departments) {
          const created = await tx.department.create({
            data: {
              name: dept.name,
              description: dept.description || '',
              level,
              color: dept.color,
              icon: dept.icon,
              parentId,
              organizationId,
            },
          });

          departmentMap.set(dept.name, created.id);

          // Recursively create children
          if (dept.children && dept.children.length > 0) {
            await createDepartments(dept.children, created.id, level + 1);
          }
        }
      };

      await createDepartments(structure.departments);

      // Create custom roles
      const roleIds: string[] = [];
      for (const role of structure.roles) {
        const departmentId = role.departmentName
          ? departmentMap.get(role.departmentName)
          : undefined;

        const createdRole = await tx.customRole.create({
          data: {
            name: role.name,
            description: role.description || '',
            level: role.level,
            departmentId,
            organizationId,
          },
        });

        roleIds.push(createdRole.id);

        // Create permissions for this role
        if (role.permissions && role.permissions.length > 0) {
          await Promise.all(
            role.permissions.map((perm) =>
              tx.permission.create({
                data: {
                  resource: perm.resource,
                  action: perm.action,
                  roleId: createdRole.id,
                },
              })
            )
          );
        }
      }

      return {
        departmentsCreated: departmentMap.size,
        rolesCreated: roleIds.length,
      };
    });

    res.json({
      success: true,
      message: 'Organization structure applied successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Apply structure error:', error);
    res.status(500).json({ error: 'Failed to apply structure', details: error.message });
  }
};

// Get current organization structure
export const getStructure = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Get all departments with hierarchy
    const departments = await prisma.department.findMany({
      where: { organizationId },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      include: {
        children: true,
        customRoles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    res.json({
      success: true,
      departments,
    });
  } catch (error: any) {
    console.error('Get structure error:', error);
    res.status(500).json({ error: 'Failed to fetch structure', details: error.message });
  }
};
```

---

## BACKEND ROUTES

### File: `staffhub-nextjs/backend/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { register, login, verifyToken, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', authenticate, verifyToken);
router.get('/me', authenticate, getCurrentUser);

export default router;
```

---

## BACKEND SERVICES

### File: `staffhub-nextjs/backend/src/services/ai.service.ts` (Excerpt)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedDepartment {
  name: string;
  description: string;
  level: number;
  color?: string;
  icon?: string;
  children?: GeneratedDepartment[];
}

export interface GeneratedRole {
  name: string;
  description: string;
  level: number;
  departmentName?: string;
  permissions: {
    resource: string;
    action: string;
  }[];
}

export interface OrganizationStructure {
  organizationName: string;
  description: string;
  departments: GeneratedDepartment[];
  roles: GeneratedRole[];
}

const SYSTEM_PROMPT = `You are an expert organization structure designer. When given a prompt describing an organization type, generate a comprehensive organizational structure including:

1. Departments (with hierarchy)
2. Roles within those departments
3. Permissions for each role

Return ONLY valid JSON with this exact structure:
{
  "organizationName": "string",
  "description": "string",
  "departments": [
    {
      "name": "string",
      "description": "string",
      "level": 0,
      "color": "#hexcolor",
      "icon": "icon-name",
      "children": [/* nested departments */]
    }
  ],
  "roles": [
    {
      "name": "string",
      "description": "string",
      "level": 1-10,
      "departmentName": "string",
      "permissions": [
        { "resource": "outpass|meeting|user|department", "action": "create|read|update|delete|approve" }
      ]
    }
  ]
}

Guidelines:
- Use common department structures for the organization type
- Higher level numbers = more authority (10 = CEO level, 1 = entry level)
- Include 3-8 departments with 1-2 levels of nesting
- Include 4-12 roles with appropriate permissions
- Use realistic department names and descriptions
- Colors should be hex format (#RRGGBB)
- Icons can be: users, building, shield, briefcase, chart, cog, heart, etc.`;

export class AIService {
  async generateOrganizationStructure(prompt: string): Promise<OrganizationStructure> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Generate an organization structure for: ${prompt}` 
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const structure = JSON.parse(content) as OrganizationStructure;
      return structure;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  generateFallbackStructure(prompt: string): OrganizationStructure {
    // Return a default structure if AI fails
    return {
      organizationName: 'Sample Organization',
      description: 'Fallback structure created',
      departments: [
        {
          name: 'Administration',
          description: 'Central administration',
          level: 0,
          color: '#3b82f6',
          icon: 'building'
        },
        {
          name: 'Operations',
          description: 'Daily operations',
          level: 0,
          color: '#10b981',
          icon: 'briefcase'
        }
      ],
      roles: [
        {
          name: 'Director',
          description: 'Department director',
          level: 9,
          departmentName: 'Administration',
          permissions: [
            { resource: 'outpass', action: 'approve' },
            { resource: 'meeting', action: 'approve' },
            { resource: 'user', action: 'create' }
          ]
        }
      ]
    };
  }
}

export const aiService = new AIService();
```

---

## FRONTEND AUTH

### File: `staffhub-nextjs/frontend/src/lib/auth.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "STUDENT" | "SECURITY";
  organizationId: string;
  createdAt: string;
}

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const setUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasRole = (role: User["role"]): boolean => {
  const user = getUser();
  return user?.role === role;
};

export const hasAnyRole = (roles: User["role"][]): boolean => {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
};
```

---

## FRONTEND API CLIENT

### File: `staffhub-nextjs/frontend/src/lib/api.ts`

```typescript
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { organizationName: string; email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  getCurrentUser: () => api.get("/auth/me"),
  verifyToken: () => api.get("/auth/verify"),
};

// User API
export const userApi = {
  getAll: () => api.get("/users"),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Organization API
export const organizationApi = {
  get: () => api.get("/organizations"),
  update: (data: any) => api.put("/organizations", data),
};

// Outpass API
export const outpassApi = {
  create: (data: any) => api.post("/outpass", data),
  getAll: (params?: any) => api.get("/outpass", { params }),
  getById: (id: string) => api.get(`/outpass/${id}`),
  updateStatus: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.put(`/outpass/${id}/status`, data),
  updateGateStatus: (id: string, data: { gateStatus: string }) =>
    api.put(`/outpass/${id}/gate-status`, data),
};

// Meeting API
export const meetingApi = {
  create: (data: any) => api.post("/meetings", data),
  getAll: (params?: any) => api.get("/meetings", { params }),
  getById: (id: string) => api.get(`/meetings/${id}`),
  update: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  updateStatus: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.put(`/meetings/${id}/status`, data),
  delete: (id: string) => api.delete(`/meetings/${id}`),
};

// Staff API
export const staffApi = {
  getAll: () => api.get("/staff"),
  getById: (id: string) => api.get(`/staff/${id}`),
  getAvailability: (id: string) => api.get(`/staff/${id}/availability`),
  updateAvailability: (id: string, data: any) => api.put(`/staff/${id}/availability`, data),
  getMyAvailability: () => api.get("/staff/me/availability"),
  updateMyAvailability: (data: any) => api.put("/staff/me/availability", data),
};

// Feedback API
export const feedbackApi = {
  create: (data: any) => api.post("/feedback", data),
  getAll: () => api.get("/feedback"),
  updateStatus: (id: string, data: { status: string; response?: string }) =>
    api.put(`/feedback/${id}`, data),
};

// Organization Builder API
export const orgbuilderApi = {
  generate: (prompt: string) => api.post("/orgbuilder/generate", { prompt }),
  apply: (structure: any) => api.post("/orgbuilder/apply", { structure }),
  getStructure: () => api.get("/orgbuilder/structure"),
};
```

---

## FRONTEND LOGIN PAGE

### File: `staffhub-nextjs/frontend/src/app/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      const { token, user } = response.data;

      setToken(token);
      setUser(user);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });

      // Redirect based on role
      const dashboardMap = {
        ADMIN: "/dashboard/admin",
        STAFF: "/dashboard/staff",
        STUDENT: "/dashboard/student",
        SECURITY: "/dashboard/security",
      };

      router.push(dashboardMap[user.role as keyof typeof dashboardMap]);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">StaffHub</span>
          </Link>
          <div>
            <CardTitle className="text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an organization?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

---

## CONFIGURATION FILES

### File: `package.json` (Root)

```json
{
  "name": "smartstaff-nilgiri",
  "private": true,
  "version": "2.0.0",
  "description": "SmartStaff Nilgiri - Multi-tenant Campus Management Platform with AI",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" --names \"API,UI\" --prefix-colors \"blue,green\"",
    "dev:frontend": "cd staffhub-nextjs/frontend && npm run dev",
    "dev:backend": "cd staffhub-nextjs/backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd staffhub-nextjs/frontend && npm run build",
    "build:backend": "cd staffhub-nextjs/backend && npm run build",
    "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\" --names \"API,UI\" --prefix-colors \"blue,green\"",
    "start:frontend": "cd staffhub-nextjs/frontend && npm run start",
    "start:backend": "cd staffhub-nextjs/backend && npm run start",
    "db:migrate": "cd staffhub-nextjs/backend && npx prisma migrate dev",
    "db:seed": "cd staffhub-nextjs/backend && npm run db:seed",
    "db:test": "cd staffhub-nextjs/backend && npm run db:test",
    "db:health": "cd staffhub-nextjs/backend && npm run db:health",
    "db:reset": "cd staffhub-nextjs/backend && npm run db:reset",
    "db:quick": "cd staffhub-nextjs/backend && npm run db:quick",
    "db:perf": "cd staffhub-nextjs/backend && npm run db:perf",
    "db:test:ai": "cd staffhub-nextjs/backend && npm run db:test:ai",
    "supabase:reset-users": "node src/scripts/reset-supabase-users.js",
    "supabase:recreate-admin": "node src/scripts/recreate-admin.js",
    "lint": "npm run lint --workspaces",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rimraf node_modules staffhub-nextjs/frontend/node_modules staffhub-nextjs/backend/node_modules staffhub-nextjs/frontend/.next staffhub-nextjs/backend/dist",
    "install:all": "npm install && cd staffhub-nextjs/frontend && npm install && cd ../backend && npm install",
    "type-check": "tsc --noEmit"
  }
}
```

### File: `.env` (Root)

```dotenv
VITE_SUPABASE_PROJECT_ID="hocuqeqmhjqloznddrbo"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvY3VxZXFtaGpxbG96bmRkcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEwOTIsImV4cCI6MjA4NTY3NzA5Mn0.bU6w4i7FPEm-U2AgntCpLJDNSBcUtKGomHtHi-VTE2E"
VITE_SUPABASE_URL="https://hocuqeqmhjqloznddrbo.supabase.co"
```

---

## QUICK REFERENCE - COMMON FIXES

### Issue: "Invalid token" on login
**Solution**: Check JWT_SECRET environment variable is set in backend `.env`

### Issue: CORS errors
**Solution**: Update FRONTEND_URL in backend `.env` to match your frontend URL

### Issue: Database connection failed
**Solution**: Update DATABASE_URL in backend `.env` with proper PostgreSQL connection string

### Issue: API not responding
**Solution**: 
1. Verify backend is running on port 5000
2. Check NEXT_PUBLIC_API_URL in frontend `.env.local`
3. Run: `npm run dev:backend` from staffhub-nextjs/backend/

---

## DEBUGGING STEPS

1. **Check Terminal Logs**:
   ```bash
   # Backend logs show request handling
   # Frontend logs show component errors
   ```

2. **Verify API Connection**:
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check Admin User**:
   - Email: farizisinanul@gmail.com
   - Password: sfnk123#

4. **Database Issues**:
   - Use Supabase dashboard to verify data
   - Check Prisma migrations: `npx prisma migrate status`

5. **Frontend Not Loading**:
   - Frontend running on: http://localhost:3004
   - Check for 404 errors in browser console

---

**Last Updated**: February 28, 2026
**Version**: 2.0.0
**Status**: Frontend running, backend ready to start
