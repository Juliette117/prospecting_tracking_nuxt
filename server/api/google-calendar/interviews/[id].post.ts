import { createError, getRouterParam } from 'h3'
import { requireAuthenticatedAppUser } from '../../../utils/auth-user'
import { syncInterviewWithGoogleCalendar } from '../../../utils/google-calendar'
import { getInterviewsPayload } from '../../../utils/interviews'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const interviewId = getRouterParam(event, 'id')

  if (!interviewId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant d entretien manquant.',
    })
  }

  try {
    await syncInterviewWithGoogleCalendar(authUser.id, interviewId)
    return await getInterviewsPayload(authUser.id, authUser.email)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Erreur lors de la synchronisation Google Calendar :', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de synchroniser l entretien avec Google Calendar.',
    })
  }
})
