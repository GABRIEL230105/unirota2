-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "currentLat" DOUBLE PRECISION,
ADD COLUMN     "currentLng" DOUBLE PRECISION,
ADD COLUMN     "destinationLatitude" DOUBLE PRECISION,
ADD COLUMN     "destinationLongitude" DOUBLE PRECISION,
ADD COLUMN     "locationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "requesterLat" DOUBLE PRECISION,
ADD COLUMN     "requesterLng" DOUBLE PRECISION,
ADD COLUMN     "requesterLocationUpdatedAt" TIMESTAMP(3);
