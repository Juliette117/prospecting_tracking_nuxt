import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  email: z.string().trim().email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsedBody = registerSchema.safeParse(body)

  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid registration payload.',
    })
  }

  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.NUXT_SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase server configuration is missing.',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.admin.createUser({
    email: parsedBody.data.email,
    password: parsedBody.data.password,
    email_confirm: true,
    user_metadata: {
      firstName: parsedBody.data.firstName,
    },
  })

  if (error) {
    throw createError({
      statusCode: error.status ?? 400,
      statusMessage: error.message,
      data: {
        code: error.code,
      },
    })
  }

  if (!data.user?.id || !data.user.email) {
    throw createError({
      statusCode: 500,
      statusMessage: 'User creation response is incomplete.',
    })
  }

  try {
    await prisma.user.upsert({
      where: {
        id: data.user.id,
      },
      update: {
        email: data.user.email,
      },
      create: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch {
    await supabase.auth.admin.deleteUser(data.user.id)

    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to synchronize application user.',
    })
  }

  return {
    ok: true,
  }
})
