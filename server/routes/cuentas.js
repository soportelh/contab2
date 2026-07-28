import { Router } from 'express'
import { db } from '../db.js'
import { mapCuenta } from '../lib/mappers.js'

export const cuentasRouter = Router({ mergeParams: true })

// Montado en /api/empresas/:empresaId/cuentas
cuentasRouter.post('/', (req, res) => {
  const { empresaId } = req.params
  const { codigo, nombre, tipo, naturaleza, nivel, cuentaPadreId, imputable } = req.body ?? {}
  if (!codigo?.trim() || !nombre?.trim()) {
    return res.status(400).json({ error: 'codigo y nombre son obligatorios' })
  }

  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO cuentas (id, empresa_id, codigo, nombre, tipo, naturaleza, nivel, cuenta_padre_id, imputable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, empresaId, codigo.trim(), nombre.trim(), tipo, naturaleza, nivel ?? 3, cuentaPadreId || null, imputable ? 1 : 0)

  const row = db.prepare('SELECT * FROM cuentas WHERE id = ?').get(id)
  res.status(201).json(mapCuenta(row))
})

// Montado en /api/cuentas
export const cuentaByIdRouter = Router()

cuentaByIdRouter.patch('/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM cuentas WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const p = req.body ?? {}
  const merged = {
    codigo: p.codigo ?? existing.codigo,
    nombre: p.nombre ?? existing.nombre,
    tipo: p.tipo ?? existing.tipo,
    naturaleza: p.naturaleza ?? existing.naturaleza,
    nivel: p.nivel ?? existing.nivel,
    cuenta_padre_id: p.cuentaPadreId !== undefined ? p.cuentaPadreId : existing.cuenta_padre_id,
    imputable: p.imputable !== undefined ? (p.imputable ? 1 : 0) : existing.imputable,
  }
  db.prepare(`UPDATE cuentas SET codigo=?, nombre=?, tipo=?, naturaleza=?, nivel=?, cuenta_padre_id=?, imputable=? WHERE id=?`).run(
    merged.codigo,
    merged.nombre,
    merged.tipo,
    merged.naturaleza,
    merged.nivel,
    merged.cuenta_padre_id,
    merged.imputable,
    id,
  )

  const row = db.prepare('SELECT * FROM cuentas WHERE id = ?').get(id)
  res.json(mapCuenta(row))
})

cuentaByIdRouter.delete('/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM cuentas WHERE id = ?').run(id)
  res.status(204).end()
})
