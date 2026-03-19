import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const { Pool } = pg

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.NUXT_SUPABASE_SECRET_KEY

if (!datasourceUrl) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL for Prisma seed.')
}

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing NUXT_PUBLIC_SUPABASE_URL or NUXT_SUPABASE_SECRET_KEY for Prisma seed.')
}

const pool = new Pool({
  connectionString: datasourceUrl,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const DEFAULT_USER_ID = '11111111-1111-4111-8111-111111111111'
const DEFAULT_USER_EMAIL = 'test@test.fr'
const DEFAULT_USER_PASSWORD = 'TestDashboard123!'
const DEFAULT_USER_PROFILE = {
  firstName: 'Juliette',
  lastName: 'Martin',
  fullName: 'Juliette Martin',
}

const seedUserId = process.env.SEED_USER_ID ?? DEFAULT_USER_ID
const seedUserEmail = process.env.SEED_USER_EMAIL ?? DEFAULT_USER_EMAIL
const seedUserPassword = process.env.SEED_USER_PASSWORD ?? DEFAULT_USER_PASSWORD
const seedUserProfile = {
  ...DEFAULT_USER_PROFILE,
  firstName: process.env.SEED_USER_FIRST_NAME ?? DEFAULT_USER_PROFILE.firstName,
  lastName: process.env.SEED_USER_LAST_NAME ?? DEFAULT_USER_PROFILE.lastName,
  fullName:
    process.env.SEED_USER_FULL_NAME ??
    `${process.env.SEED_USER_FIRST_NAME ?? DEFAULT_USER_PROFILE.firstName} ${process.env.SEED_USER_LAST_NAME ?? DEFAULT_USER_PROFILE.lastName}`,
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ensureUuid = (value, label) => {
  if (!uuidPattern.test(value)) {
    throw new Error(`${label} must be a valid UUID. Received "${value}".`)
  }
}

const daysFromNow = (days, hour = 9, minute = 0) => {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

async function findSupabaseUserByEmail(email) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(`Unable to list Supabase users: ${error.message}`)
    }

    const matchedUser = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    if (matchedUser) {
      return matchedUser
    }

    if (!data.nextPage || data.users.length === 0) {
      return null
    }

    page = data.nextPage
  }
}

async function ensureAuthUser() {
  const existingAuthUser = await findSupabaseUserByEmail(seedUserEmail)

  if (existingAuthUser?.id) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      email: seedUserEmail,
      password: seedUserPassword,
      email_confirm: true,
      user_metadata: seedUserProfile,
    })

    if (error || !data.user?.id || !data.user.email) {
      throw new Error(error?.message ?? `Unable to update Supabase user ${seedUserEmail}.`)
    }

    return data.user
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedUserEmail,
    password: seedUserPassword,
    email_confirm: true,
    user_metadata: seedUserProfile,
  })

  if (error || !data.user?.id || !data.user.email) {
    throw new Error(error?.message ?? `Unable to create Supabase user ${seedUserEmail}.`)
  }

  return data.user
}

const companies = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'NovaForge',
    website: 'https://novaforge.example',
    linkedin: 'https://linkedin.com/company/novaforge',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Pulse Studio',
    website: 'https://pulse-studio.example',
    linkedin: 'https://linkedin.com/company/pulse-studio',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    name: 'LedgerFlow',
    website: 'https://ledgerflow.example',
    linkedin: 'https://linkedin.com/company/ledgerflow',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    name: 'Orbit AI',
    website: 'https://orbit-ai.example',
    linkedin: 'https://linkedin.com/company/orbit-ai',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    name: 'Harbor Cloud',
    website: 'https://harbor-cloud.example',
    linkedin: 'https://linkedin.com/company/harbor-cloud',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    name: 'Bright Commerce',
    website: 'https://bright-commerce.example',
    linkedin: 'https://linkedin.com/company/bright-commerce',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    name: 'Atlas Health',
    website: 'https://atlas-health.example',
    linkedin: 'https://linkedin.com/company/atlas-health',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    name: 'Northstar Mobility',
    website: 'https://northstar-mobility.example',
    linkedin: 'https://linkedin.com/company/northstar-mobility',
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    name: 'Cascade Retail',
    website: 'https://cascade-retail.example',
    linkedin: 'https://linkedin.com/company/cascade-retail',
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    name: 'Zenith Media Lab',
    website: 'https://zenith-media-lab.example',
    linkedin: 'https://linkedin.com/company/zenith-media-lab',
  },
  {
    id: '20000000-0000-4000-8000-000000000011',
    name: 'Evergreen Energy',
    website: 'https://evergreen-energy.example',
    linkedin: 'https://linkedin.com/company/evergreen-energy',
  },
]

