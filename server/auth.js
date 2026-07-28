import bcrypt from 'bcryptjs'
import { db } from './db.js'

const SALT_ROUNDS = 12

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, SALT_ROUNDS)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash)
}

/** Crea el usuario admin inicial si la tabla `usuarios` está vacía. */
export function seedUsuarioInicial() {
  const yaExiste = db.prepare('SELECT COUNT(*) as n FROM usuarios').get().n > 0
  if (yaExiste) return null

  const username = process.env.AUTH_USERNAME || 'admin'
  const password = process.env.AUTH_PASSWORD || 'changeme123'
  const id = crypto.randomUUID()
  db.prepare('INSERT INTO usuarios (id, username, password_hash) VALUES (?, ?, ?)').run(id, username, hashPassword(password))
  return { username, password }
}

/** Middleware: exige una sesión autenticada, si no responde 401. */
export function requireAuth(req, res, next) {
  if (req.session?.userId) return next()
  res.status(401).json({ error: 'No autenticado' })
}
