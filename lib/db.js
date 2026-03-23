import { Pool } from 'pg'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  throw new Error('No se encontró la variable de entorno de la base de datos')
}

let pool

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
} else {
  if (!global._metaAdsPool) {
    global._metaAdsPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  }
  pool = global._metaAdsPool
}

export default pool
