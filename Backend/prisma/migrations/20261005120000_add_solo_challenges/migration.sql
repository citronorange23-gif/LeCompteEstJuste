-- CreateTable
CREATE TABLE "SoloChallenge" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "numbers" INTEGER[] NOT NULL,
    "target" INTEGER NOT NULL,
    "solution" TEXT [] NOT NULL,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SoloChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoloChallenge_playerId_expiresAt_idx" ON "SoloChallenge" ("playerId", "expiresAt");

-- AddForeignKey
ALTER TABLE "SoloChallenge"
ADD CONSTRAINT "SoloChallenge_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;