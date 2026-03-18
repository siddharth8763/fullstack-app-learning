import { Router } from 'express';
import { body } from 'express-validator';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController';
import { authenticate, authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

export const usersRouter = Router();

// All routes require authentication
usersRouter.use(authenticate);

// GET /users — Admin only
usersRouter.get('/', authorize('ADMIN'), getUsers);

// GET /users/:id — own profile or admin
usersRouter.get('/:id', getUserById);

// PUT /users/:id
usersRouter.put(
  '/:id',
  [body('name').optional().trim().isLength({ min: 2, max: 100 })],
  validate,
  updateUser
);

// DELETE /users/:id — Admin only (soft delete)
usersRouter.delete('/:id', authorize('ADMIN'), deleteUser);
