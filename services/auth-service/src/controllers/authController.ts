// =============================================================
// Auth Controller — Register, Login, Refresh, Logout
// INTERVIEW: Controllers contain business logic. The route file
// just maps HTTP verbs to controller functions. This separation
// of concerns makes code testable and maintainable.
// =============================================================

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

// ── REGISTER ───────────────────────────────────────────────────
// POST /auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // INTERVIEW: bcrypt salt rounds = work factor.
    // Higher rounds = slower hashing = harder to brute force.
    // 12 is recommended for production (10 is default/dev).
    // bcrypt automatically stores the salt IN the hash string.
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        name,
        passwordHash,
      },
      select: {   // Never return the password hash!
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (err) {
    next(err);  // Pass errors to global error handler
  }
};

// ── LOGIN ──────────────────────────────────────────────────────
// POST /auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // INTERVIEW: Use a generic error message — don't reveal whether
    // the email exists or the password is wrong. This prevents
    // user enumeration attacks.
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in DB for revocation support
    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // INTERVIEW: HttpOnly cookies cannot be read by JavaScript.
    // This protects refresh tokens from XSS attacks.
    // The Secure flag ensures cookies are only sent over HTTPS.
    // SameSite=strict prevents CSRF attacks.
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in ms
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── REFRESH TOKEN ──────────────────────────────────────────────
// POST /auth/refresh
// INTERVIEW: Refresh token rotation — old token is revoked on use.
// This means stolen refresh tokens have a very short window of misuse.
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    // Verify the token cryptographically
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Check token exists in DB and is not revoked
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token, userId: payload.userId, isRevoked: false },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token revoked or expired' });
      return;
    }

    // Revoke OLD token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue NEW tokens
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// ── LOGOUT ────────────────────────────────────────────────────
// POST /auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Revoke the refresh token in DB
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { isRevoked: true },
      });
    }

    // Clear the cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
