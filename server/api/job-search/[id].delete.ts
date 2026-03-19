import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { getJobSearchPayload } from '../../utils/job-search'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const applicationId = getRouterParam(event, 'id')

  if (!applicationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant de candidature manquant.',
    })
  }

  try {
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId: authUser.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingApplication) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Candidature introuvable.',
      })
    }

    await prisma.$transaction([
      prisma.interviews.deleteMany({
        where: {
          applicationId,
          userId: authUser.id,
        },
      }),
      prisma.jobApplication.delete({
        where: {
          id: applicationId,
        },
      }),
    ])

    return await getJobSearchPayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la suppression d'une candidature :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de supprimer la candidature.',
    })
  }
})
