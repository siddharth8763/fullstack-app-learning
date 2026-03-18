// =============================================================
// Users Controller — CRUD with RBAC
// INTERVIEW: Pagination is critical in production APIs.
// Never return all rows with SELECT * — use LIMIT/OFFSET (page-based)
// or cursor-based pagination (scalable for large datasets).
// Cursor-based is preferred: it avoids the "missing/duplicate rows"
// problem that page-based pagination has with live data changes.
// =============================================================

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authorize';
import prisma from '../db/prisma';

// GET /users — Admin only (paginated)
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true,
          isActive: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id — Own profile or Admin
export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Users can only fetch their own profile; admins can fetch anyone
    if (req.user?.role !== 'ADMIN' && req.user?.userId !== id) {
      res.status(403).json({ error: 'Cannot access another user\'s profile' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true,
        isActive: true, createdAt: true, updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

// PUT /users/:id — Own profile or Admin
export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== 'ADMIN' && req.user?.userId !== id) {
      res.status(403).json({ error: 'Cannot update another user\'s profile' });
      return;
    }

    const { name, isActive } = req.body;
    // Non-admins cannot change isActive
    const updateData: { name?: string; isActive?: boolean } = { name };
    if (req.user?.role === 'ADMIN' && isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
    });

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

// DELETE /users/:id — Admin only (soft delete)
// INTERVIEW: Soft delete sets isActive=false rather than removing the row.
// This preserves referential integrity and allows data recovery/audit trails.
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
