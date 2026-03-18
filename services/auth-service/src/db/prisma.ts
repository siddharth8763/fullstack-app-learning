// =============================================================
// Prisma Client Singleton
// INTERVIEW: Why a singleton?
// In Node.js, each time you import and instantiate PrismaClient
// in development (with hot-reload), you'd create multiple
// connection pool instances, exhausting DB connections.
// The singleton pattern ensures one instance is shared.
// In production this isn't an issue (no hot-reload), but it's
// still a best practice for resource management.
// =============================================================

import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declaration (needed for module caching in dev)
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma;
}

export default prisma;
