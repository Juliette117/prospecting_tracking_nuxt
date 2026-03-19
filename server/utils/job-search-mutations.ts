import { createError } from 'h3'
import { z } from 'zod'
import { prisma } from './prisma'
import { normalizeLabel } from './job-search'
import { syncContactCompanyRelationship } from './relationships'

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

    // On fixe midi UTC pour conserver le bon jour meme si le serveur
    // et le navigateur n'utilisent pas exactement le meme fuseau horaire.
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

export const jobApplicationInputSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  companyWebsite: optionalUrl,
  companyLinkedin: optionalUrl,
  position: z.string().trim().min(2).max(120),
  status: z.string().trim().min(2).max(80),
  appliedAt: optionalDate,
  notes: z.string().trim().max(2000).optional().transform(value => value?.trim() || null),
  contactName: optionalTrimmedString,
  contactRole: optionalTrimmedString,
  contactEmail: optionalEmail,
  contactLinkedin: optionalUrl,
})
  .superRefine((value, ctx) => {
    // Le formulaire autorise un contact "principal", mais pas un contact partiel.
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
  })

export type JobApplicationInput = z.infer<typeof jobApplicationInputSchema>

export const parseJobApplicationInput = (body: unknown): JobApplicationInput => {
  const result = jobApplicationInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? 'Donnees invalides.',
    })
  }

  return result.data
}

export const findOrCreateCompany = async (
  companyName: string,
  companyWebsite: string | null,
  companyLinkedin: string | null,
) => {
  // Une entreprise est partagee entre plusieurs opportunites.
  // On tente donc de la reutiliser avant d'en creer une nouvelle.
  const existingCompany = await prisma.company.findFirst({
    where: {
      name: {
        equals: companyName,
        mode: 'insensitive',
      },
    },
  })

  if (existingCompany) {
    return prisma.company.update({
      where: { id: existingCompany.id },
      data: {
        name: companyName,
        website: companyWebsite,
        linkedin: companyLinkedin,
      },
    })
  }

  return prisma.company.create({
    data: {
      name: companyName,
      website: companyWebsite,
      linkedin: companyLinkedin,
    },
  })
}

export const syncPrimaryContact = async ({
  userId,
  companyId,
  contactName,
  contactRole,
  contactEmail,
  contactLinkedin,
}: {
  userId: string
  companyId: string
  contactName: string | null
  contactRole: string | null
  contactEmail: string | null
  contactLinkedin: string | null
}) => {
  // Le produit ne gere qu'un contact principal par entreprise dans ce contexte.
  // On met donc a jour le plus ancien contact existant au lieu d'en empiler plusieurs.
  const hasContactDetails = [contactName, contactRole, contactEmail, contactLinkedin].some(Boolean)

  const existingContact = await prisma.contacts.findFirst({
    where: {
      userId,
      companyId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (!hasContactDetails) {
    if (existingContact) {
      await prisma.contacts.delete({
        where: {
          id: existingContact.id,
        },
      })
    }

    return null
  }

  const contactData = {
    name: contactName ?? '',
    role: contactRole,
    email: contactEmail,
    linkedin: contactLinkedin,
  }

  if (existingContact) {
    const updatedContact = await prisma.contacts.update({
      where: {
        id: existingContact.id,
      },
      data: contactData,
    })

    await syncContactCompanyRelationship({
      userId,
      contactId: updatedContact.id,
      companyId,
    })

    return updatedContact
  }

  const createdContact = await prisma.contacts.create({
    data: {
      userId,
      companyId,
      ...contactData,
    },
  })

  await syncContactCompanyRelationship({
    userId,
    contactId: createdContact.id,
    companyId,
  })

  return createdContact
}

export const isSameCompanyName = (left: string, right: string) =>
  normalizeLabel(left) === normalizeLabel(right)
