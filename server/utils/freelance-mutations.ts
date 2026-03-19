import { createError } from 'h3'
import { z } from 'zod'

const optionalTrimmedString = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform(value => {
    const trimmedValue = value?.trim() ?? ''
    return trimmedValue.length > 0 ? trimmedValue : null
  })

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    const trimmedValue = value?.trim() ?? ''

    if (trimmedValue.length === 0) {
      return
    }

    try {
      new URL(trimmedValue)
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'URL invalide',
      })
    }
  })
  .transform(value => value?.trim() || null)

const optionalDate = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    const trimmedValue = value?.trim() ?? ''

    if (trimmedValue.length === 0) {
      return
    }

    const parsedDate = new Date(`${trimmedValue}T12:00:00.000Z`)

    if (Number.isNaN(parsedDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date invalide',
      })
    }
  })
  .transform((value) => {
    const trimmedValue = value?.trim() ?? ''

    if (trimmedValue.length === 0) {
      return null
    }

    return new Date(`${trimmedValue}T12:00:00.000Z`)
  })

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    const trimmedValue = value?.trim() ?? ''

    if (trimmedValue.length === 0) {
      return
    }

    const emailResult = z.email().safeParse(trimmedValue)

    if (!emailResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email invalide',
      })
    }
  })
  .transform(value => value?.trim() || null)

const optionalBudget = z
  .union([z.number(), z.string()])
  .optional()
  .superRefine((value, ctx) => {
    const normalizedValue = typeof value === 'string' ? value.trim() : value

    if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
      return
    }

    const parsedValue = typeof normalizedValue === 'number' ? normalizedValue : Number(normalizedValue)

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Budget invalide',
      })
    }
  })
  .transform((value) => {
    const normalizedValue = typeof value === 'string' ? value.trim() : value

    if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
      return null
    }

    const parsedValue = typeof normalizedValue === 'number' ? normalizedValue : Number(normalizedValue)
    return Math.round(parsedValue)
  })

// Ce schema sert de "porte d'entree" aux donnees venant du formulaire.
// Tout ce qui entre dans l'API est nettoye et verifie ici avant Prisma.
export const freelanceMissionInputSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  companyWebsite: optionalUrl,
  companyLinkedin: optionalUrl,
  title: z.string().trim().min(2).max(160),
  status: z.string().trim().min(2).max(80),
  budget: optionalBudget,
  startDate: optionalDate,
  endDate: optionalDate,
  notes: z.string().trim().max(2000).optional().transform(value => value?.trim() || null),
  contactName: optionalTrimmedString,
  contactRole: optionalTrimmedString,
  contactEmail: optionalEmail,
  contactLinkedin: optionalUrl,
})
  .superRefine((value, ctx) => {
    const hasContactDetails = [
      value.contactName,
      value.contactRole,
      value.contactEmail,
      value.contactLinkedin,
    ].some(Boolean)

    if (hasContactDetails && !value.contactName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactName'],
        message: 'Le nom du contact est requis si vous renseignez ses informations.',
      })
    }

    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'La date de fin doit etre posterieure a la date de debut.',
      })
    }
  })

export type FreelanceMissionInput = z.infer<typeof freelanceMissionInputSchema>

export const parseFreelanceMissionInput = (body: unknown): FreelanceMissionInput => {
  const result = freelanceMissionInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? 'Donnees invalides.',
    })
  }

  return result.data
}
