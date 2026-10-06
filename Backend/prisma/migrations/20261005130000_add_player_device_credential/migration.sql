-- AlterTable
ALTER TABLE "Player" ADD COLUMN "deviceCredentialHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_deviceCredentialHash_key" ON "Player" ("deviceCredentialHash");