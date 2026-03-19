import { readBody } from 'h3'
import { requireAuthenticatedAppUser } from '../../utils/auth-user'
import {
  createGoogleCalendarAuthorizationUrl,
  getSafeGoogleCalendarReturnTo,
} from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)
  const body = await readBody(event).catch(() => ({}))
  const returnTo = getSafeGoogleCalendarReturnTo((body as { returnTo?: unknown })?.returnTo)
  const authorizationUrl = await createGoogleCalendarAuthorizationUrl(authUser.id, returnTo)

  return {
    authorizationUrl,
  }
})