const jobApplications = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    companyId: companies[0].id,
    position: 'Senior Frontend Engineer',
    status: 'entretien final',
    appliedAt: daysFromNow(-9, 10, 0),
    notes: 'Parcours avance, discussion autour du design system et de la qualite front.',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    companyId: companies[1].id,
    position: 'Lead Product Engineer',
    status: 'offre recue',
    appliedAt: daysFromNow(-4, 9, 30),
    notes: 'Offre recue avec package a negocier.',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    companyId: companies[2].id,
    position: 'Staff Frontend Engineer',
    status: 'entretien technique',
    appliedAt: daysFromNow(-6, 15, 0),
    notes: 'Equipe plateforme, focus performance et accessibilite.',
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    companyId: companies[3].id,
    position: 'Product Designer Engineer',
    status: 'refusee',
    appliedAt: daysFromNow(-28, 11, 0),
    notes: 'Refus apres entretien RH, fit produit juge insuffisant.',
  },
  {
    id: '30000000-0000-4000-8000-000000000005',
    companyId: companies[4].id,
    position: 'Frontend Platform Engineer',
    status: 'envoyee',
    appliedAt: daysFromNow(-3, 13, 0),
    notes: 'Candidature recente avec mise en avant de l expertise Nuxt et DX.',
  },
  {
    id: '30000000-0000-4000-8000-000000000006',
    companyId: companies[6].id,
    position: 'UI Architect',
    status: 'entretien RH',
    appliedAt: daysFromNow(-11, 10, 30),
    notes: 'Premier call tres positif avec la DRH et le VP Product.',
  },
  {
    id: '30000000-0000-4000-8000-000000000007',
    companyId: companies[5].id,
    position: 'Frontend Consultant',
    status: 'envoyee',
    appliedAt: daysFromNow(-1, 9, 45),
    notes: 'Prise de contact via recommendation d un ancien collegue.',
  },
  {
    id: '30000000-0000-4000-8000-000000000008',
    companyId: companies[7].id,
    position: 'Lead Frontend Engineer',
    status: 'envoyee',
    appliedAt: daysFromNow(-4, 14, 0),
    notes: 'Candidature ciblee pour un poste hybride produit et architecture front.',
  },
]

const freelanceMissions = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    companyId: companies[1].id,
    title: 'Refonte portail analytics B2B',
    status: 'proposition envoyee',
    budget: 4600,
    startDate: daysFromNow(10),
    endDate: daysFromNow(48),
    notes: 'Devis detaille envoye, attente arbitrage budget.',
    createdAt: daysFromNow(-5, 15, 0),
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    companyId: companies[2].id,
    title: 'Mission design system fintech',
    status: 'negociation',
    budget: 6800,
    startDate: daysFromNow(5),
    endDate: daysFromNow(65),
    notes: 'Discussion en cours sur la gouvernance et la reprise des composants.',
    createdAt: daysFromNow(-4, 10, 30),
  },
  {
    id: '40000000-0000-4000-8000-000000000003',
    companyId: companies[0].id,
    title: 'Audit UX espace client premium',
    status: 'gagnee',
    budget: 3400,
    startDate: daysFromNow(-6),
    endDate: daysFromNow(12),
    notes: 'Kickoff effectue, ateliers utilisateurs planifies.',
    createdAt: daysFromNow(-19, 16, 15),
  },
  {
    id: '40000000-0000-4000-8000-000000000004',
    companyId: companies[5].id,
    title: 'Cadrage tunnel e-commerce',
    status: 'prospection',
    budget: 5200,
    startDate: daysFromNow(18),
    endDate: daysFromNow(54),
    notes: 'Premier contact obtenu via reseau freelance.',
    createdAt: daysFromNow(-2, 14, 45),
  },
  {
    id: '40000000-0000-4000-8000-000000000005',
    companyId: companies[6].id,
    title: 'Refonte parcours patient onboarding',
    status: 'proposition envoyee',
    budget: 3900,
    startDate: daysFromNow(9),
    endDate: daysFromNow(32),
    notes: 'Prototype Figma partage avec equipe produit et operations.',
    createdAt: daysFromNow(-4, 11, 0),
  },
  {
    id: '40000000-0000-4000-8000-000000000006',
    companyId: companies[8].id,
    title: 'Optimisation checkout omnicanal',
    status: 'proposition envoyee',
    budget: 4100,
    startDate: daysFromNow(14),
    endDate: daysFromNow(40),
    notes: 'Besoin exprime sur la conversion mobile et la simplification du parcours.',
    createdAt: daysFromNow(-4, 15, 30),
  },
]

