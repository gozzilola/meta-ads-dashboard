import jwt from 'jsonwebtoken'

const USERS = [
  {
    id: 1,
    email: process.env.ADMIN_EMAIL || 'admin@tudominio.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    name: 'Admin'
  },
  {
    id: 2,
    email: process.env.OPERATOR_EMAIL || 'operador@tudominio.com',
    password: process.env.OPERATOR_PASSWORD || 'operador123',
    role: 'operator',
    name: 'Operador'
  }
]

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })

  const user = USERS.find(u => u.email === email && u.password === password)
  if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'secreto-cambiar-en-produccion',
    { expiresIn: '7d' }
  )

  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
}
