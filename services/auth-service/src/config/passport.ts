// =============================================================
// Passport.js — Google OAuth 2.0 Strategy Configuration
// INTERVIEW: Passport strategies define HOW authentication works.
// The GoogleStrategy makes a request to Google's OAuth server,
// gets an authorization code, exchanges it for a token, then
// calls the verify callback with the user's profile.
//
// Flow: Browser → /auth/google → Google Consent → /auth/google/callback
//       → Passport verifyCallback → googleCallback controller → Frontend
// =============================================================

import { PassportStatic } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export const configurePassport = (passport: PassportStatic): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        // INTERVIEW: 'scope' defines what user data we request from Google.
        // 'profile' = name, photo; 'email' = email address
        scope: ['profile', 'email'],
      },
      // Verify callback — called after Google returns user info
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // We normalize the Google profile into our own shape
          const user = {
            googleId: profile.id,
            email: profile.emails?.[0].value ?? '',
            name: profile.displayName ?? '',
          };

          // 'done(null, user)' sets req.user for the next middleware
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  // INTERVIEW: serializeUser/deserializeUser are for session-based auth.
  // Since we use JWT (stateless), we don't actually need sessions.
  // We include these stubs so Passport doesn't throw errors.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as Express.User));
};
