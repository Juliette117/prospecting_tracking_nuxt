import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { getInterviewsPayload } from '../../utils/interviews'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const interviewId = getRouterParam(event, 'id')

  if (!interviewId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant d\'entretien manquant.',
    })
  }

  try {
    const existingInterview = await prisma.interviews.findFirst({
      where: {
        id: interviewId,
        userId: authUser.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingInterview) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Entretien introuvable.',
      })
    }

    await prisma.interviews.delete({
      where: {
        id: interviewId,
      },
    })

    return await getInterviewsPayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la suppression d'un entretien :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de supprimer l\'entretien.',
    })
  }
})
