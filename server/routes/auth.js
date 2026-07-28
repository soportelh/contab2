import { Router } from 'express'
import { db } from '../db.js'
import { hashPassword, requireAuth, verifyPassword } from '../auth.js'

export const authRouter = Router()

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body ?? {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username)
  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  req.session.userId = usuario.id
  res.json({ username: usuario.username })
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).end()
  })
})

authRouter.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes indicar la contraseña actual y la nueva' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.session.userId)
  if (!usuario || !verifyPassword(currentPassword, usuario.password_hash)) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta' })
  }

  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), usuario.id)
  res.status(204).end()
})

authRouter.get('/me', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'No autenticado' })
  const usuario = db.prepare('SELECT username FROM usuarios WHERE id = ?').get(req.session.userId)
  if (!usuario) return res.status(401).json({ error: 'No autenticado' })
  res.json({ username: usuario.username })
})
