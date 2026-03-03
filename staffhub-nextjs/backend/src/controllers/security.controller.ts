import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  parsePaginationParams,
  formatPaginatedResponse,
} from '../utils/pagination.utils';

const prisma = new PrismaClient();

// CREATE GATE LOG (Security staff at gate)
export const createGateLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { outpassId, gateAction, notes } = req.body;
    const user = req.user!;

    if (!['EXIT', 'ENTRY'].includes(gateAction)) {
      throw new AppError('Invalid gate action', 400);
    }

    // Verify outpass exists and is approved
    const outpass = await prisma.outpassRequest.findFirst({
      where: {
        id: outpassId,
        organizationId: user.organizationId
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            department: true
          }
        }
      }
    });

    if (!outpass) {
      throw new AppError('Outpass not found', 404);
    }

    if (outpass.status !== 'APPROVED') {
      throw new AppError('Only approved outpasses can be verified at gate', 400);
    }

    // Create gate log entry (as text/JSON for now, can be extended)
    // Storing in memory via API response
    const gateLog = {
      id: `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      outpassId,
      gateAction,
      verifiedAt: new Date().toISOString(),
      verifiedBy: user.id,
      verifiedByName: 'Security Staff',
      notes: notes || '',
      studentName: outpass.student.fullName,
      studentId: outpass.student.id,
      rollNumber: outpass.student.rollNumber,
      department: outpass.student.department
    };

    // Update outpass gate status
    const updatedOutpass = await prisma.outpassRequest.update({
      where: { id: outpassId },
      data: {
        gateStatus: gateAction === 'EXIT' ? 'LEFT' : 'ON_CAMPUS',
        gateVerifiedAt: new Date()
      }
    });

    res.status(201).json({
      message: 'Gate log created successfully',
      gateLog,
      outpass: updatedOutpass
    });
  } catch (error) {
    next(error);
  }
};

// GET GATE LOGS
export const getGateLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { status, page, limit, startDate, endDate, studentId } = req.query;

    const { skip, take, page: pageNum, limit: limitNum } = parsePaginationParams(
      page as string | number | undefined,
      limit as string | number | undefined
    );

    let whereClause: any = {
      organizationId: user.organizationId
    };

    // Filter by status
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
      whereClause.status = status;
    }

    // Filter by student
    if (studentId) {
      whereClause.studentId = studentId;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.gateVerifiedAt = {};
      if (startDate) {
        whereClause.gateVerifiedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.gateVerifiedAt.lte = new Date(endDate as string);
      }
    }

    // For security staff, they can see all logs
    // For students, they can only see their own
    if (user.role === 'STUDENT') {
      whereClause.studentId = user.id;
    }

    const total = await prisma.outpassRequest.count({ where: whereClause });

    const logs = await prisma.outpassRequest.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            department: true
          }
        }
      },
      orderBy: {
        gateVerifiedAt: 'desc'
      },
      skip,
      take
    });

    res.json(
      formatPaginatedResponse(logs, total, pageNum, limitNum)
    );
  } catch (error) {
    next(error);
  }
};

// CREATE SECURITY ALERT
export const createSecurityAlert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { outpassId, alertType, severity, message, studentId } = req.body;
    const user = req.user!;

    const validAlertTypes = ['LATE_RETURN', 'UNAUTHORIZED_EXIT', 'EMERGENCY', 'OTHER'];
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    if (!validAlertTypes.includes(alertType)) {
      throw new AppError('Invalid alert type', 400);
    }

    if (!validSeverities.includes(severity)) {
      throw new AppError('Invalid severity level', 400);
    }

    // Verify outpass exists if provided
    if (outpassId) {
      const outpass = await prisma.outpassRequest.findFirst({
        where: {
          id: outpassId,
          organizationId: user.organizationId
        }
      });

      if (!outpass) {
        throw new AppError('Outpass not found', 404);
      }
    }

    // Verify student exists if provided
    if (studentId) {
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          organizationId: user.organizationId
        }
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }
    }

    // Create alert record (stored as JSON since no table yet)
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      outpassId: outpassId || null,
      studentId: studentId || null,
      alertType,
      severity,
      message,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      status: 'ACTIVE',
      resolvedAt: null,
      notes: ''
    };

    res.status(201).json({
      message: 'Security alert created successfully',
      alert
    });
  } catch (error) {
    next(error);
  }
};

// GET SECURITY ALERTS
export const getSecurityAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { severity, status, alertType, page, limit } = req.query;

    // Only admin and security can view alerts
    if (!['ADMIN', 'SECURITY'].includes(user.role)) {
      throw new AppError('Access denied', 403);
    }

    const { skip, take, page: pageNum, limit: limitNum } = parsePaginationParams(
      page as string | number | undefined,
      limit as string | number | undefined
    );

    let whereClause: any = {
      organizationId: user.organizationId
    };

    // Note: This is a placeholder implementation
    // In production, you would query from a SecurityAlert table
    const allOutpasses = await prisma.outpassRequest.findMany({
      where: whereClause,
      include: {
        student: true
      }
    });

    // Filter and create alerts from outpass data
    let alerts = allOutpasses
      .filter(outpass => {
        // Identify potential alerts
        if (outpass.gateStatus === 'LEFT') {
          if (new Date() > outpass.returnTime && outpass.gateStatus === 'LEFT') {
            return true; // Late return
          }
        }
        if (outpass.status !== 'APPROVED' && outpass.gateStatus !== 'ON_CAMPUS') {
          return true; // Unauthorized exit
        }
        return false;
      })
      .map(outpass => ({
        id: `alert_${outpass.id}`,
        outpassId: outpass.id,
        studentId: outpass.studentId,
        studentName: outpass.student.fullName,
        alertType: new Date() > outpass.returnTime ? 'LATE_RETURN' : 'UNAUTHORIZED_EXIT',
        severity: new Date() > new Date(outpass.returnTime.getTime() + 3600000) ? 'HIGH' : 'MEDIUM',
        message: new Date() > outpass.returnTime ? 'Student has not returned yet' : 'Unauthorized exit detected',
        createdAt: outpass.updatedAt.toISOString(),
        status: 'ACTIVE'
      }));

    // Filter by criteria
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    if (alertType) {
      alerts = alerts.filter(a => a.alertType === alertType);
    }
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }

    const total = alerts.length;
    const paginatedAlerts = alerts.slice(skip, skip + take);

    res.json(
      formatPaginatedResponse(paginatedAlerts, total, pageNum, limitNum)
    );
  } catch (error) {
    next(error);
  }
};

// RESOLVE ALERT
export const resolveAlert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;
    const user = req.user!;

    if (!['ADMIN', 'SECURITY'].includes(user.role)) {
      throw new AppError('Only admin and security can resolve alerts', 403);
    }

    // Update alert status
    const resolvedAlert = {
      id: alertId,
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolvedBy: user.id,
      notes: notes || ''
    };

    res.json({
      message: 'Alert resolved successfully',
      alert: resolvedAlert
    });
  } catch (error) {
    next(error);
  }
};

// GET DAILY LOGS SUMMARY
export const getDailyLogsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { date } = req.query;

    if (!['ADMIN', 'SECURITY'].includes(user.role)) {
      throw new AppError('Access denied', 403);
    }

    const queryDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await prisma.outpassRequest.findMany({
      where: {
        organizationId: user.organizationId,
        gateVerifiedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            department: true,
            rollNumber: true
          }
        }
      }
    });

    // Group by status and department
    const byStatus = {
      ON_CAMPUS: logs.filter(l => l.gateStatus === 'ON_CAMPUS').length,
      LEFT: logs.filter(l => l.gateStatus === 'LEFT').length,
      RETURNED: logs.filter(l => l.gateStatus === 'RETURNED').length
    };

    const byDepartment: any = {};
    logs.forEach(log => {
      const dept = log.student.department || 'Unknown';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    const summary = {
      date: queryDate.toISOString().split('T')[0],
      totalLogs: logs.length,
      byStatus,
      byDepartment,
      lateReturns: logs.filter(l => new Date() > l.returnTime && l.gateStatus !== 'RETURNED').length,
      logs
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// GET SECURITY REPORTS
export const getSecurityReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query;

    if (!['ADMIN', 'SECURITY'].includes(user.role)) {
      throw new AppError('Access denied', 403);
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const logs = await prisma.outpassRequest.findMany({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            department: true,
            rollNumber: true
          }
        }
      }
    });

    // Daily trends
    const dailyTrends: any = {};
    logs.forEach(log => {
      const day = log.createdAt.toISOString().split('T')[0];
      if (!dailyTrends[day]) {
        dailyTrends[day] = { count: 0, left: 0, returned: 0 };
      }
      dailyTrends[day].count++;
      if (log.gateStatus === 'LEFT') dailyTrends[day].left++;
      if (log.gateStatus === 'RETURNED') dailyTrends[day].returned++;
    });

    // Frequent users
    const frequentUsersMap: any = {};
    logs.forEach(log => {
      if (!frequentUsersMap[log.studentId]) {
        frequentUsersMap[log.studentId] = {
          studentId: log.studentId,
          name: log.student.fullName,
          count: 0,
          department: log.student.department
        };
      }
      frequentUsersMap[log.studentId].count++;
    });

    const frequentUsers = Object.values(frequentUsersMap)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Late returns
    const lateReturns = logs.filter(l => new Date() > l.returnTime && l.gateStatus !== 'RETURNED');

    // Build trends array from object
    const trendsArray = Object.entries(dailyTrends).map(([date, data]: [string, any]) => ({
      date,
      ...data
    }));

    const report = {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      totalOutpasses: logs.length,
      totalStudents: new Set(logs.map(l => l.studentId)).size,
      dailyTrends: trendsArray,
      frequentUsers,
      lateReturns: lateReturns.length,
      lateReturnDetails: lateReturns.map(l => ({
        studentName: l.student.fullName,
        department: l.student.department,
        expectedReturn: l.returnTime.toISOString(),
        status: l.gateStatus
      }))
    };

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// SEARCH STAFF
export const searchStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { query, department, page, limit } = req.query;

    if (!['ADMIN', 'SECURITY'].includes(user.role)) {
      throw new AppError('Access denied', 403);
    }

    const { skip, take, page: pageNum, limit: limitNum } = parsePaginationParams(
      page as string | number | undefined,
      limit as string | number | undefined
    );

    let whereClause: any = {
      organizationId: user.organizationId
    };

    if (query) {
      whereClause.OR = [
        { fullName: { contains: query as string, mode: 'insensitive' } },
        { email: { contains: query as string, mode: 'insensitive' } },
        { rollNumber: { contains: query as string, mode: 'insensitive' } }
      ];
    }

    if (department) {
      whereClause.department = department;
    }

    const total = await prisma.user.count({
      where: whereClause
    });

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        rollNumber: true,
        department: true,
        role: true
      },
      skip,
      take
    });

    res.json(
      formatPaginatedResponse(staff, total, pageNum, limitNum)
    );
  } catch (error) {
    next(error);
  }
};
