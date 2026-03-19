-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RelationshipNodeType" AS ENUM ('COMPANY', 'CONTACT', 'JOB_APPLICATION', 'FREELANCE_MISSION', 'INTERVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "linkedin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelanceMission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budget" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreelanceMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interviews" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contacts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "linkedin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "fromType" "RelationshipNodeType" NOT NULL,
    "toType" "RelationshipNodeType" NOT NULL,
    "fromCompanyId" UUID,
    "fromContactId" UUID,
    "fromJobApplicationId" UUID,
    "fromFreelanceMissionId" UUID,
    "fromInterviewId" UUID,
    "toCompanyId" UUID,
    "toContactId" UUID,
    "toJobApplicationId" UUID,
    "toFreelanceMissionId" UUID,
    "toInterviewId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Relationship_from_single_reference_check" CHECK (
        (CASE WHEN "fromCompanyId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "fromContactId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "fromJobApplicationId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "fromFreelanceMissionId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "fromInterviewId" IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),
    CONSTRAINT "Relationship_to_single_reference_check" CHECK (
        (CASE WHEN "toCompanyId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "toContactId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "toJobApplicationId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "toFreelanceMissionId" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "toInterviewId" IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),
    CONSTRAINT "Relationship_from_type_matches_reference_check" CHECK (
        ("fromType" = 'COMPANY' AND "fromCompanyId" IS NOT NULL AND "fromContactId" IS NULL AND "fromJobApplicationId" IS NULL AND "fromFreelanceMissionId" IS NULL AND "fromInterviewId" IS NULL) OR
        ("fromType" = 'CONTACT' AND "fromCompanyId" IS NULL AND "fromContactId" IS NOT NULL AND "fromJobApplicationId" IS NULL AND "fromFreelanceMissionId" IS NULL AND "fromInterviewId" IS NULL) OR
        ("fromType" = 'JOB_APPLICATION' AND "fromCompanyId" IS NULL AND "fromContactId" IS NULL AND "fromJobApplicationId" IS NOT NULL AND "fromFreelanceMissionId" IS NULL AND "fromInterviewId" IS NULL) OR
        ("fromType" = 'FREELANCE_MISSION' AND "fromCompanyId" IS NULL AND "fromContactId" IS NULL AND "fromJobApplicationId" IS NULL AND "fromFreelanceMissionId" IS NOT NULL AND "fromInterviewId" IS NULL) OR
        ("fromType" = 'INTERVIEW' AND "fromCompanyId" IS NULL AND "fromContactId" IS NULL AND "fromJobApplicationId" IS NULL AND "fromFreelanceMissionId" IS NULL AND "fromInterviewId" IS NOT NULL)
    ),
    CONSTRAINT "Relationship_to_type_matches_reference_check" CHECK (
        ("toType" = 'COMPANY' AND "toCompanyId" IS NOT NULL AND "toContactId" IS NULL AND "toJobApplicationId" IS NULL AND "toFreelanceMissionId" IS NULL AND "toInterviewId" IS NULL) OR
        ("toType" = 'CONTACT' AND "toCompanyId" IS NULL AND "toContactId" IS NOT NULL AND "toJobApplicationId" IS NULL AND "toFreelanceMissionId" IS NULL AND "toInterviewId" IS NULL) OR
        ("toType" = 'JOB_APPLICATION' AND "toCompanyId" IS NULL AND "toContactId" IS NULL AND "toJobApplicationId" IS NOT NULL AND "toFreelanceMissionId" IS NULL AND "toInterviewId" IS NULL) OR
        ("toType" = 'FREELANCE_MISSION' AND "toCompanyId" IS NULL AND "toContactId" IS NULL AND "toJobApplicationId" IS NULL AND "toFreelanceMissionId" IS NOT NULL AND "toInterviewId" IS NULL) OR
        ("toType" = 'INTERVIEW' AND "toCompanyId" IS NULL AND "toContactId" IS NULL AND "toJobApplicationId" IS NULL AND "toFreelanceMissionId" IS NULL AND "toInterviewId" IS NOT NULL)
    )
);

-- CreateIndex
CREATE INDEX "Relationship_userId_relationship_idx" ON "Relationship"("userId", "relationship");

-- CreateIndex
CREATE INDEX "Relationship_userId_fromType_idx" ON "Relationship"("userId", "fromType");

-- CreateIndex
CREATE INDEX "Relationship_userId_toType_idx" ON "Relationship"("userId", "toType");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceMission" ADD CONSTRAINT "FreelanceMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceMission" ADD CONSTRAINT "FreelanceMission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interviews" ADD CONSTRAINT "Interviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interviews" ADD CONSTRAINT "Interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_fromCompanyId_fkey" FOREIGN KEY ("fromCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_fromContactId_fkey" FOREIGN KEY ("fromContactId") REFERENCES "Contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_fromJobApplicationId_fkey" FOREIGN KEY ("fromJobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_fromFreelanceMissionId_fkey" FOREIGN KEY ("fromFreelanceMissionId") REFERENCES "FreelanceMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_fromInterviewId_fkey" FOREIGN KEY ("fromInterviewId") REFERENCES "Interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_toCompanyId_fkey" FOREIGN KEY ("toCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_toContactId_fkey" FOREIGN KEY ("toContactId") REFERENCES "Contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_toJobApplicationId_fkey" FOREIGN KEY ("toJobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_toFreelanceMissionId_fkey" FOREIGN KEY ("toFreelanceMissionId") REFERENCES "FreelanceMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_toInterviewId_fkey" FOREIGN KEY ("toInterviewId") REFERENCES "Interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
