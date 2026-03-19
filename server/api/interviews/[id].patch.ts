import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { parseInterviewInput } from '../../utils/interview-mutations'
import { getInterviewsPayload } from '../../utils/interviews'
import { syncInterviewApplicationRelationship } from '../../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const interviewId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!interviewId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant d\'entretien manquant.',
    })
  }

  const input = parseInterviewInput(body)

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

    const targetApplication = await prisma.jobApplication.findFirst({
      where: {
        id: input.applicationId,
        userId: authUser.id,
      },
      select: {
        id: true,
      },
    })

    if (!targetApplication) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Candidature introuvable pour cet entretien.',
      })
    }

    await prisma.interviews.update({
      where: {
        id: interviewId,
      },
      data: {
        applicationId: input.applicationId,
        type: input.type,
        scheduledAt: input.scheduledAt,
        notes: input.notes,
        feedback: input.feedback,
      },
    })

    await syncInterviewApplicationRelationship({
      userId: authUser.id,
      interviewId,
      applicationId: input.applicationId,
    })

    return await getInterviewsPayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la mise a jour d'un entretien :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de mettre a jour l\'entretien.',
    })
  }
})
