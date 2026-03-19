import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export type JobStatusKey = 'sent' | 'interviews' | 'offers' | 'rejected'

type JobApplicationWithRelations = Prisma.JobApplicationGetPayload<{
  include: {
    company: {
      select: {
        name: true
        website: true
        linkedin: true
      }
    }
    interviews: {
      select: {
        id: true
        type: true
        scheduledAt: true
      }
      orderBy: {
        scheduledAt: 'asc'
      }
    }
  }
}>

type ContactSummary = {
  id: string
  companyId: string
  name: string
  role: string | null
  email: string | null
  linkedin: string | null
}

export type JobSearchResponse = {
  summary: {
    totalCount: number
    activeCount: number
    sentCount: number
    interviewsCount: number
    offersCount: number
    rejectedCount: number
    thisMonthCount: number
    upcomingInterviewsCount: number
  }
  applications: Array<{
    id: string
    companyName: string
    companyWebsite: string | null
    companyLinkedin: string | null
    position: string
    status: string
    statusKey: JobStatusKey
    appliedAt: string | null
    createdAt: string
    notes: string | null
    interviewCount: number
    nextInterviewAt: string | null
    lastInterviewAt: string | null
    isActive: boolean
    primaryContact: {
      id: string
      name: string
      role: string | null
      email: string | null
      linkedin: string | null
    } | null
  }>
  upcomingInterviews: Array<{
    id: string
    companyName: string
    position: string
    type: string
    scheduledAt: string
  }>
}

export const normalizeLabel = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const includesAny = (value: string, patterns: string[]) =>
  patterns.some(pattern => value.includes(pattern))

export const getJobStatusKey = (status: string): JobStatusKey => {
  const normalizedStatus = normalizeLabel(status)

  if (includesAny(normalizedStatus, ['refus', 'rejete', 'rejet', 'declin'])) {
    return 'rejected'
  }

  if (includesAny(normalizedStatus, ['offre', 'offer', 'retenu', 'proposition'])) {
    return 'offers'
  }

  if (includesAny(normalizedStatus, ['entretien', 'interview'])) {
    return 'interviews'
  }

  return 'sent'
}

export const isClosedJobStatus = (status: string) => {
  const normalizedStatus = normalizeLabel(status)

  return includesAny(normalizedStatus, [
    'refus',
    'rejete',
    'rejet',
    'declin',
    'embauche',
    'hired',
    'accepte',
    'clotur',
    'clos',
    'archive',
  ])
}

export const getJobSearchPayload = async (
  authUserId: string,
  authUserEmail: string,
): Promise<JobSearchResponse> => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let jobApplications: JobApplicationWithRelations[] = []
  let contacts: ContactSummary[] = []

  await prisma.user.upsert({
    where: { id: authUserId },
    update: { email: authUserEmail },
    create: {
      id: authUserId,
      email: authUserEmail,
    },
  })

  jobApplications = await prisma.jobApplication.findMany({
    where: { userId: authUserId },
    orderBy: [{ appliedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      company: {
        select: {
          name: true,
          website: true,
          linkedin: true,
        },
      },
      interviews: {
        select: {
          id: true,
          type: true,
          scheduledAt: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
  })

  const companyIds = [...new Set(jobApplications.map(application => application.companyId))]

  if (companyIds.length > 0) {
    contacts = await prisma.contacts.findMany({
      where: {
        userId: authUserId,
        companyId: {
          in: companyIds,
        },
      },
      orderBy: [{ createdAt: 'asc' }],
      select: {
        id: true,
        companyId: true,
        name: true,
        role: true,
        email: true,
        linkedin: true,
      },
    })
  }

  const primaryContactByCompany = new Map<string, ContactSummary>()

  for (const contact of contacts) {
    if (!primaryContactByCompany.has(contact.companyId)) {
      primaryContactByCompany.set(contact.companyId, contact)
    }
  }

  const summary: JobSearchResponse['summary'] = {
    totalCount: jobApplications.length,
    activeCount: 0,
    sentCount: 0,
    interviewsCount: 0,
    offersCount: 0,
    rejectedCount: 0,
    thisMonthCount: 0,
    upcomingInterviewsCount: 0,
  }

  for (const application of jobApplications) {
    const statusKey = getJobStatusKey(application.status)
    const applicationDate = application.appliedAt ?? application.createdAt
    const hasUpcomingInterview = application.interviews.some(interview => interview.scheduledAt >= now)

    summary[`${statusKey}Count`] += 1

    if (!isClosedJobStatus(application.status)) {
      summary.activeCount += 1
    }

    if (applicationDate >= monthStart) {
      summary.thisMonthCount += 1
    }

    if (hasUpcomingInterview) {
      summary.upcomingInterviewsCount += 1
    }
  }

  const upcomingInterviews = jobApplications
    .flatMap(application =>
      application.interviews
        .filter(interview => interview.scheduledAt >= now)
        .map(interview => ({
          id: interview.id,
          companyName: application.company.name,
          position: application.position,
          type: interview.type,
          scheduledAt: interview.scheduledAt.toISOString(),
        })),
    )
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())
    .slice(0, 6)

  return {
    summary,
    applications: jobApplications.map((application) => {
      const nextInterview = application.interviews.find(interview => interview.scheduledAt >= now)
      const latestInterview = application.interviews.at(-1) ?? null
      const primaryContact = primaryContactByCompany.get(application.companyId) ?? null

      return {
        id: application.id,
        companyName: application.company.name,
        companyWebsite: application.company.website,
        companyLinkedin: application.company.linkedin,
        position: application.position,
        status: application.status,
        statusKey: getJobStatusKey(application.status),
        appliedAt: (application.appliedAt ?? null)?.toISOString() ?? null,
        createdAt: application.createdAt.toISOString(),
        notes: application.notes,
        interviewCount: application.interviews.length,
        nextInterviewAt: nextInterview?.scheduledAt.toISOString() ?? null,
        lastInterviewAt: latestInterview?.scheduledAt.toISOString() ?? null,
        isActive: !isClosedJobStatus(application.status),
        primaryContact: primaryContact
          ? {
              id: primaryContact.id,
              name: primaryContact.name,
              role: primaryContact.role,
              email: primaryContact.email,
              linkedin: primaryContact.linkedin,
            }
          : null,
      }
    }),
    upcomingInterviews,
  }
}
