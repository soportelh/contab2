import { Router } from 'express'
import { db } from '../db.js'
import { mapAsiento, mapLinea } from '../lib/mappers.js'

function cargarAsientoCompleto(id) {
  const row = db.prepare('SELECT * FROM asientos WHERE id = ?').get(id)
  if (!row) return null
  const lineas = db.prepare('SELECT * FROM lineas_asiento WHERE asiento_id = ?').all(id).map(mapLinea)
  return { ...mapAsiento(row), lineas }
}

function insertarLineas(asientoId, lineas) {
  const ins = db.prepare(`INSERT INTO lineas_asiento (id, asiento_id, cuenta_id, glosa, debe, haber) VALUES (?, ?, ?, ?, ?, ?)`)
  for (const l of lineas) {
    ins.run(crypto.randomUUID(), asientoId, l.cuentaId, l.glosa ?? '', l.debe ?? 0, l.haber ?? 0)
  }
}

// Montado en /api/empresas/:empresaId/asientos
export const asientosRouter = Router({ mergeParams: true })

asientosRouter.post('/', (req, res) => {
  const { empresaId } = req.params
  const { fecha, glosa, lineas } = req.body ?? {}
  if (!fecha || !glosa?.trim() || !Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: 'fecha, glosa y al menos una línea son obligatorios' })
  }

  const numero = (db.prepare('SELECT MAX(numero) as n FROM asientos WHERE empresa_id = ?').get(empresaId).n ?? 0) + 1
  const id = crypto.randomUUID()
  db.prepare(`INSERT INTO asientos (id, empresa_id, numero, fecha, glosa, tipo, estado, documento_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    empresaId,
    numero,
    fecha,
    glosa.trim(),
    'Manual',
    'Contabilizado',
    null,
  )
  insertarLineas(id, lineas)

  res.status(201).json(cargarAsientoCompleto(id))
})

// Montado en /api/asientos
export const asientoByIdRouter = Router()

asientoByIdRouter.patch('/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM asientos WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Asiento no encontrado' })

  const { fecha, glosa, lineas } = req.body ?? {}
  db.prepare('UPDATE asientos SET fecha=?, glosa=? WHERE id=?').run(fecha ?? existing.fecha, (glosa ?? existing.glosa).trim(), id)

  if (Array.isArray(lineas)) {
    db.prepare('DELETE FROM lineas_asiento WHERE asiento_id = ?').run(id)
    insertarLineas(id, lineas)
  }

  res.json(cargarAsientoCompleto(id))
})
