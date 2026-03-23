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
  if (req.method !== 'GET') {
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
    const { section } = req.query

    if (!userEmail) {
      return res.status(401).json({ error: 'Usuario inválido' })
    }

    if (!section) {
      return res.status(400).json({ error: 'section es requerido' })
    }

    const result = await pool.query(
      `
        select config
        from app_user_configs
        where user_email = $1 and section = $2
        limit 1
      `,
      [userEmail, section]
    )

    if (result.rows.length === 0) {
      return res.status(200).json({ config: null })
    }

    return res.status(200).json({ config: result.rows[0].config })
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener configuración: ' + err.message })
  }
}
