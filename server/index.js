import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

try {
  process.loadEnvFile(new URL('.env', import.meta.url))
} catch {
  // server/.env no existe (ej. en un host que inyecta variables de entorno directamente) — seguimos con lo que haya en process.env
}

const express = (await import('express')).default
const cors = (await import('cors')).default
const session = (await import('express-session')).default

await import('./db.js')
const { seedDemoData } = await import('./seed.js')
const { seedUsuarioInicial, requireAuth } = await import('./auth.js')
const { authRouter } = await import('./routes/auth.js')
const { empresasRouter } = await import('./routes/empresas.js')
const { cuentasRouter, cuentaByIdRouter } = await import('./routes/cuentas.js')
const { asientosRouter, asientoByIdRouter } = await import('./routes/asientos.js')
const { documentosRouter, documentoByIdRouter } = await import('./routes/documentos.js')

seedDemoData()
const usuarioCreado = seedUsuarioInicial()
if (usuarioCreado) {
  console.log('[auth] Usuario inicial creado:')
  console.log(`[auth]   usuario:    ${usuarioCreado.username}`)
  console.log(`[auth]   contraseña: ${usuarioCreado.password}`)
  console.log('[auth] Guarda esta contraseña — no se volverá a mostrar.')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

const app = express()
app.set('trust proxy', 1)
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(
  session({
    name: 'contab2.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    },
  }),
)

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)

app.use('/api/empresas', requireAuth, empresasRouter)
app.use('/api/empresas/:empresaId/cuentas', requireAuth, cuentasRouter)
app.use('/api/empresas/:empresaId/asientos', requireAuth, asientosRouter)
app.use('/api/empresas/:empresaId/documentos', requireAuth, documentosRouter)
app.use('/api/cuentas', requireAuth, cuentaByIdRouter)
app.use('/api/asientos', requireAuth, asientoByIdRouter)
app.use('/api/documentos', requireAuth, documentoByIdRouter)

// Sirve el frontend ya compilado (npm run build) si existe — permite desplegar frontend + API + DB como un solo proceso.
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`[server] API escuchando en http://localhost:${PORT}`)
})
