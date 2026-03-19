import { createError } from 'h3'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { getJobSearchPayload } from '../utils/job-search'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)

  try {
    return await getJobSearchPayload(authUser.id, authUser.email)
  } catch (dbError) {
    console.error('Erreur lors des requêtes Prisma sur les candidatures :', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la communication avec la base de donnees.',
    })
  }
})
