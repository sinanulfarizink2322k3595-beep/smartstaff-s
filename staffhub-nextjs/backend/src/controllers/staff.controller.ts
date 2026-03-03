import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  parsePaginationParams,
  formatPaginatedResponse,
} from '../utils/pagination.utils';

const prisma = new PrismaClient();

export const getStaffMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    // Parse pagination params with type conversion
    const { skip, take, page: pageNum, limit: limitNum } =
      parsePaginationParams(
        page as string | number | undefined,
        limit as string | number | undefined
      );

    const whereClause = {
      organizationId: req.user!.organizationId
    };

    // Get total count
    const total = await prisma.staffMember.count({ where: whereClause });

    // Get paginated results
    const staff = await prisma.staffMember.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        title: true,
        email: true,
        department: true,
        isHod: true
      },
      orderBy: {
        name: 'asc'
      },
      skip,
      take
    });

    // Return paginated response
    res.json(
      formatPaginatedResponse(staff, total, pageNum, limitNum)
    );
  } catch (error) {
    next(error);
  }
};

export const getStaffAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const availability = await prisma.staffAvailability.findMany({
      where: {
        staffId: id
      },
      orderBy: {
        dayOfWeek: 'asc'
      }
    });

    res.json({ availability });
  } catch (error) {
    next(error);
  }
};
