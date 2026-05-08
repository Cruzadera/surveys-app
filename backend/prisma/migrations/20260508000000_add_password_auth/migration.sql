-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'MAGIC_LINK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "age" INTEGER,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'MAGIC_LINK';
