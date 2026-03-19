import type { Prisma, RelationshipNodeType } from '@prisma/client'
import { prisma } from './prisma'

type RelationshipNodeRefInput =
  | { type: 'COMPANY'; companyId: string }
  | { type: 'CONTACT'; contactId: string }
  | { type: 'JOB_APPLICATION'; jobApplicationId: string }
  | { type: 'FREELANCE_MISSION'; freelanceMissionId: string }
  | { type: 'INTERVIEW'; interviewId: string }

type GraphVariant = 'hierarchy' | 'intercompany' | 'opportunity' | 'network'
type GraphVisualType = 'company' | 'contact' | 'opportunity'
type GraphEntityType = 'company' | 'contact' | 'jobApplication' | 'freelanceMission' | 'interview'

type RelationshipWithNodes = Prisma.RelationshipGetPayload<{
  include: {
    fromCompany: {
      select: {
        id: true
        name: true
        website: true
        linkedin: true
      }
    }
    fromContact: {
      select: {
        id: true
        name: true
        role: true
        email: true
        linkedin: true
        company: {
          select: {
            name: true
          }
        }
      }
    }
    fromJobApplication: {
      select: {
        id: true
        position: true
        status: true
      }
    }
    fromFreelanceMission: {
      select: {
        id: true
        title: true
        status: true
      }
    }
    fromInterview: {
      select: {
        id: true
        type: true
        scheduledAt: true
      }
    }
    toCompany: {
      select: {
        id: true
        name: true
        website: true
        linkedin: true
      }
    }
    toContact: {
      select: {
        id: true
        name: true
        role: true
        email: true
        linkedin: true
        company: {
          select: {
            name: true
          }
        }
      }
    }
    toJobApplication: {
      select: {
        id: true
        position: true
        status: true
      }
    }
    toFreelanceMission: {
      select: {
        id: true
        title: true
        status: true
      }
    }
    toInterview: {
      select: {
        id: true
        type: true
        scheduledAt: true
      }
    }
  }
}>

export type RelationshipGraphResponse = {
  nodes: Array<{
    id: string
    entityType: GraphEntityType
    visualType: GraphVisualType
    label: string
    subtitle: string
    details?: {
      website?: string | null
      linkedin?: string | null
      email?: string | null
      role?: string | null
      companyName?: string | null
    }
  }>
  connections: Array<{
    id: string
    fromId: string
    toId: string
    relationship: string
    variant: GraphVariant
  }>
}

const normalizeLabel = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

// Prisma stocke un lien polymorphe sur plusieurs colonnes possibles.
// Cette fonction convertit un noeud "metier" en colonnes attendues par la base.
const buildRelationshipData = (
  prefix: 'from' | 'to',
  ref: RelationshipNodeRefInput,
) => {
  switch (ref.type) {
    case 'COMPANY':
      return {
        [`${prefix}Type`]: ref.type satisfies RelationshipNodeType,
        [`${prefix}CompanyId`]: ref.companyId,
      }
    case 'CONTACT':
      return {
        [`${prefix}Type`]: ref.type satisfies RelationshipNodeType,
        [`${prefix}ContactId`]: ref.contactId,
      }
    case 'JOB_APPLICATION':
      return {
        [`${prefix}Type`]: ref.type satisfies RelationshipNodeType,
        [`${prefix}JobApplicationId`]: ref.jobApplicationId,
      }
    case 'FREELANCE_MISSION':
      return {
        [`${prefix}Type`]: ref.type satisfies RelationshipNodeType,
        [`${prefix}FreelanceMissionId`]: ref.freelanceMissionId,
      }
    case 'INTERVIEW':
      return {
        [`${prefix}Type`]: ref.type satisfies RelationshipNodeType,
        [`${prefix}InterviewId`]: ref.interviewId,
      }
  }
}

const getNodeId = (
  type: RelationshipNodeType,
  entityId: string,
) => `${type}:${entityId}`

const getConnectionVariant = (
  relationship: string,
  fromType: RelationshipNodeType,
  toType: RelationshipNodeType,
): GraphVariant => {
  const normalizedRelationship = normalizeLabel(relationship)

  if (normalizedRelationship.includes('reseau') || normalizedRelationship.includes('commun')) {
    return 'network'
  }

  if (fromType === 'COMPANY' && toType === 'COMPANY') {
    return 'intercompany'
  }

  if (
    fromType === 'JOB_APPLICATION'
    || fromType === 'FREELANCE_MISSION'
    || fromType === 'INTERVIEW'
    || toType === 'JOB_APPLICATION'
    || toType === 'FREELANCE_MISSION'
    || toType === 'INTERVIEW'
  ) {
    return 'opportunity'
  }

  return 'hierarchy'
}

export const syncRelationship = async ({
  userId,
  relationship,
  from,
  to,
}: {
  userId: string
  relationship: string
  from: RelationshipNodeRefInput
  to: RelationshipNodeRefInput
}) => {
  const fromData = buildRelationshipData('from', from)
  const toData = buildRelationshipData('to', to)

  // On remplace le lien precedent pour garder un graphe lisible et idempotent
  // quand une meme candidature, mission ou relation est reenregistree.
  await prisma.relationship.deleteMany({
    where: {
      userId,
      relationship,
      ...fromData,
    },
  })

  return prisma.relationship.create({
    data: {
      userId,
      relationship,
      ...fromData,
      ...toData,
    },
  })
}

export const syncContactCompanyRelationship = async ({
  userId,
  contactId,
  companyId,
}: {
  userId: string
  contactId: string
  companyId: string
}) =>
  await syncRelationship({
    userId,
    relationship: 'Travaille chez',
    from: {
      type: 'CONTACT',
      contactId,
    },
    to: {
      type: 'COMPANY',
      companyId,
    },
  })

