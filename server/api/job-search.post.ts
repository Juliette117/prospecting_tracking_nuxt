import { createError, readBody, setResponseStatus } from 'h3'
import { prisma } from '../utils/prisma'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { getJobSearchPayload } from '../utils/job-search'
import {
  findOrCreateCompany,
  parseJobApplicationInput,
  syncPrimaryContact,
} from '../utils/job-search-mutations'
import { syncJobApplicationCompanyRelationship } from '../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const body = await readBody(event)
  const input = parseJobApplicationInput(body)

  try {
    const company = await findOrCreateCompany(
      input.companyName,
      input.companyWebsite,
      input.companyLinkedin,
    )

    const application = await prisma.jobApplication.create({
      data: {
        userId: authUser.id,
        companyId: company.id,
        position: input.position,
        status: input.status,
        appliedAt: input.appliedAt,
        notes: input.notes,
      },
    })

    await syncJobApplicationCompanyRelationship({
      userId: authUser.id,
      applicationId: application.id,
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

    return await getJobSearchPayload(authUser.id, authUser.email)
  } catch (dbError) {
    console.error("Erreur lors de la creation d'une candidature :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de creer la candidature.',
    })
  }
})
