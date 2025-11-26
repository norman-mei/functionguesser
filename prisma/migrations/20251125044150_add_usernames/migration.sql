-- CreateTable
CREATE TABLE "ChallengeCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ChallengeCompletion_type_completedAt_idx" ON "ChallengeCompletion"("type", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeCompletion_userId_type_key_key" ON "ChallengeCompletion"("userId", "type", "key");
