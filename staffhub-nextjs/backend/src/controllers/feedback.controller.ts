import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const createFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, rating, category, isAnonymous } = req.body;
    const user = req.user!;

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    const feedback = await prisma.feedback.create({
      data: {
        message,
        rating,
        category: category || 'general',
        isAnonymous: isAnonymous || false,
        userId: isAnonymous ? null : user.id,
        organizationId: user.organizationId
      }
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback.id,
        message: feedback.message,
        rating: feedback.rating,
        category: feedback.category
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.query;

    let whereClause: any = {
      organizationId: req.user!.organizationId
    };

    if (category) {
      whereClause.category = category;
    }

    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};
