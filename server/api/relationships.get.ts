import { createError } from 'h3'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { getRelationshipGraphPayload } from '../utils/relationships'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)

  try {
    return await getRelationshipGraphPayload(authUser.id, authUser.email)
  } catch (dbError) {
    console.error('Erreur lors du chargement du graphe de relations :', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la communication avec la base de donnees.',
    })
  }
})
