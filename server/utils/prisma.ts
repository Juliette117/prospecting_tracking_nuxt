import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const { Pool } = pg

// En dev, Nuxt recharge souvent les modules. On garde donc une seule
// instance globale pour eviter d'ouvrir plusieurs pools PostgreSQL.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
  prismaPool?: InstanceType<typeof Pool>
}

// DIRECT_URL est la source prioritaire utilisee par le projet pour la connexion Prisma.
const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const prismaPoolMax = Number(process.env.PG_POOL_MAX ?? (process.env.NODE_ENV === 'production' ? 1 : 5))

if (!datasourceUrl) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL for Prisma client.')
}

const prismaPool =
  globalForPrisma.prismaPool ??
  new Pool({
    connectionString: datasourceUrl,
    max: Number.isFinite(prismaPoolMax) && prismaPoolMax > 0 ? prismaPoolMax : 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })

const prismaAdapter = new PrismaPg(prismaPool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: prismaAdapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaPool = prismaPool
}
