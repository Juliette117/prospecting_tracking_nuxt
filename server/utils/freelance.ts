import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { normalizeLabel } from './job-search'

export type FreelanceStatusKey = 'prospecting' | 'proposals' | 'negotiations' | 'won'

type FreelanceMissionWithRelations = Prisma.FreelanceMissionGetPayload<{
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

export type FreelanceResponse = {
  summary: {
    totalCount: number
    activeCount: number
    prospectingCount: number
    proposalsCount: number
    negotiationsCount: number
    wonCount: number
    totalBudget: number
  }
  missions: Array<{
    id: string
    companyName: string
    companyWebsite: string | null
    companyLinkedin: string | null
    title: string
    status: string
    statusKey: FreelanceStatusKey
    budget: number | null
    startDate: string | null
    endDate: string | null
    durationLabel: string | null
    notes: string | null
    isActive: boolean
    primaryContact: {
      id: string
      name: string
      role: string | null
      email: string | null
      linkedin: string | null
    } | null
  }>
}

const includesAny = (value: string, patterns: string[]) =>
  patterns.some(pattern => value.includes(pattern))

export const getFreelanceStatusKey = (status: string): FreelanceStatusKey => {
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

export const isClosedFreelanceStatus = (status: string) => {
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

const dayInMs = 24 * 60 * 60 * 1000

const getDurationLabel = (startDate: Date | null, endDate: Date | null) => {
  if (!startDate || !endDate) {
    return null
  }

  const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / dayInMs))
  const diffMonths = Math.round(diffDays / 30)

  if (diffMonths >= 1) {
    return `${diffMonths} mois`
  }

  return `${Math.max(1, Math.round(diffDays / 7))} semaine(s)`
}

export const getFreelancePayload = async (
  authUserId: string,
  authUserEmail: string,
): Promise<FreelanceResponse> => {
  let missions: FreelanceMissionWithRelations[] = []
  let contacts: ContactSummary[] = []

  await prisma.user.upsert({
    where: { id: authUserId },
    update: { email: authUserEmail },
    create: {
      id: authUserId,
      email: authUserEmail,
    },
  })

  missions = await prisma.freelanceMission.findMany({
    where: { userId: authUserId },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
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

  const companyIds = [...new Set(missions.map(mission => mission.companyId))]

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

  const summary: FreelanceResponse['summary'] = {
    totalCount: missions.length,
    activeCount: 0,
    prospectingCount: 0,
    proposalsCount: 0,
    negotiationsCount: 0,
    wonCount: 0,
    totalBudget: 0,
  }

  for (const mission of missions) {
    const statusKey = getFreelanceStatusKey(mission.status)
    summary[`${statusKey}Count`] += 1

    if (!isClosedFreelanceStatus(mission.status)) {
      summary.activeCount += 1
    }

    if (mission.budget && statusKey === 'won') {
      summary.totalBudget += mission.budget
    }
  }

  return {
    summary,
    missions: missions.map((mission) => {
      const primaryContact = primaryContactByCompany.get(mission.companyId) ?? null

      return {
        id: mission.id,
        companyName: mission.company.name,
        companyWebsite: mission.company.website,
        companyLinkedin: mission.company.linkedin,
        title: mission.title,
        status: mission.status,
        statusKey: getFreelanceStatusKey(mission.status),
        budget: mission.budget,
        startDate: mission.startDate?.toISOString() ?? null,
        endDate: mission.endDate?.toISOString() ?? null,
        durationLabel: getDurationLabel(mission.startDate, mission.endDate),
        notes: mission.notes,
        isActive: !isClosedFreelanceStatus(mission.status),
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
