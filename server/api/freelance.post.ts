import { createError, readBody, setResponseStatus } from 'h3'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { getFreelancePayload } from '../utils/freelance'
import { parseFreelanceMissionInput } from '../utils/freelance-mutations'
import { findOrCreateCompany, syncPrimaryContact } from '../utils/job-search-mutations'
import { prisma } from '../utils/prisma'
import { syncFreelanceMissionCompanyRelationship } from '../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const body = await readBody(event)
  const input = parseFreelanceMissionInput(body)

  try {
    const company = await findOrCreateCompany(
      input.companyName,
      input.companyWebsite,
      input.companyLinkedin,
    )

    const mission = await prisma.freelanceMission.create({
      data: {
        userId: authUser.id,
        companyId: company.id,
        title: input.title,
        status: input.status,
        budget: input.budget,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
      },
    })

    await syncFreelanceMissionCompanyRelationship({
      userId: authUser.id,
      missionId: mission.id,
      companyId: company.id,
    })

    await syncPrimaryContact({
      userId: authUser.id,
      companyId: company.id,
      contactName: input.contactName,
      contactRole: input.contactRole,
      contactEmail: input.contactEmail,
      contactLinkedin: input.contactLinkedin,
    })

    setResponseStatus(event, 201)
    return await getFreelancePayload(authUser.id, authUser.email)
  } catch (dbError) {
    console.error("Erreur lors de la creation d'une mission freelance :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de creer la mission freelance.',
    })
  }
})
