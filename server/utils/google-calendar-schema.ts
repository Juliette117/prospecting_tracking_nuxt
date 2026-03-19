import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

type GoogleCalendarSchemaSupport = {
  hasConnectionTable: boolean
  hasOAuthStateTable: boolean
  hasInterviewSyncColumns: boolean
}

const GOOGLE_CALENDAR_INTERVIEW_COLUMNS = [
  'googleCalendarEventId',
  'googleCalendarEventUrl',
  'googleCalendarSyncedAt',
] as const

const globalForGoogleCalendarSchema = globalThis as typeof globalThis & {
  googleCalendarSchemaSupport?: GoogleCalendarSchemaSupport
  googleCalendarSchemaSupportPromise?: Promise<GoogleCalendarSchemaSupport>
}

const loadGoogleCalendarSchemaSupport = async (): Promise<GoogleCalendarSchemaSupport> => {
  const [tables, interviewColumns] = await Promise.all([
    prisma.$queryRaw<Array<{ table_name: string }>>(Prisma.sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (${Prisma.join(['GoogleCalendarConnection', 'GoogleOAuthState'])})
    `),
    prisma.$queryRaw<Array<{ column_name: string }>>(Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Interviews'
        AND column_name IN (${Prisma.join([...GOOGLE_CALENDAR_INTERVIEW_COLUMNS])})
    `),
  ])

  const availableTables = new Set(tables.map(table => table.table_name))
  const availableInterviewColumns = new Set(interviewColumns.map(column => column.column_name))

  return {
    hasConnectionTable: availableTables.has('GoogleCalendarConnection'),
    hasOAuthStateTable: availableTables.has('GoogleOAuthState'),
    hasInterviewSyncColumns: GOOGLE_CALENDAR_INTERVIEW_COLUMNS.every(column =>
      availableInterviewColumns.has(column),
    ),
  }
}

export const getGoogleCalendarSchemaSupport = async (): Promise<GoogleCalendarSchemaSupport> => {
  if (globalForGoogleCalendarSchema.googleCalendarSchemaSupport) {
    return globalForGoogleCalendarSchema.googleCalendarSchemaSupport
  }

  if (!globalForGoogleCalendarSchema.googleCalendarSchemaSupportPromise) {
    globalForGoogleCalendarSchema.googleCalendarSchemaSupportPromise =
      loadGoogleCalendarSchemaSupport()
        .then((schemaSupport) => {
          globalForGoogleCalendarSchema.googleCalendarSchemaSupport = schemaSupport
          return schemaSupport
        })
        .finally(() => {
          globalForGoogleCalendarSchema.googleCalendarSchemaSupportPromise = undefined
        })
  }

  return globalForGoogleCalendarSchema.googleCalendarSchemaSupportPromise
}

export const isGoogleCalendarSchemaAvailable = async () => {
  const schemaSupport = await getGoogleCalendarSchemaSupport()

  return (
    schemaSupport.hasConnectionTable &&
    schemaSupport.hasOAuthStateTable &&
    schemaSupport.hasInterviewSyncColumns
  )
}
