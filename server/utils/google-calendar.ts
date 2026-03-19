import crypto from 'node:crypto'
import { createError, getRequestURL, sendRedirect } from 'h3'
import type { H3Event } from 'h3'
import { isGoogleCalendarSchemaAvailable } from './google-calendar-schema'
import { prisma } from './prisma'

const GOOGLE_CALENDAR_PROVIDER = 'google-calendar'
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000
const GOOGLE_EVENT_DURATION_MS = 60 * 60 * 1000

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
}

type GoogleCalendarEventResponse = {
  id?: string
  htmlLink?: string
  error?: {
    message?: string
  }
}

type GoogleCalendarConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export const isGoogleCalendarConfigured = () => {
  const runtimeConfig = useRuntimeConfig()
  const clientId = String(runtimeConfig.googleCalendarClientId ?? '').trim()
  const clientSecret = String(runtimeConfig.googleCalendarClientSecret ?? '').trim()
  const redirectUri = String(runtimeConfig.googleCalendarRedirectUri ?? '').trim()

  return Boolean(clientId && clientSecret && redirectUri)
}

const getGoogleCalendarConfig = (): GoogleCalendarConfig => {
  const runtimeConfig = useRuntimeConfig()
  const clientId = String(runtimeConfig.googleCalendarClientId ?? '').trim()
  const clientSecret = String(runtimeConfig.googleCalendarClientSecret ?? '').trim()
  const redirectUri = String(runtimeConfig.googleCalendarRedirectUri ?? '').trim()

  if (!clientId || !clientSecret || !redirectUri) {
    throw createCalendarError(
      500,
      'La configuration Google Calendar est incomplete.',
      'Ajoutez GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET et GOOGLE_CALENDAR_REDIRECT_URI.',
    )
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  }
}

const createCalendarError = (statusCode: number, statusMessage: string, detail?: string) =>
  createError({
    statusCode,
    statusMessage,
    data: detail ? { detail } : undefined,
  })

const assertGoogleCalendarSchemaAvailable = async () => {
  if (await isGoogleCalendarSchemaAvailable()) {
    return
  }

  throw createCalendarError(
    503,
    'La migration Google Calendar Prisma n est pas appliquee.',
    'Appliquez les migrations Prisma pour activer la synchronisation Google Calendar.',
  )
}

const buildAbsoluteReturnUrl = (event: H3Event, returnTo: string) => {
  const requestUrl = getRequestURL(event)
  return new URL(returnTo, requestUrl.origin).toString()
}

const buildReturnPath = (returnTo: string, status: 'connected' | 'error') => {
  const returnUrl = new URL(returnTo, 'http://localhost')
  returnUrl.searchParams.set('googleCalendar', status)
  return `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`
}

const getSafeReturnTo = (value: unknown) => {
  if (typeof value !== 'string') {
    return '/entretiens'
  }

  return value.startsWith('/') ? value : '/entretiens'
}

