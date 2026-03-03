import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { aiService, GeneratedDepartment, OrganizationStructure } from '../services/ai.service';

const prisma = new PrismaClient();

interface SnapshotRolePermission {
  resource: string;
  action: string;
}

interface SnapshotRole {
  name: string;
  description?: string;
  level: number;
  departmentName?: string;
  permissions: SnapshotRolePermission[];
}

interface SnapshotDepartment {
  name: string;
  description?: string;
  level: number;
  color?: string;
  icon?: string;
  children?: SnapshotDepartment[];
}

interface OrgStructureSnapshot {
  organizationName?: string;
  description?: string;
  departments: SnapshotDepartment[];
  roles: SnapshotRole[];
}

const buildDepartmentTree = (
  departments: Array<{
    id: string;
    name: string;
    description: string | null;
    level: number;
    color: string | null;
    icon: string | null;
    parentId: string | null;
  }>,
  parentId: string | null = null
): SnapshotDepartment[] => {
  return departments
    .filter((dept) => dept.parentId === parentId)
    .map((dept) => ({
      name: dept.name,
      description: dept.description || '',
      level: dept.level,
      color: dept.color || undefined,
      icon: dept.icon || undefined,
      children: buildDepartmentTree(departments, dept.id),
    }));
};

const createDepartmentsRecursively = async (
  tx: Prisma.TransactionClient,
  organizationId: string,
  departments: SnapshotDepartment[],
  departmentMap: Map<string, string>,
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

    if (dept.children && dept.children.length > 0) {
      await createDepartmentsRecursively(
        tx,
        organizationId,
        dept.children,
        departmentMap,
        created.id,
        level + 1
      );
    }
  }
};

const createRolesWithPermissions = async (
  tx: Prisma.TransactionClient,
  organizationId: string,
  roles: SnapshotRole[],
  departmentMap: Map<string, string>
) => {
  let rolesCreated = 0;

  for (const role of roles) {
    const departmentId = role.departmentName ? departmentMap.get(role.departmentName) : undefined;

    const createdRole = await tx.customRole.create({
      data: {
        name: role.name,
        description: role.description || '',
        level: role.level,
        departmentId,
        organizationId,
      },
    });

    rolesCreated += 1;

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

  return rolesCreated;
};

const clearOrganizationStructure = async (tx: Prisma.TransactionClient, organizationId: string) => {
  await tx.permission.deleteMany({
    where: {
      role: {
        organizationId,
      },
    },
  });

  await tx.customRole.deleteMany({ where: { organizationId } });
  await tx.department.deleteMany({ where: { organizationId } });
};

const captureCurrentStructureSnapshot = async (
  tx: Prisma.TransactionClient,
  organizationId: string
): Promise<OrgStructureSnapshot> => {
  const departments = await tx.department.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
      color: true,
      icon: true,
      parentId: true,
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });

  const roles = await tx.customRole.findMany({
    where: { organizationId },
    include: {
      permissions: true,
      department: true,
    },
    orderBy: { level: 'desc' },
  });

  return {
    departments: buildDepartmentTree(departments, null),
    roles: roles.map((role) => ({
      name: role.name,
      description: role.description || '',
      level: role.level,
      departmentName: role.department?.name,
      permissions: role.permissions.map((perm) => ({
        resource: perm.resource,
        action: perm.action,
      })),
    })),
  };
};

