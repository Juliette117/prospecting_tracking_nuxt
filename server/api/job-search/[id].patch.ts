import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { getJobSearchPayload } from '../../utils/job-search'
import {
  findOrCreateCompany,
  isSameCompanyName,
  parseJobApplicationInput,
  syncPrimaryContact,
} from '../../utils/job-search-mutations'
import { syncJobApplicationCompanyRelationship } from '../../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const applicationId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!applicationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant de candidature manquant.',
    })
  }

  const input = parseJobApplicationInput(body)

  try {
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId: authUser.id,
      },
      include: {
        company: true,
      },
    })

    if (!existingApplication) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Candidature introuvable.',
      })
    }

    const targetCompany = isSameCompanyName(existingApplication.company.name, input.companyName)
      ? await prisma.company.update({
          where: {
            id: existingApplication.companyId,
          },
          data: {
            name: input.companyName,
            website: input.companyWebsite,
            linkedin: input.companyLinkedin,
          },
        })
      : await findOrCreateCompany(
          input.companyName,
          input.companyWebsite,
          input.companyLinkedin,
        )

    await prisma.jobApplication.update({
      where: {
        id: existingApplication.id,
      },
      data: {
        companyId: targetCompany.id,
        position: input.position,
        status: input.status,
        appliedAt: input.appliedAt,
        notes: input.notes,
      },
    })

    await syncJobApplicationCompanyRelationship({
      userId: authUser.id,
      applicationId: existingApplication.id,
      companyId: targetCompany.id,
    })

    await syncPrimaryContact({
      userId: authUser.id,
      companyId: targetCompany.id,
      contactName: input.contactName,
      contactRole: input.contactRole,
      contactEmail: input.contactEmail,
      contactLinkedin: input.contactLinkedin,
    })

    return await getJobSearchPayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la mise a jour d'une candidature :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de mettre a jour la candidature.',
    })
  }
})
