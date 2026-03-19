import { createError } from 'h3'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import { disconnectGoogleCalendar } from '../../utils/google-calendar'
import { getInterviewsPayload } from '../../utils/interviews'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)

  try {
    await disconnectGoogleCalendar(authUser.id)
    return await getInterviewsPayload(authUser.id, authUser.email)
  } catch (error) {
    console.error('Erreur lors de la deconnexion Google Calendar :', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de deconnecter Google Calendar.',
    })
  }
})