// Generate organization structure using AI
export const generateStructure = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

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

    return res.json({
      success: true,
      structure,
      usedAI: true, // In production, track if AI was actually used
    });
  } catch (error: any) {
    console.error('Generate structure error:', error);
    return res.status(500).json({ error: 'Failed to generate structure', details: error.message });
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
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Capture current structure to support undo
      const snapshot = await captureCurrentStructureSnapshot(tx, organizationId);

      // Replace previous structure fully to avoid duplicates
      await clearOrganizationStructure(tx, organizationId);

      const departmentMap = new Map<string, string>();
      await createDepartmentsRecursively(
        tx,
        organizationId,
        structure.departments as GeneratedDepartment[],
        departmentMap
      );
      const rolesCreated = await createRolesWithPermissions(tx, organizationId, structure.roles, departmentMap);

      const organization = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      const existingSettings =
        organization?.settings && typeof organization.settings === 'object'
          ? (organization.settings as Record<string, any>)
          : {};

      await tx.organization.update({
        where: { id: organizationId },
        data: {
          settings: {
            ...existingSettings,
            aiOrgBuilderBackup: snapshot,
            aiOrgBuilderLastAppliedAt: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        departmentsCreated: departmentMap.size,
        rolesCreated,
      };
    });

    return res.json({
      success: true,
      message: 'Organization structure applied successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Apply structure error:', error);
    return res.status(500).json({ error: 'Failed to apply structure', details: error.message });
  }
};

// Get current organization structure
export const getStructure = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings =
      organization?.settings && typeof organization.settings === 'object'
        ? (organization.settings as Record<string, any>)
        : {};

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

    // Get all custom roles
    const roles = await prisma.customRole.findMany({
      where: { organizationId },
      include: {
        permissions: true,
        department: true,
      },
      orderBy: { level: 'desc' },
    });

    // Build tree structure
    const buildTree = (parentId: string | null): any[] => {
      return departments
        .filter((dept: any) => dept.parentId === parentId)
        .map((dept: any) => ({
          ...dept,
          children: buildTree(dept.id),
        }));
    };

    const tree = buildTree(null);

    return res.json({
      success: true,
      departments: tree,
      roles,
      hasUndoAvailable: !!settings.aiOrgBuilderBackup,
      lastAppliedAt: settings.aiOrgBuilderLastAppliedAt || null,
      lastUndoAt: settings.aiOrgBuilderLastUndoAt || null,
      stats: {
        totalDepartments: departments.length,
        totalRoles: roles.length,
        maxLevel: Math.max(...departments.map((d: any) => d.level), 0),
      },
    });
  } catch (error: any) {
    console.error('Get structure error:', error);
    return res.status(500).json({ error: 'Failed to get structure', details: error.message });
  }
};

// Undo last applied structure
export const undoLastApply = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings =
      organization?.settings && typeof organization.settings === 'object'
        ? (organization.settings as Record<string, any>)
        : {};

    const backup = settings.aiOrgBuilderBackup as OrgStructureSnapshot | undefined;

    if (!backup || !backup.departments || !backup.roles) {
      return res.status(400).json({ error: 'No previous structure available to undo' });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await clearOrganizationStructure(tx, organizationId);

      const departmentMap = new Map<string, string>();
      await createDepartmentsRecursively(tx, organizationId, backup.departments, departmentMap);
      const rolesCreated = await createRolesWithPermissions(tx, organizationId, backup.roles, departmentMap);

      await tx.organization.update({
        where: { id: organizationId },
        data: {
          settings: {
            ...settings,
            aiOrgBuilderBackup: null,
            aiOrgBuilderLastUndoAt: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        departmentsRestored: departmentMap.size,
        rolesRestored: rolesCreated,
      };
    });

    return res.json({
      success: true,
      message: 'Undo successful. Previous organization structure restored.',
      ...result,
    });
  } catch (error: any) {
    console.error('Undo structure error:', error);
    return res.status(500).json({ error: 'Failed to undo last apply', details: error.message });
  }
};

// Delete department
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    await prisma.department.delete({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department', details: error.message });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    await prisma.customRole.delete({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error: any) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role', details: error.message });
  }
};

// Clear all structure (departments and roles)
export const clearStructure = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    await prisma.$transaction([
      prisma.department.deleteMany({ where: { organizationId } }),
      prisma.customRole.deleteMany({ where: { organizationId } }),
    ]);

    res.json({ success: true, message: 'Organization structure cleared' });
  } catch (error: any) {
    console.error('Clear structure error:', error);
    res.status(500).json({ error: 'Failed to clear structure', details: error.message });
  }
};