const cleanupExpiredStates = async () => {
  await prisma.googleOAuthState.deleteMany({
    where: {
      provider: GOOGLE_CALENDAR_PROVIDER,
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}

export const createGoogleCalendarAuthorizationUrl = async (
  userId: string,
  returnTo: string,
) => {
  await assertGoogleCalendarSchemaAvailable()

  const { clientId, redirectUri } = getGoogleCalendarConfig()
  const state = crypto.randomBytes(24).toString('hex')

  // L'etat OAuth est stocke en base pour relier le retour de Google
  // a l'utilisateur courant et au chemin depuis lequel il a lance l'action.
  await cleanupExpiredStates()

  await prisma.googleOAuthState.create({
    data: {
      state,
      provider: GOOGLE_CALENDAR_PROVIDER,
      userId,
      returnTo,
      expiresAt: new Date(Date.now() + GOOGLE_OAUTH_STATE_TTL_MS),
    },
  })

  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorizationUrl.searchParams.set('client_id', clientId)
  authorizationUrl.searchParams.set('redirect_uri', redirectUri)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('scope', GOOGLE_CALENDAR_SCOPE)
  authorizationUrl.searchParams.set('access_type', 'offline')
  authorizationUrl.searchParams.set('prompt', 'consent')
  authorizationUrl.searchParams.set('include_granted_scopes', 'true')
  authorizationUrl.searchParams.set('state', state)

  return authorizationUrl.toString()
}

const exchangeAuthorizationCode = async (code: string) => {
  const { clientId, clientSecret, redirectUri } = getGoogleCalendarConfig()

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const payload = await response.json() as GoogleTokenResponse

  if (!response.ok || !payload.access_token) {
    throw createCalendarError(
      502,
      'Impossible de finaliser la connexion Google Calendar.',
      payload.error_description ?? payload.error ?? 'Reponse OAuth invalide.',
    )
  }

  return payload
}

const refreshAccessToken = async (refreshToken: string) => {
  const { clientId, clientSecret } = getGoogleCalendarConfig()

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const payload = await response.json() as GoogleTokenResponse

  if (!response.ok || !payload.access_token) {
    throw createCalendarError(
      response.status === 401 || response.status === 403 ? 401 : 502,
      'La connexion Google Calendar a expire ou a ete refusee.',
      payload.error_description ?? payload.error ?? 'Impossible de rafraichir le token Google.',
    )
  }

  return payload
}

const getConnectionAccessToken = async (userId: string) => {
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: {
      userId,
    },
  })

  if (!connection) {
    throw createCalendarError(404, 'Google Calendar n est pas connecte pour cet utilisateur.')
  }

  if (
    connection.accessToken &&
    connection.expiresAt &&
    connection.expiresAt.getTime() > Date.now() + 60_000
  ) {
    // Si le token est encore valable, on l'utilise tel quel pour eviter
    // un aller-retour OAuth supplementaire.
    return connection.accessToken
  }

  const refreshedToken = await refreshAccessToken(connection.refreshToken)
  const expiresAt = refreshedToken.expires_in
    ? new Date(Date.now() + refreshedToken.expires_in * 1000)
    : null

  await prisma.googleCalendarConnection.update({
    where: {
      userId,
    },
    data: {
      accessToken: refreshedToken.access_token,
      tokenType: refreshedToken.token_type ?? connection.tokenType,
      scope: refreshedToken.scope ?? connection.scope,
      expiresAt,
    },
  })

  return refreshedToken.access_token
}

const buildInterviewEventPayload = (interview: {
  companyName: string
  position: string
  type: string
  scheduledAt: Date
  notes: string | null
  primaryContact: {
    name: string
    role: string | null
    email: string | null
  } | null
}) => {
  // Google Calendar attend un format d'evenement specifique.
  // On reconstruit ici ce format a partir de notre modele interne "Interview".
  const endDate = new Date(interview.scheduledAt.getTime() + GOOGLE_EVENT_DURATION_MS)
  const descriptionParts = [
    `Poste : ${interview.position}`,
    `Type : ${interview.type}`,
    interview.primaryContact
      ? `Contact : ${interview.primaryContact.name}${interview.primaryContact.role ? ` (${interview.primaryContact.role})` : ''}`
      : '',
    interview.primaryContact?.email ? `Email : ${interview.primaryContact.email}` : '',
    interview.notes ? `Preparation : ${interview.notes}` : '',
  ].filter(Boolean)

  return {
    summary: `${interview.companyName} - Entretien ${interview.type}`,
    description: descriptionParts.join('\n'),
    start: {
      dateTime: interview.scheduledAt.toISOString(),
    },
    end: {
      dateTime: endDate.toISOString(),
    },
  }
}

const upsertCalendarEvent = async (
  accessToken: string,
  interview: {
    googleCalendarEventId: string | null
    companyName: string
    position: string
    type: string
    scheduledAt: Date
    notes: string | null
    primaryContact: {
      name: string
      role: string | null
      email: string | null
    } | null
  },
) => {
  const eventBody = buildInterviewEventPayload(interview)
  const hasExistingEvent = Boolean(interview.googleCalendarEventId)
  const endpoint = hasExistingEvent
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(interview.googleCalendarEventId!)}`
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

  const response = await fetch(endpoint, {
    method: hasExistingEvent ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  })

  const payload = await response.json() as GoogleCalendarEventResponse

  if (!response.ok || !payload.id) {
    throw createCalendarError(
      response.status === 401 || response.status === 403 ? 401 : 502,
      'Impossible de synchroniser l entretien avec Google Calendar.',
      payload.error?.message ?? 'Reponse Google Calendar invalide.',
    )
  }

  return payload
}

export const handleGoogleCalendarCallback = async (
  event: H3Event,
  code: string,
  state: string,
) => {
  await assertGoogleCalendarSchemaAvailable()

  const oauthState = await prisma.googleOAuthState.findUnique({
    where: {
      state,
    },
  })

  if (
    !oauthState ||
    oauthState.provider !== GOOGLE_CALENDAR_PROVIDER ||
    oauthState.expiresAt.getTime() < Date.now()
  ) {
    throw createCalendarError(400, 'La demande de connexion Google Calendar a expire.')
  }

  await prisma.googleOAuthState.delete({
    where: {
      state,
    },
  })

  const tokenPayload = await exchangeAuthorizationCode(code)
  const existingConnection = await prisma.googleCalendarConnection.findUnique({
    where: {
      userId: oauthState.userId,
    },
  })

  if (!tokenPayload.refresh_token && !existingConnection?.refreshToken) {
    throw createCalendarError(
      502,
      'Google n a pas fourni de refresh token. Recommencez la connexion en reautorisant l acces.',
    )
  }

  await prisma.googleCalendarConnection.upsert({
    where: {
      userId: oauthState.userId,
    },
    update: {
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? existingConnection?.refreshToken ?? '',
      tokenType: tokenPayload.token_type ?? null,
      scope: tokenPayload.scope ?? null,
      expiresAt: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : null,
    },
    create: {
      userId: oauthState.userId,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? '',
      tokenType: tokenPayload.token_type ?? null,
      scope: tokenPayload.scope ?? null,
      expiresAt: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : null,
    },
  })

  const successReturnPath = buildReturnPath(oauthState.returnTo, 'connected')
  return sendRedirect(event, buildAbsoluteReturnUrl(event, successReturnPath))
}

export const disconnectGoogleCalendar = async (userId: string) => {
  await assertGoogleCalendarSchemaAvailable()

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: {
      userId,
    },
  })

  if (!connection) {
    return
  }

  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: connection.refreshToken,
      }),
    })
  } catch (error) {
    console.warn('Revocation Google Calendar ignoree :', error)
  }

  await prisma.googleCalendarConnection.delete({
    where: {
      userId,
    },
  })
}

export const syncInterviewWithGoogleCalendar = async (userId: string, interviewId: string) => {
  await assertGoogleCalendarSchemaAvailable()

  const interview = await prisma.interviews.findFirst({
    where: {
      id: interviewId,
      userId,
    },
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      notes: true,
      googleCalendarEventId: true,
      application: {
        select: {
          companyId: true,
          position: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!interview) {
    throw createCalendarError(404, 'Entretien introuvable.')
  }

  const primaryContact = await prisma.contacts.findFirst({
    where: {
      userId,
      companyId: interview.application.companyId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      name: true,
      role: true,
      email: true,
    },
  })

  let accessToken = await getConnectionAccessToken(userId)
  let payload: GoogleCalendarEventResponse

  try {
    payload = await upsertCalendarEvent(accessToken, {
      googleCalendarEventId: interview.googleCalendarEventId,
      companyName: interview.application.company.name,
      position: interview.application.position,
      type: interview.type,
      scheduledAt: interview.scheduledAt,
      notes: interview.notes,
      primaryContact,
    })
  } catch (error: any) {
    if (error?.statusCode !== 401) {
      throw error
    }

    const connection = await prisma.googleCalendarConnection.findUnique({
      where: {
        userId,
      },
    })

    if (!connection) {
      throw error
    }

    const refreshedToken = await refreshAccessToken(connection.refreshToken)
    const expiresAt = refreshedToken.expires_in
      ? new Date(Date.now() + refreshedToken.expires_in * 1000)
      : null

    await prisma.googleCalendarConnection.update({
      where: {
        userId,
      },
      data: {
        accessToken: refreshedToken.access_token,
        tokenType: refreshedToken.token_type ?? connection.tokenType,
        scope: refreshedToken.scope ?? connection.scope,
        expiresAt,
      },
    })

    accessToken = refreshedToken.access_token
    payload = await upsertCalendarEvent(accessToken, {
      googleCalendarEventId: interview.googleCalendarEventId,
      companyName: interview.application.company.name,
      position: interview.application.position,
      type: interview.type,
      scheduledAt: interview.scheduledAt,
      notes: interview.notes,
      primaryContact,
    })
  }

  await prisma.interviews.update({
    where: {
      id: interview.id,
    },
    data: {
      googleCalendarEventId: payload.id,
      googleCalendarEventUrl: payload.htmlLink ?? null,
      googleCalendarSyncedAt: new Date(),
    },
  })
}

export const getGoogleCalendarFailureRedirect = (event: H3Event, returnTo = '/entretiens') =>
  buildAbsoluteReturnUrl(event, buildReturnPath(getSafeReturnTo(returnTo), 'error'))

export const getSafeGoogleCalendarReturnTo = getSafeReturnTo