export const syncJobApplicationCompanyRelationship = async ({
  userId,
  applicationId,
  companyId,
}: {
  userId: string
  applicationId: string
  companyId: string
}) =>
  await syncRelationship({
    userId,
    relationship: 'Candidature',
    from: {
      type: 'JOB_APPLICATION',
      jobApplicationId: applicationId,
    },
    to: {
      type: 'COMPANY',
      companyId,
    },
  })

export const syncFreelanceMissionCompanyRelationship = async ({
  userId,
  missionId,
  companyId,
}: {
  userId: string
  missionId: string
  companyId: string
}) =>
  await syncRelationship({
    userId,
    relationship: 'Mission freelance',
    from: {
      type: 'FREELANCE_MISSION',
      freelanceMissionId: missionId,
    },
    to: {
      type: 'COMPANY',
      companyId,
    },
  })

export const syncInterviewApplicationRelationship = async ({
  userId,
  interviewId,
  applicationId,
}: {
  userId: string
  interviewId: string
  applicationId: string
}) =>
  await syncRelationship({
    userId,
    relationship: 'Entretien',
    from: {
      type: 'INTERVIEW',
      interviewId,
    },
    to: {
      type: 'JOB_APPLICATION',
      jobApplicationId: applicationId,
    },
  })

const getNodeDetails = (
  relationship: RelationshipWithNodes,
  side: 'from' | 'to',
): RelationshipGraphResponse['nodes'][number] | null => {
  // Le front attend un format unique pour dessiner le graphe.
  // Ici on "aplatit" chaque type Prisma vers un noeud commun.
  const type = relationship[`${side}Type`]

  if (type === 'COMPANY') {
    const company = relationship[`${side}Company`]

    if (!company) {
      return null
    }

    return {
      id: getNodeId(type, company.id),
      entityType: 'company',
      visualType: 'company',
      label: company.name,
      subtitle: 'Entreprise',
      details: {
        website: company.website,
        linkedin: company.linkedin,
      },
    }
  }

  if (type === 'CONTACT') {
    const contact = relationship[`${side}Contact`]

    if (!contact) {
      return null
    }

    return {
      id: getNodeId(type, contact.id),
      entityType: 'contact',
      visualType: 'contact',
      label: contact.name,
      subtitle: contact.role ?? 'Contact',
      details: {
        role: contact.role,
        email: contact.email,
        linkedin: contact.linkedin,
        companyName: contact.company?.name ?? null,
      },
    }
  }

  if (type === 'JOB_APPLICATION') {
    const application = relationship[`${side}JobApplication`]

    if (!application) {
      return null
    }

    return {
      id: getNodeId(type, application.id),
      entityType: 'jobApplication',
      visualType: 'opportunity',
      label: application.position,
      subtitle: application.status,
    }
  }

  if (type === 'FREELANCE_MISSION') {
    const mission = relationship[`${side}FreelanceMission`]

    if (!mission) {
      return null
    }

    return {
      id: getNodeId(type, mission.id),
      entityType: 'freelanceMission',
      visualType: 'opportunity',
      label: mission.title,
      subtitle: mission.status,
    }
  }

  const interview = relationship[`${side}Interview`]

  if (!interview) {
    return null
  }

  return {
    id: getNodeId(type, interview.id),
    entityType: 'interview',
    visualType: 'opportunity',
    label: `Entretien ${interview.type}`,
    subtitle: new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    }).format(interview.scheduledAt),
  }
}

export const getRelationshipGraphPayload = async (
  authUserId: string,
  authUserEmail: string,
): Promise<RelationshipGraphResponse> => {
  // Les routes metier s'assurent toujours que l'utilisateur existe dans la base
  // applicative avant de lire ou creer des donnees liees a son compte.
  await prisma.user.upsert({
    where: { id: authUserId },
    update: { email: authUserEmail },
    create: {
      id: authUserId,
      email: authUserEmail,
    },
  })

  const relationships: RelationshipWithNodes[] = await prisma.relationship.findMany({
    where: {
      userId: authUserId,
    },
    orderBy: [
      { createdAt: 'asc' },
    ],
    include: {
      fromCompany: {
        select: {
          id: true,
          name: true,
          website: true,
          linkedin: true,
        },
      },
      fromContact: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          linkedin: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
      fromJobApplication: {
        select: {
          id: true,
          position: true,
          status: true,
        },
      },
      fromFreelanceMission: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      fromInterview: {
        select: {
          id: true,
          type: true,
          scheduledAt: true,
        },
      },
      toCompany: {
        select: {
          id: true,
          name: true,
          website: true,
          linkedin: true,
        },
      },
      toContact: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          linkedin: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
      toJobApplication: {
        select: {
          id: true,
          position: true,
          status: true,
        },
      },
      toFreelanceMission: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      toInterview: {
        select: {
          id: true,
          type: true,
          scheduledAt: true,
        },
      },
    },
  })

  const nodeMap = new Map<string, RelationshipGraphResponse['nodes'][number]>()
  const connections: RelationshipGraphResponse['connections'] = []

  for (const relationship of relationships) {
    const fromNode = getNodeDetails(relationship, 'from')
    const toNode = getNodeDetails(relationship, 'to')

    if (!fromNode || !toNode) {
      continue
    }

    nodeMap.set(fromNode.id, fromNode)
    nodeMap.set(toNode.id, toNode)

    connections.push({
      id: relationship.id,
      fromId: fromNode.id,
      toId: toNode.id,
      relationship: relationship.relationship,
      variant: getConnectionVariant(
        relationship.relationship,
        relationship.fromType,
        relationship.toType,
      ),
    })
  }

  return {
    nodes: [...nodeMap.values()],
    connections,
  }
}
