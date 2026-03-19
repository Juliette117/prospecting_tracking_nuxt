import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'

export type AuthenticatedAppUser = {
  id: string
  email: string
}

export const requireAuthenticatedAppUser = async (event: H3Event): Promise<AuthenticatedAppUser> => {
  const authorizationHeader = getHeader(event, 'authorization')
  const bearerToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length).trim()
    : ''

  let authUserId = ''
  let authUserEmail = ''

  // Les pages front appellent souvent nos routes avec un Bearer token explicite.
  // Si ce token n'est pas present, on retombe sur la session Supabase cote serveur.
  if (bearerToken) {
    const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabasePublishableKey = process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabasePublishableKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase client configuration is missing.',
      })
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.getUser(bearerToken)

    if (error || !data.user?.id || !data.user.email) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Utilisateur non authentifie.',
      })
    }

    authUserId = data.user.id
    authUserEmail = data.user.email
  } else {
    const authUser = await serverSupabaseUser(event)

    authUserId = authUser?.id ?? authUser?.sub ?? ''
    authUserEmail = typeof authUser?.email === 'string' ? authUser.email : ''
  }

  if (!authUserId || authUserEmail.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Utilisateur non authentifie.',
    })
  }

  return {
    id: authUserId,
    email: authUserEmail,
  }
}
