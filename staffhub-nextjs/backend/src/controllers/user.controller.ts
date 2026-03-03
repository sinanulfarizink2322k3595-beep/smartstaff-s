import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  parsePaginationParams,
  formatPaginatedResponse,
} from '../utils/pagination.utils';

const prisma = new PrismaClient();
const allowedRoles = ['ADMIN', 'STAFF', 'STUDENT', 'SECURITY'] as const;

const parseRole = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  return allowedRoles.includes(normalized as any)
    ? (normalized as (typeof allowedRoles)[number])
    : undefined;
};

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role, search, page, limit } = req.query;

    const { skip, take, page: pageNum, limit: limitNum } =
      parsePaginationParams(
        page as string | number | undefined,
        limit as string | number | undefined
      );

    const whereClause: any = {
      organizationId: req.user!.organizationId,
    };

    const parsedRole = parseRole(role as string | undefined);
    if (parsedRole) {
      whereClause.role = parsedRole;
    }

    if (typeof search === 'string' && search.trim()) {
      const term = search.trim();
      whereClause.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { rollNumber: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.user.count({ where: whereClause });

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        department: true,
        rollNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    res.json(formatPaginatedResponse(users, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        department: true,
        rollNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      phone,
      department,
      rollNumber,
      isActive,
    } = req.body;

    const parsedRole = parseRole(role);

    if (!email || !password || !fullName || !parsedRole) {
      throw new AppError('email, password, fullName and valid role are required', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: parsedRole,
        phone: phone || null,
        department: department || null,
        rollNumber: rollNumber || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        organizationId: req.user!.organizationId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        department: true,
        rollNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      role,
      phone,
      department,
      rollNumber,
      isActive,
      password,
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    const parsedRole = parseRole(role);
    const updateData: any = {
      ...(typeof fullName === 'string' && { fullName }),
      ...(typeof phone === 'string' && { phone }),
      ...(typeof department === 'string' && { department }),
      ...(typeof rollNumber === 'string' && { rollNumber }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(parsedRole && { role: parsedRole }),
    };

    if (typeof password === 'string' && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        department: true,
        rollNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    if (req.user!.id === id) {
      throw new AppError('You cannot delete your own account', 400);
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
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
        phone: true,
        department: true,
        rollNumber: true,
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

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, phone, department } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(department && { department })
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        department: true,
        rollNumber: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersByOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role, page, limit } = req.query;

    // Parse pagination params with type conversion
    const { skip, take, page: pageNum, limit: limitNum } =
      parsePaginationParams(
        page as string | number | undefined,
        limit as string | number | undefined
      );

    let whereClause: any = {
      organizationId: req.user!.organizationId
    };

    if (role) {
      whereClause.role = role;
    }

    // Get total count
    const total = await prisma.user.count({ where: whereClause });

    // Get paginated results
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        rollNumber: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    // Return paginated response
    res.json(
      formatPaginatedResponse(users, total, pageNum, limitNum)
    );
  } catch (error) {
    next(error);
  }
};
