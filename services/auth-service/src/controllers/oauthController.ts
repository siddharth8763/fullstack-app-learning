// =============================================================
// Google OAuth 2.0 Controller
// INTERVIEW: OAuth 2.0 flow (Authorization Code Grant):
// 1. User clicks "Login with Google"
// 2. We redirect → Google's consent screen
// 3. Google redirects back to our callback URL with an auth CODE
// 4. We exchange the CODE for an access_token + user profile
// 5. We upsert the user in our DB and issue our own JWT
//
// PKCE (Proof Key for Code Exchange) adds extra security for
// public clients (SPAs) — Passport handles this if configured.
// =============================================================

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

// Called after Passport successfully authenticates via Google
export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.user is populated by Passport's Google strategy (see config/passport.ts)
    const googleUser = req.user as {
      googleId: string;
      email: string;
      name: string;
    };

    if (!googleUser) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      return;
    }

    // INTERVIEW: "Upsert" = Update if exists, Insert if not.
    // We use googleId as the unique identifier for OAuth users.
    // If a user previously registered with email/password using the same
    // email, we link their accounts by updating the googleId field.
    const user = await prisma.user.upsert({
      where: { googleId: googleUser.googleId },
      update: { name: googleUser.name },
      create: {
        id: uuidv4(),
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        // No passwordHash for OAuth users
      },
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token in URL fragment (hash)
    // INTERVIEW: Never put tokens in query params (they appear in server logs).
    // The hash fragment is not sent to the server — it's frontend-only.
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback#access_token=${accessToken}`
    );
  } catch (err) {
    next(err);
  }
};
