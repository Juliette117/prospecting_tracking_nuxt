import { createClient } from '@supabase/supabase-js'
import type { Prisma } from '@prisma/client'
import { serverSupabaseUser } from '#supabase/server'
import { getHeader } from 'h3'
import { prisma } from '../utils/prisma'

const MONTHLY_GOAL_TARGET = 10
const FOLLOW_UP_DELAY_DAYS = 7
const DAY_IN_MS = 24 * 60 * 60 * 1000
const MAX_UPCOMING_ACTIONS = 5
const MAX_URGENT_UPCOMING_ACTIONS = 3

type ActivityKind = 'job' | 'freelance' | 'interview' | 'contact'
type ActionPriority = 'Urgent' | 'Non urgent'
type JobStatusKey = 'sent' | 'interviews' | 'offers' | 'rejected'
type FreelanceStatusKey = 'prospecting' | 'proposals' | 'negotiations' | 'won'

type TimelineEntry = {
  id: string
  title: string
  company: string
  date: string
  kind: ActivityKind
  timestamp: number
}

type ActionEntry = {
  id: string
  title: string
  date: string
  priority: ActionPriority
  timestamp: number
}

type JobApplicationWithRelations = Prisma.JobApplicationGetPayload<{
  include: {
    company: {
      select: {
        name: true
      }
    }
    interviews: {
      select: {
        scheduledAt: true
      }
    }
  }
}>

type FreelanceMissionWithCompany = Prisma.FreelanceMissionGetPayload<{
  include: {
    company: {
      select: {
        name: true
      }
    }
  }
}>

type InterviewWithApplication = Prisma.InterviewsGetPayload<{
  select: {
    id: true
    type: true
    scheduledAt: true
    application: {
      select: {
        position: true
        company: {
          select: {
            name: true
          }
        }
      }
    }
  }
}>

type ContactWithCompany = Prisma.ContactsGetPayload<{
  include: {
    company: {
      select: {
        name: true
      }
    }
  }
}>

const normalizeLabel = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const includesAny = (value: string, patterns: string[]) =>
  patterns.some(pattern => value.includes(pattern))

