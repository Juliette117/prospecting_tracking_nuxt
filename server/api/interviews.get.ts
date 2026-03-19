import { createError } from 'h3'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { getInterviewsPayload } from '../utils/interviews'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)

  try {
    return await getInterviewsPayload(authUser.id, authUser.email)
  } catch (dbError) {
    console.error('Erreur lors du chargement des entretiens :', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la communication avec la base de donnees.',
    })
  }
})