const contacts = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    companyId: companies[0].id,
    name: 'Claire Deniau',
    role: 'VP Engineering',
    email: 'claire.deniau@novaforge.example',
    linkedin: 'https://linkedin.com/in/claire-deniau',
    createdAt: daysFromNow(-13, 9, 0),
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    companyId: companies[1].id,
    name: 'Yanis Paul',
    role: 'Head of Product',
    email: 'yanis.paul@pulse-studio.example',
    linkedin: 'https://linkedin.com/in/yanis-paul',
    createdAt: daysFromNow(-16, 17, 30),
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    companyId: companies[2].id,
    name: 'Ines Bousquet',
    role: 'Design System Lead',
    email: 'ines.bousquet@ledgerflow.example',
    linkedin: 'https://linkedin.com/in/ines-bousquet',
    createdAt: daysFromNow(-8, 11, 45),
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    companyId: companies[4].id,
    name: 'Mathieu Roche',
    role: 'Director of Platform',
    email: 'mathieu.roche@harbor-cloud.example',
    linkedin: 'https://linkedin.com/in/mathieu-roche',
    createdAt: daysFromNow(-4, 10, 15),
  },
  {
    id: '50000000-0000-4000-8000-000000000005',
    companyId: companies[6].id,
    name: 'Sarah El Ghazi',
    role: 'Talent Partner',
    email: 'sarah.elghazi@atlas-health.example',
    linkedin: 'https://linkedin.com/in/sarah-elghazi',
    createdAt: daysFromNow(-6, 14, 20),
  },
  {
    id: '50000000-0000-4000-8000-000000000006',
    companyId: companies[5].id,
    name: 'Lea Roussel',
    role: 'E-commerce Director',
    email: 'lea.roussel@bright-commerce.example',
    linkedin: 'https://linkedin.com/in/lea-roussel',
    createdAt: daysFromNow(-3, 16, 50),
  },
]

const interviews = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    applicationId: jobApplications[0].id,
    type: 'final',
    scheduledAt: daysFromNow(1, 15, 30),
    notes: 'Prevoir retour sur leadership technique et mentoring.',
    feedback: null,
    createdAt: daysFromNow(-2, 16, 0),
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    applicationId: jobApplications[2].id,
    type: 'technique',
    scheduledAt: daysFromNow(4, 10, 0),
    notes: 'Session de pair programming avec equipe core front.',
    feedback: null,
    createdAt: daysFromNow(-1, 12, 15),
  },
  {
    id: '60000000-0000-4000-8000-000000000003',
    applicationId: jobApplications[1].id,
    type: 'managerial',
    scheduledAt: daysFromNow(-7, 11, 0),
    notes: 'Discussion package et feuille de route 6 mois.',
    feedback: 'Echange tres positif, offre transmise ensuite.',
    createdAt: daysFromNow(-10, 15, 0),
  },
  {
    id: '60000000-0000-4000-8000-000000000004',
    applicationId: jobApplications[5].id,
    type: 'RH',
    scheduledAt: daysFromNow(3, 9, 30),
    notes: 'Entretien culture et disponibilite.',
    feedback: null,
    createdAt: daysFromNow(-2, 10, 45),
  },
]

