import { createError } from 'h3'
import { requireAuthenticatedAppUser } from '../utils/auth-user'
import { getFreelancePayload } from '../utils/freelance'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthenticatedAppUser(event)

  try {
    return await getFreelancePayload(authUser.id, authUser.email)
  } catch (dbError) {
    console.error('Erreur lors du chargement des missions freelance :', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la communication avec la base de donnees.',
    })
  }
})
