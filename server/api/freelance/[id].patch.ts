import { createError, getRouterParam, readBody } from 'h3'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { getFreelancePayload } from '../../utils/freelance'
import { parseFreelanceMissionInput } from '../../utils/freelance-mutations'
import { findOrCreateCompany, isSameCompanyName, syncPrimaryContact } from '../../utils/job-search-mutations'
import { prisma } from '../../utils/prisma'
import { syncFreelanceMissionCompanyRelationship } from '../../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const missionId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!missionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant de mission manquant.',
    })
  }

  const input = parseFreelanceMissionInput(body)

  try {
    const existingMission = await prisma.freelanceMission.findFirst({
      where: {
        id: missionId,
        userId: authUser.id,
      },
      include: {
        company: true,
      },
    })

    if (!existingMission) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Mission introuvable.',
      })
    }

    const targetCompany = isSameCompanyName(existingMission.company.name, input.companyName)
      ? await prisma.company.update({
          where: {
            id: existingMission.companyId,
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

    await prisma.freelanceMission.update({
      where: {
        id: existingMission.id,
      },
      data: {
        companyId: targetCompany.id,
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
      missionId: existingMission.id,
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

    return await getFreelancePayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la mise a jour d'une mission freelance :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de mettre a jour la mission freelance.',
    })
  }
})