const relationships = [
  ...contacts.map((contact) => ({
    id: `70000000-0000-4000-8000-${contact.id.slice(-12)}`,
    relationship: 'Travaille chez',
    fromType: 'CONTACT',
    fromContactId: contact.id,
    toType: 'COMPANY',
    toCompanyId: contact.companyId,
    createdAt: contact.createdAt,
  })),
  ...jobApplications.map((application) => ({
    id: `71000000-0000-4000-8000-${application.id.slice(-12)}`,
    relationship: 'Candidature',
    fromType: 'JOB_APPLICATION',
    fromJobApplicationId: application.id,
    toType: 'COMPANY',
    toCompanyId: application.companyId,
    createdAt: application.appliedAt ?? new Date(),
  })),
  ...freelanceMissions.map((mission) => ({
    id: `72000000-0000-4000-8000-${mission.id.slice(-12)}`,
    relationship: 'Mission freelance',
    fromType: 'FREELANCE_MISSION',
    fromFreelanceMissionId: mission.id,
    toType: 'COMPANY',
    toCompanyId: mission.companyId,
    createdAt: mission.createdAt,
  })),
  ...interviews.map((interview) => ({
    id: `73000000-0000-4000-8000-${interview.id.slice(-12)}`,
    relationship: 'Entretien',
    fromType: 'INTERVIEW',
    fromInterviewId: interview.id,
    toType: 'JOB_APPLICATION',
    toJobApplicationId: interview.applicationId,
    createdAt: interview.createdAt,
  })),
  {
    id: '74000000-0000-4000-8000-000000000001',
    relationship: 'Partenariat',
    fromType: 'COMPANY',
    fromCompanyId: companies[0].id,
    toType: 'COMPANY',
    toCompanyId: companies[1].id,
    createdAt: daysFromNow(-18, 14, 0),
  },
  {
    id: '74000000-0000-4000-8000-000000000002',
    relationship: 'Reseau commun',
    fromType: 'COMPANY',
    fromCompanyId: companies[3].id,
    toType: 'COMPANY',
    toCompanyId: companies[0].id,
    createdAt: daysFromNow(-14, 11, 0),
  },
  {
    id: '74000000-0000-4000-8000-000000000003',
    relationship: 'Collaboration',
    fromType: 'FREELANCE_MISSION',
    fromFreelanceMissionId: freelanceMissions[0].id,
    toType: 'CONTACT',
    toContactId: contacts[1].id,
    createdAt: daysFromNow(-4, 10, 30),
  },
  {
    id: '74000000-0000-4000-8000-000000000004',
    relationship: 'Suivi technique',
    fromType: 'FREELANCE_MISSION',
    fromFreelanceMissionId: freelanceMissions[1].id,
    toType: 'CONTACT',
    toContactId: contacts[2].id,
    createdAt: daysFromNow(-3, 15, 15),
  },
]

