import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (id !== req.user!.organizationId) {
      throw new AppError('Access denied', 403);
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        settings: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    res.json({ organization });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, logo, settings } = req.body;

    if (id !== req.user!.organizationId) {
      throw new AppError('Access denied', 403);
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logo && { logo }),
        ...(settings && { settings })
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true
      }
    });

    res.json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    next(error);
  }
};
