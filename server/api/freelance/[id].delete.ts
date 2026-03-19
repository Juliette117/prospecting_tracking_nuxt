import { createError, getRouterParam } from 'h3'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { getFreelancePayload } from '../../utils/freelance'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const missionId = getRouterParam(event, 'id')

  if (!missionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant de mission manquant.',
    })
  }

  try {
    const existingMission = await prisma.freelanceMission.findFirst({
      where: {
        id: missionId,
        userId: authUser.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingMission) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Mission introuvable.',
      })
    }

    await prisma.freelanceMission.delete({
      where: {
        id: missionId,
      },
    })

    return await getFreelancePayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la suppression d'une mission freelance :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de supprimer la mission freelance.',
    })
  }
})