async function seed() {
  ensureUuid(seedUserId, 'SEED_USER_ID')

  const authUser = await ensureAuthUser()

  const existingUser = await prisma.user.findFirst({
    where: { email: seedUserEmail },
    orderBy: { createdAt: 'desc' },
  })

  const targetUserId = authUser.id
  const legacyUserId = existingUser && existingUser.id !== targetUserId ? existingUser.id : null

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: targetUserId },
      update: { email: seedUserEmail },
      create: {
        id: targetUserId,
        email: seedUserEmail,
      },
    })

    if (!legacyUserId) {
      return
    }

    await Promise.all([
      tx.jobApplication.updateMany({
        where: { userId: legacyUserId },
        data: { userId: targetUserId },
      }),
      tx.freelanceMission.updateMany({
        where: { userId: legacyUserId },
        data: { userId: targetUserId },
      }),
      tx.contacts.updateMany({
        where: { userId: legacyUserId },
        data: { userId: targetUserId },
      }),
      tx.interviews.updateMany({
        where: { userId: legacyUserId },
        data: { userId: targetUserId },
      }),
      tx.relationship.updateMany({
        where: { userId: legacyUserId },
        data: { userId: targetUserId },
      }),
    ])

    await tx.user.delete({
      where: { id: legacyUserId },
    })
  })

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: {
        name: company.name,
        website: company.website,
        linkedin: company.linkedin,
      },
      create: company,
    })
  }

  for (const application of jobApplications) {
    await prisma.jobApplication.upsert({
      where: { id: application.id },
      update: {
        userId: targetUserId,
        companyId: application.companyId,
        position: application.position,
        status: application.status,
        appliedAt: application.appliedAt,
        notes: application.notes,
        createdAt: application.appliedAt,
      },
      create: {
        id: application.id,
        userId: targetUserId,
        companyId: application.companyId,
        position: application.position,
        status: application.status,
        appliedAt: application.appliedAt,
        notes: application.notes,
        createdAt: application.appliedAt,
      },
    })
  }

  for (const mission of freelanceMissions) {
    await prisma.freelanceMission.upsert({
      where: { id: mission.id },
      update: {
        userId: targetUserId,
        companyId: mission.companyId,
        title: mission.title,
        status: mission.status,
        budget: mission.budget,
        startDate: mission.startDate,
        endDate: mission.endDate,
        notes: mission.notes,
        createdAt: mission.createdAt,
      },
      create: {
        id: mission.id,
        userId: targetUserId,
        companyId: mission.companyId,
        title: mission.title,
        status: mission.status,
        budget: mission.budget,
        startDate: mission.startDate,
        endDate: mission.endDate,
        notes: mission.notes,
        createdAt: mission.createdAt,
      },
    })
  }

  for (const contact of contacts) {
    await prisma.contacts.upsert({
      where: { id: contact.id },
      update: {
        userId: targetUserId,
        companyId: contact.companyId,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        linkedin: contact.linkedin,
        createdAt: contact.createdAt,
      },
      create: {
        id: contact.id,
        userId: targetUserId,
        companyId: contact.companyId,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        linkedin: contact.linkedin,
        createdAt: contact.createdAt,
      },
    })
  }

  for (const interview of interviews) {
    await prisma.interviews.upsert({
      where: { id: interview.id },
      update: {
        userId: targetUserId,
        applicationId: interview.applicationId,
        type: interview.type,
        scheduledAt: interview.scheduledAt,
        notes: interview.notes,
        feedback: interview.feedback,
        createdAt: interview.createdAt,
      },
      create: {
        id: interview.id,
        userId: targetUserId,
        applicationId: interview.applicationId,
        type: interview.type,
        scheduledAt: interview.scheduledAt,
        notes: interview.notes,
        feedback: interview.feedback,
        createdAt: interview.createdAt,
      },
    })
  }

  for (const relationship of relationships) {
    await prisma.relationship.upsert({
      where: { id: relationship.id },
      update: {
        userId: targetUserId,
        relationship: relationship.relationship,
        fromType: relationship.fromType,
        toType: relationship.toType,
        fromCompanyId: relationship.fromCompanyId ?? null,
        fromContactId: relationship.fromContactId ?? null,
        fromJobApplicationId: relationship.fromJobApplicationId ?? null,
        fromFreelanceMissionId: relationship.fromFreelanceMissionId ?? null,
        fromInterviewId: relationship.fromInterviewId ?? null,
        toCompanyId: relationship.toCompanyId ?? null,
        toContactId: relationship.toContactId ?? null,
        toJobApplicationId: relationship.toJobApplicationId ?? null,
        toFreelanceMissionId: relationship.toFreelanceMissionId ?? null,
        toInterviewId: relationship.toInterviewId ?? null,
        createdAt: relationship.createdAt,
      },
      create: {
        id: relationship.id,
        userId: targetUserId,
        relationship: relationship.relationship,
        fromType: relationship.fromType,
        toType: relationship.toType,
        fromCompanyId: relationship.fromCompanyId ?? null,
        fromContactId: relationship.fromContactId ?? null,
        fromJobApplicationId: relationship.fromJobApplicationId ?? null,
        fromFreelanceMissionId: relationship.fromFreelanceMissionId ?? null,
        fromInterviewId: relationship.fromInterviewId ?? null,
        toCompanyId: relationship.toCompanyId ?? null,
        toContactId: relationship.toContactId ?? null,
        toJobApplicationId: relationship.toJobApplicationId ?? null,
        toFreelanceMissionId: relationship.toFreelanceMissionId ?? null,
        toInterviewId: relationship.toInterviewId ?? null,
        createdAt: relationship.createdAt,
      },
    })
  }

  console.log('Seed completed successfully.')
  console.log(`User: ${seedUserProfile.fullName} <${seedUserEmail}> (${targetUserId})`)
  console.log(`Password: ${seedUserPassword}`)
  console.log(`Companies: ${companies.length}`)
  console.log(`Job applications: ${jobApplications.length}`)
  console.log(`Freelance missions: ${freelanceMissions.length}`)
  console.log(`Contacts: ${contacts.length}`)
  console.log(`Interviews: ${interviews.length}`)
  console.log(`Relationships: ${relationships.length}`)
}

seed()
  .catch((error) => {
    console.error('Seed failed.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