const getJobStatusKey = (status: string): JobStatusKey => {
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

const isClosedJobStatus = (status: string) => {
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

const getFreelanceStatusKey = (status: string): FreelanceStatusKey => {
  const normalizedStatus = normalizeLabel(status)

  if (includesAny(normalizedStatus, ['gagne', 'won', 'signe'])) {
    return 'won'
  }

  if (includesAny(normalizedStatus, ['negociation', 'nego', 'negotiation'])) {
    return 'negotiations'
  }

  if (includesAny(normalizedStatus, ['proposition', 'proposal', 'devis', 'offre'])) {
    return 'proposals'
  }

  return 'prospecting'
}

const isClosedFreelanceStatus = (status: string) => {
  const normalizedStatus = normalizeLabel(status)

  return includesAny(normalizedStatus, [
    'gagne',
    'won',
    'signe',
    'termine',
    'clotur',
    'clos',
    'perdu',
    'lost',
  ])
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const addDays = (date: Date, days: number) =>
  new Date(startOfDay(date).getTime() + days * DAY_IN_MS)

const diffInDays = (from: Date, to: Date) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_IN_MS)

const getActionPriority = (date: Date): ActionPriority => {
  const daysUntilDate = diffInDays(new Date(), date)

  if (daysUntilDate <= 2) {
    return 'Urgent'
  }

  return 'Non urgent'
}

const getJobActivityTitle = (status: string) => {
  switch (getJobStatusKey(status)) {
    case 'interviews':
      return 'Entretien programme'
    case 'offers':
      return 'Offre recue'
    case 'rejected':
      return 'Candidature refusee'
    default:
      return 'Candidature envoyee'
  }
}

const getFreelanceActivityTitle = (status: string) => {
  switch (getFreelanceStatusKey(status)) {
    case 'proposals':
      return 'Proposition freelance'
    case 'negotiations':
      return 'Negociation en cours'
    case 'won':
      return 'Mission gagnee'
    default:
      return 'Prospection freelance'
  }
}

export default defineEventHandler(async (event) => {
  // Le dashboard regroupe plusieurs sources Prisma dans une seule reponse
  // pour eviter au front de faire une requete par bloc visuel.
  const authorizationHeader = getHeader(event, 'authorization')
  const bearerToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length).trim()
    : ''

  let authUserId = ''
  let authUserEmail = ''

  if (bearerToken) {
    const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabasePublishableKey = process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabasePublishableKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase client configuration is missing.',
      })
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.getUser(bearerToken)

    if (error || !data.user?.id || !data.user.email) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Utilisateur non authentifie.',
      })
    }

    authUserId = data.user.id
    authUserEmail = data.user.email
  } else {
    const authUser = await serverSupabaseUser(event)

    authUserId = authUser?.id ?? authUser?.sub ?? ''
    authUserEmail = typeof authUser?.email === 'string' ? authUser.email : ''
  }

  if (!authUserId || authUserEmail.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Utilisateur non authentifie.',
    })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let jobApplications: JobApplicationWithRelations[] = []
  let freelanceMissions: FreelanceMissionWithCompany[] = []
  let interviews: InterviewWithApplication[] = []
  let contacts: ContactWithCompany[] = []

  try {
    await prisma.user.upsert({
      where: { id: authUserId },
      update: { email: authUserEmail },
      create: {
        id: authUserId,
        email: authUserEmail,
      },
    })

    ;[jobApplications, freelanceMissions, interviews, contacts] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { userId: authUserId },
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { name: true } },
          interviews: {
            select: { scheduledAt: true },
            orderBy: { scheduledAt: 'asc' },
          },
        },
      }),
      prisma.freelanceMission.findMany({
        where: { userId: authUserId },
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { name: true } },
        },
      }),
      prisma.interviews.findMany({
        where: { userId: authUserId },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          type: true,
          scheduledAt: true,
          application: {
            select: {
              position: true,
              company: { select: { name: true } },
            },
          },
        },
      }),
      prisma.contacts.findMany({
        where: { userId: authUserId },
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { name: true } },
        },
      }),
    ])
  } catch (dbError) {
    console.error('Erreur lors des requêtes Prisma :', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la communication avec la base de donnees.',
    })
  }

  const jobStats = {
    sent: 0,
    interviews: 0,
    offers: 0,
    rejected: 0,
  }

  for (const application of jobApplications) {
    jobStats[getJobStatusKey(application.status)] += 1
  }

  const freelanceStats = {
    prospecting: 0,
    proposals: 0,
    negotiations: 0,
    won: 0,
  }

  for (const mission of freelanceMissions) {
    freelanceStats[getFreelanceStatusKey(mission.status)] += 1
  }

  const activeJobCount = jobApplications.filter(application => !isClosedJobStatus(application.status)).length
  const activeFreelanceCount = freelanceMissions.filter(mission => !isClosedFreelanceStatus(mission.status)).length
  const futureInterviewsCount = interviews.filter(interview => interview.scheduledAt >= now).length

  const targetedCompanies = new Set<string>()

  for (const application of jobApplications) {
    targetedCompanies.add(application.companyId)
  }

  for (const mission of freelanceMissions) {
    targetedCompanies.add(mission.companyId)
  }

  const monthlyGoalCurrent =
    jobApplications.filter(application => application.createdAt >= monthStart).length +
    freelanceMissions.filter(mission => mission.createdAt >= monthStart).length

  const interviewDelays = jobApplications.flatMap((application) => {
    const firstInterview = application.interviews[0]
    const referenceDate = application.appliedAt ?? application.createdAt

    if (!firstInterview) {
      return []
    }

    return [Math.max(0, diffInDays(referenceDate, firstInterview.scheduledAt))]
  })

  const averageFirstInterviewDelayDays = interviewDelays.length > 0
    ? Math.round(interviewDelays.reduce((sum, delay) => sum + delay, 0) / interviewDelays.length)
    : null

  const recentActivity: TimelineEntry[] = [
    ...jobApplications.map(application => ({
      id: `job-${application.id}`,
      title: getJobActivityTitle(application.status),
      company: `${application.company.name} · ${application.position}`,
      date: formatDate(application.appliedAt ?? application.createdAt),
      kind: 'job' as const,
      timestamp: (application.appliedAt ?? application.createdAt).getTime(),
    })),
    ...freelanceMissions.map(mission => ({
      id: `freelance-${mission.id}`,
      title: getFreelanceActivityTitle(mission.status),
      company: `${mission.company.name} · ${mission.title}`,
      date: formatDate(mission.createdAt),
      kind: 'freelance' as const,
      timestamp: mission.createdAt.getTime(),
    })),
    ...interviews.map(interview => ({
      id: `interview-${interview.id}`,
      title: `Entretien ${interview.type}`,
      company: `${interview.application.company.name} · ${interview.application.position}`,
      date: formatDate(interview.scheduledAt),
      kind: 'interview' as const,
      timestamp: interview.scheduledAt.getTime(),
    })),
    ...contacts.map(contact => ({
      id: `contact-${contact.id}`,
      title: 'Nouveau contact',
      company: `${contact.name} · ${contact.company.name}`,
      date: formatDate(contact.createdAt),
      kind: 'contact' as const,
      timestamp: contact.createdAt.getTime(),
    })),
  ]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5)

  const allUpcomingActions: ActionEntry[] = [
    ...interviews
      .filter(interview => interview.scheduledAt >= now)
      .map(interview => ({
        id: `prepare-${interview.id}`,
        title: `Preparer entretien ${interview.application.company.name}`,
        date: formatDate(interview.scheduledAt),
        priority: getActionPriority(interview.scheduledAt),
        timestamp: interview.scheduledAt.getTime(),
      })),
    ...jobApplications
      .filter((application) => {
        if (isClosedJobStatus(application.status)) {
          return false
        }

        const hasUpcomingInterview = application.interviews.some(interview => interview.scheduledAt >= now)
        return !hasUpcomingInterview
      })
      .map((application) => {
        const followUpDate = addDays(application.appliedAt ?? application.createdAt, FOLLOW_UP_DELAY_DAYS)

        return {
          id: `job-follow-up-${application.id}`,
          title: `Relancer candidature ${application.company.name}`,
          date: formatDate(followUpDate),
          priority: getActionPriority(followUpDate),
          timestamp: followUpDate.getTime(),
        }
      })
      .filter(action => action.timestamp <= addDays(now, 14).getTime()),
    ...freelanceMissions
      .filter(mission => !isClosedFreelanceStatus(mission.status))
      .map((mission) => {
        const followUpDate = addDays(mission.createdAt, FOLLOW_UP_DELAY_DAYS)

        return {
          id: `freelance-follow-up-${mission.id}`,
          title: `Relancer mission ${mission.company.name}`,
          date: formatDate(followUpDate),
          priority: getActionPriority(followUpDate),
          timestamp: followUpDate.getTime(),
        }
      })
      .filter(action => action.timestamp <= addDays(now, 14).getTime()),
  ]
    .sort((left, right) => left.timestamp - right.timestamp)

  const urgentUpcomingActions = allUpcomingActions
    .filter(action => action.priority === 'Urgent')
    .slice(0, MAX_URGENT_UPCOMING_ACTIONS)

  const selectedActionIds = new Set(urgentUpcomingActions.map(action => action.id))
  const remainingSlots = Math.max(0, MAX_UPCOMING_ACTIONS - urgentUpcomingActions.length)

  const nonUrgentUpcomingActions = allUpcomingActions
    .filter(action => action.priority === 'Non urgent' && !selectedActionIds.has(action.id))
    .slice(0, remainingSlots)

  for (const action of nonUrgentUpcomingActions) {
    selectedActionIds.add(action.id)
  }

  const fillActions = allUpcomingActions
    .filter(action => !selectedActionIds.has(action.id))
    .slice(0, Math.max(0, MAX_UPCOMING_ACTIONS - urgentUpcomingActions.length - nonUrgentUpcomingActions.length))

  const upcomingActions = [...urgentUpcomingActions, ...nonUrgentUpcomingActions, ...fillActions]
    .sort((left, right) => left.timestamp - right.timestamp)

  return {
    overview: {
      targetedCompanies: targetedCompanies.size,
      activeContacts: contacts.length,
      futureInterviews: futureInterviewsCount,
      monthlyGoalCurrent,
      monthlyGoalTarget: MONTHLY_GOAL_TARGET,
      averageFirstInterviewDelayDays,
    },
    job: {
      activeCount: activeJobCount,
      stats: jobStats,
    },
    freelance: {
      activeCount: activeFreelanceCount,
      stats: freelanceStats,
    },
    recentActivity: recentActivity.map(({ timestamp, ...item }) => item),
    upcomingActions: upcomingActions.map(({ timestamp, ...item }) => item),
  }
})
