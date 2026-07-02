-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "trip_bookings" ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';

-- Existing bookings were already confirmed (seats deducted), mark them as ACCEPTED
UPDATE "trip_bookings" SET "status" = 'ACCEPTED';
