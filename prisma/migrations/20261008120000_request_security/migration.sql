-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "ContactRequest_ipHash_createdAt_idx" ON "ContactRequest"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "ContactRequest_email_createdAt_idx" ON "ContactRequest"("email", "createdAt");

