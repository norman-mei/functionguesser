-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "usernameLower" TEXT NOT NULL,
    "pendingEmail" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "email", "pendingEmail", "passwordHash", "emailVerifiedAt", "createdAt", "updatedAt", "username", "usernameLower")
SELECT "id",
       "email",
       "pendingEmail",
       "passwordHash",
       "emailVerifiedAt",
       "createdAt",
       "updatedAt",
       ('user_' || replace("id", '-', '')),
       lower('user_' || replace("id", '-', ''))
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_usernameLower_key" ON "User"("usernameLower");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
