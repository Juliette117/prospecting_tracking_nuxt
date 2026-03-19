import { createError, readBody, setResponseStatus } from 'h3'
import { prisma } from '../utils/prisma'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { parseInterviewInput } from '../utils/interview-mutations'
import { getInterviewsPayload } from '../utils/interviews'
import { syncInterviewApplicationRelationship } from '../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const body = await readBody(event)
  const input = parseInterviewInput(body)

  try {
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id: input.applicationId,
        userId: authUser.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingApplication) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Candidature introuvable pour cet entretien.',
      })
    }

    const interview = await prisma.interviews.create({
      data: {
        userId: authUser.id,
        applicationId: input.applicationId,
        type: input.type,
        scheduledAt: input.scheduledAt,
        notes: input.notes,
        feedback: input.feedback,
      },
    })

    await syncInterviewApplicationRelationship({
      userId: authUser.id,
      interviewId: interview.id,
      applicationId: input.applicationId,
    })

    setResponseStatus(event, 201)

    return await getInterviewsPayload(authUser.id, authUser.email)
  } catch (dbError) {
    if (dbError && typeof dbError === 'object' && 'statusCode' in dbError) {
      throw dbError
    }

    console.error("Erreur lors de la creation d'un entretien :", dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de creer l\'entretien.',
    })
  }
})
