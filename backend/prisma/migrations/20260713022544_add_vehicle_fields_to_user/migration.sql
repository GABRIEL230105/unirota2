/*
  Warnings:

  - The `status` column on the `Ride` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `RideParticipant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Ride` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RideType" AS ENUM ('OFERTA', 'SOLICITACAO');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('PENDENTE', 'ACEITA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('CONFIRMADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "passengerId" TEXT,
ADD COLUMN     "rua" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "RideType" NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "time" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RideStatus" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "RideParticipant" DROP COLUMN "status",
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'CONFIRMADA';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plate" TEXT,
ADD COLUMN     "vehicleColor" TEXT,
ADD COLUMN     "vehicleModel" TEXT;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
