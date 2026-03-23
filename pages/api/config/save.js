import jwt from 'jsonwebtoken'
import pool from '../../../lib/db'

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secreto-cambiar-en-produccion'
    )

    const userEmail = decoded?.email
    const { section, config } = req.body

    if (!userEmail) {
      return res.status(401).json({ error: 'Usuario inválido' })
    }

    if (!section) {
      return res.status(400).json({ error: 'section es requerido' })
    }

    if (config === undefined) {
      return res.status(400).json({ error: 'config es requerido' })
    }

    await pool.query(
      `
        insert into app_user_configs (user_email, section, config, created_at, updated_at)
        values ($1, $2, $3::jsonb, now(), now())
        on conflict (user_email, section)
        do update set
          config = excluded.config,
          updated_at = now()
      `,
      [userEmail, section, JSON.stringify(config)]
    )

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: 'Error al guardar configuración: ' + err.message })
  }
}
