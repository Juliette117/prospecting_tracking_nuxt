ALTER TABLE "Interviews"
ADD COLUMN "googleCalendarEventId" TEXT,
ADD COLUMN "googleCalendarEventUrl" TEXT,
ADD COLUMN "googleCalendarSyncedAt" TIMESTAMP(3);

CREATE TABLE "GoogleCalendarConnection" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "accessToken" TEXT,
  "tokenType" TEXT,
  "scope" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoogleOAuthState" (
  "id" UUID NOT NULL,
  "state" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "returnTo" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GoogleOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_key" ON "GoogleCalendarConnection"("userId");
CREATE UNIQUE INDEX "GoogleOAuthState_state_key" ON "GoogleOAuthState"("state");
CREATE INDEX "GoogleOAuthState_provider_expiresAt_idx" ON "GoogleOAuthState"("provider", "expiresAt");
CREATE INDEX "GoogleOAuthState_userId_provider_idx" ON "GoogleOAuthState"("userId", "provider");

ALTER TABLE "GoogleCalendarConnection"
ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleOAuthState"
ADD CONSTRAINT "GoogleOAuthState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
