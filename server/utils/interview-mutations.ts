import { createError } from 'h3'
import { z } from 'zod'

const optionalLongText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform(value => {
    const trimmedValue = value?.trim() ?? ''
    return trimmedValue.length > 0 ? trimmedValue : null
  })

export const interviewInputSchema = z.object({
  applicationId: z.string().uuid('Candidature invalide.'),
  type: z.string().trim().min(2, 'Le type d\'entretien est requis.').max(80),
  scheduledAt: z
    .string()
    .trim()
    .min(1, 'La date et l\'heure sont requises.')
    .superRefine((value, ctx) => {
      const parsedDate = new Date(value)

      if (Number.isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Date et heure invalides.',
        })
      }
    })
    // On transforme directement en Date pour que les handlers et Prisma
    // manipulent un type unique des la sortie de la validation.
    .transform(value => new Date(value)),
  notes: optionalLongText,
  feedback: optionalLongText,
})

export type InterviewInput = z.infer<typeof interviewInputSchema>

export const parseInterviewInput = (body: unknown): InterviewInput => {
  const result = interviewInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? 'Donnees invalides.',
    })
  }

  return result.data
}
