/*
  Warnings:

  - You are about to drop the column `phoneVerifiedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `PasswordResetCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasswordResetCode" DROP CONSTRAINT "PasswordResetCode_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneVerifiedAt";

-- DropTable
DROP TABLE "PasswordResetCode";
