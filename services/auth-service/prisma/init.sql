-- Initial SQL for MySQL database setup
-- INTERVIEW: This runs once when MySQL container is first created.
-- In production, use Prisma Migrate (prisma migrate deploy).

CREATE DATABASE IF NOT EXISTS fullstack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
