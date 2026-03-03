import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  parsePaginationParams,
  formatPaginatedResponse,
} from '../utils/pagination.utils';

const prisma = new PrismaClient();

export const createMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { staffId, purpose, meetingType, requestedTime } = req.body;
    const user = req.user!;

    if (!staffId || !purpose || !meetingType || !requestedTime) {
      throw new AppError('All fields are required', 400);
    }

    // Verify staff belongs to same organization
    const staff = await prisma.staffMember.findFirst({
      where: {
        id: staffId,
        organizationId: user.organizationId
      }
    });

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const meeting = await prisma.meetingRequest.create({
      data: {
        studentId: user.id,
        staffId,
        purpose,
        meetingType,
        requestedTime: new Date(requestedTime),
        organizationId: user.organizationId
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            rollNumber: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Meeting request created successfully',
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { status, page, limit } = req.query;

    // Parse pagination params with type conversion
    const { skip, take, page: pageNum, limit: limitNum } =
      parsePaginationParams(
        page as string | number | undefined,
        limit as string | number | undefined
      );

    let whereClause: any = {
      organizationId: user.organizationId
    };

    // Filter based on role
    if (user.role === 'STUDENT') {
      whereClause.studentId = user.id;
    } else if (user.role === 'STAFF') {
      const staffMember = await prisma.staffMember.findFirst({
        where: { userId: user.id }
      });
      if (staffMember) {
        whereClause.staffId = staffMember.id;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    // Get total count
    const total = await prisma.meetingRequest.count({ where: whereClause });

    // Get paginated results
    const meetings = await prisma.meetingRequest.findMany({
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
        staff: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      },
      orderBy: {
        requestedTime: 'desc'
      },
      skip,
      take
    });

    // Return paginated response
    res.json(
      formatPaginatedResponse(meetings, total, pageNum, limitNum)
    );
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const meeting = await prisma.meetingRequest.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
            rollNumber: true,
            department: true
          }
        },
        staff: {
          select: {
            name: true,
            title: true
          }
        }
      }
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    res.json({ meeting });
  } catch (error) {
    next(error);
  }
};

export const updateMeetingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const user = req.user!;

    if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const meeting = await prisma.meetingRequest.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const updatedMeeting = await prisma.meetingRequest.update({
      where: { id },
      data: {
        status,
        staffRemarks: remarks
      },
      include: {
        student: {
          select: {
            fullName: true,
            email: true
          }
        },
        staff: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: `Meeting ${status.toLowerCase()} successfully`,
      meeting: updatedMeeting
    });
  } catch (error) {
    next(error);
  }
};
