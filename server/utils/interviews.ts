import type { Prisma } from '@prisma/client'
import { isGoogleCalendarConfigured } from './google-calendar'
import { getGoogleCalendarSchemaSupport } from './google-calendar-schema'
import { prisma } from './prisma'

type JobApplicationSummary = Prisma.JobApplicationGetPayload<{
  include: {
    company: {
      select: {
        name: true
        website: true
        linkedin: true
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

export type InterviewsResponse = {
  calendarConnection: {
    isAvailable: boolean
    isConfigured: boolean
    isConnected: boolean
  }
  summary: {
    totalCount: number
    upcomingCount: number
    completedCount: number
    companyCount: number
  }
  applications: Array<{
    id: string
    companyName: string
    position: string
    status: string
  }>
  interviews: Array<{
    id: string
    applicationId: string
    companyName: string
    companyWebsite: string | null
    companyLinkedin: string | null
    position: string
    applicationStatus: string
    type: string
    scheduledAt: string
    notes: string | null
    feedback: string | null
    googleCalendarEventUrl: string | null
    googleCalendarSyncedAt: string | null
    isUpcoming: boolean
    primaryContact: {
      id: string
      name: string
      role: string | null
      email: string | null
      linkedin: string | null
    } | null
  }>
}

export const getInterviewsPayload = async (
  authUserId: string,
  authUserEmail: string,
): Promise<InterviewsResponse> => {
  const now = new Date()
  const googleCalendarSchemaSupport = await getGoogleCalendarSchemaSupport()
  const isCalendarConfigured = isGoogleCalendarConfigured()

  await prisma.user.upsert({
    where: { id: authUserId },
    update: { email: authUserEmail },
    create: {
      id: authUserId,
      email: authUserEmail,
    },
  })

  const applications: JobApplicationSummary[] = await prisma.jobApplication.findMany({
    where: { userId: authUserId },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      company: {
        select: {
          name: true,
          website: true,
          linkedin: true,
        },
      },
    },
  })

  const baseInterviewSelect = {
    id: true,
    type: true,
    scheduledAt: true,
    notes: true,
    feedback: true,
    createdAt: true,
    application: {
      select: {
        id: true,
        companyId: true,
        position: true,
        status: true,
        company: {
          select: {
            name: true,
            website: true,
            linkedin: true,
          },
        },
      },
    },
  } satisfies Prisma.InterviewsSelect

  const interviews = googleCalendarSchemaSupport.hasInterviewSyncColumns
    ? await prisma.interviews.findMany({
        where: { userId: authUserId },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        select: {
          ...baseInterviewSelect,
          googleCalendarEventUrl: true,
          googleCalendarSyncedAt: true,
        },
      })
    : await prisma.interviews.findMany({
        where: { userId: authUserId },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        select: baseInterviewSelect,
      })

  const companyIds = [...new Set(applications.map(application => application.companyId))]

  const contacts: ContactSummary[] = companyIds.length > 0
    ? await prisma.contacts.findMany({
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
    : []

  const primaryContactByCompany = new Map<string, ContactSummary>()
  const calendarConnection = googleCalendarSchemaSupport.hasConnectionTable
    ? await prisma.googleCalendarConnection.findUnique({
        where: {
          userId: authUserId,
        },
        select: {
          id: true,
        },
      })
    : null

  for (const contact of contacts) {
    if (!primaryContactByCompany.has(contact.companyId)) {
      primaryContactByCompany.set(contact.companyId, contact)
    }
  }

  return {
    calendarConnection: {
      isAvailable: googleCalendarSchemaSupport.hasConnectionTable &&
        googleCalendarSchemaSupport.hasOAuthStateTable &&
        googleCalendarSchemaSupport.hasInterviewSyncColumns,
      isConfigured: isCalendarConfigured,
      isConnected: Boolean(calendarConnection),
    },
    summary: {
      totalCount: interviews.length,
      upcomingCount: interviews.filter(interview => interview.scheduledAt >= now).length,
      completedCount: interviews.filter(interview => interview.scheduledAt < now).length,
      companyCount: new Set(interviews.map(interview => interview.application.companyId)).size,
    },
    applications: applications.map(application => ({
      id: application.id,
      companyName: application.company.name,
      position: application.position,
      status: application.status,
    }))
      .sort((left, right) =>
        left.companyName.localeCompare(right.companyName, 'fr', { sensitivity: 'base' }),
      ),
    interviews: interviews.map((interview) => {
      const primaryContact = primaryContactByCompany.get(interview.application.companyId) ?? null

      return {
        id: interview.id,
        applicationId: interview.application.id,
        companyName: interview.application.company.name,
        companyWebsite: interview.application.company.website,
        companyLinkedin: interview.application.company.linkedin,
        position: interview.application.position,
        applicationStatus: interview.application.status,
        type: interview.type,
        scheduledAt: interview.scheduledAt.toISOString(),
        notes: interview.notes,
        feedback: interview.feedback,
        googleCalendarEventUrl: 'googleCalendarEventUrl' in interview
          ? interview.googleCalendarEventUrl
          : null,
        googleCalendarSyncedAt: 'googleCalendarSyncedAt' in interview
          ? interview.googleCalendarSyncedAt?.toISOString() ?? null
          : null,
        isUpcoming: interview.scheduledAt >= now,
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
  }
}
