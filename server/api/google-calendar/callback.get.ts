import { createError, getQuery, sendRedirect } from 'h3'
import {
  getGoogleCalendarFailureRedirect,
  handleGoogleCalendarCallback,
} from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''

  if (!code || !state) {
    return sendRedirect(event, getGoogleCalendarFailureRedirect(event))
  }

  try {
    return await handleGoogleCalendarCallback(event, code, state)
  } catch (error) {
    console.error('Erreur lors du callback Google Calendar :', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      return sendRedirect(event, getGoogleCalendarFailureRedirect(event))
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de traiter le callback Google Calendar.',
    })
  }
})
