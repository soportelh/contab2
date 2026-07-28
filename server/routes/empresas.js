import { Router } from 'express'
import { db } from '../db.js'
import { crearPlanDeCuentasBase } from '../lib/contabilidad.js'
import { mapAsiento, mapCuenta, mapDocumento, mapEmpresa, mapItem, mapLinea } from '../lib/mappers.js'

export const empresasRouter = Router()

empresasRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM empresas ORDER BY rowid ASC').all()
  res.json(rows.map(mapEmpresa))
})

empresasRouter.post('/', (req, res) => {
  const { razonSocial, nombreFantasia, rut, giro, direccion, comuna, ciudad, regimen, periodoActual } = req.body ?? {}
  if (!razonSocial?.trim() || !rut?.trim()) {
    return res.status(400).json({ error: 'razonSocial y rut son obligatorios' })
  }

  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO empresas (id, razon_social, nombre_fantasia, rut, giro, direccion, comuna, ciudad, regimen, periodo_actual)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    razonSocial.trim(),
    (nombreFantasia || razonSocial).trim(),
    rut.trim(),
    giro ?? '',
    direccion ?? '',
    comuna ?? '',
    ciudad ?? '',
    regimen || 'Régimen Pro Pyme (14D N°3)',
    periodoActual || String(new Date().getFullYear()),
  )

  const cuentas = crearPlanDeCuentasBase(id)
  const insCuenta = db.prepare(
    `INSERT INTO cuentas (id, empresa_id, codigo, nombre, tipo, naturaleza, nivel, cuenta_padre_id, imputable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const c of cuentas) {
    insCuenta.run(c.id, c.empresaId, c.codigo, c.nombre, c.tipo, c.naturaleza, c.nivel, c.cuentaPadreId, c.imputable ? 1 : 0)
  }

  const row = db.prepare('SELECT * FROM empresas WHERE id = ?').get(id)
  res.status(201).json(mapEmpresa(row))
})

empresasRouter.patch('/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM empresas WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Empresa no encontrada' })

  const p = req.body ?? {}
  const merged = {
    razon_social: p.razonSocial ?? existing.razon_social,
    nombre_fantasia: p.nombreFantasia ?? existing.nombre_fantasia,
    rut: p.rut ?? existing.rut,
    giro: p.giro ?? existing.giro,
    direccion: p.direccion ?? existing.direccion,
    comuna: p.comuna ?? existing.comuna,
    ciudad: p.ciudad ?? existing.ciudad,
    regimen: p.regimen ?? existing.regimen,
    periodo_actual: p.periodoActual ?? existing.periodo_actual,
  }
  db.prepare(
    `UPDATE empresas SET razon_social=?, nombre_fantasia=?, rut=?, giro=?, direccion=?, comuna=?, ciudad=?, regimen=?, periodo_actual=? WHERE id=?`,
  ).run(
    merged.razon_social,
    merged.nombre_fantasia,
    merged.rut,
    merged.giro,
    merged.direccion,
    merged.comuna,
    merged.ciudad,
    merged.regimen,
    merged.periodo_actual,
    id,
  )

  const row = db.prepare('SELECT * FROM empresas WHERE id = ?').get(id)
  res.json(mapEmpresa(row))
})

empresasRouter.delete('/:id', (req, res) => {
  const { id } = req.params
  const count = db.prepare('SELECT COUNT(*) as n FROM empresas').get().n
  if (count <= 1) return res.status(400).json({ error: 'No se puede eliminar la última empresa' })
  const existing = db.prepare('SELECT id FROM empresas WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Empresa no encontrada' })
  db.prepare('DELETE FROM empresas WHERE id = ?').run(id)
  res.status(204).end()
})

/** Trae todo lo necesario para operar una empresa en un solo viaje: cuentas, documentos (con ítems) y asientos (con líneas). */
empresasRouter.get('/:id/data', (req, res) => {
  const { id } = req.params
  const empresa = db.prepare('SELECT id FROM empresas WHERE id = ?').get(id)
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' })

  const cuentas = db.prepare('SELECT * FROM cuentas WHERE empresa_id = ? ORDER BY codigo ASC').all(id).map(mapCuenta)

  const documentosRows = db.prepare('SELECT * FROM documentos WHERE empresa_id = ? ORDER BY fecha DESC, rowid DESC').all(id)
  const itemsStmt = db.prepare('SELECT * FROM items_documento WHERE documento_id = ?')
  const documentos = documentosRows.map((d) => ({ ...mapDocumento(d), items: itemsStmt.all(d.id).map(mapItem) }))

  const asientosRows = db.prepare('SELECT * FROM asientos WHERE empresa_id = ? ORDER BY fecha DESC, numero DESC').all(id)
  const lineasStmt = db.prepare('SELECT * FROM lineas_asiento WHERE asiento_id = ?')
  const asientos = asientosRows.map((a) => ({ ...mapAsiento(a), lineas: lineasStmt.all(a.id).map(mapLinea) }))

  res.json({ cuentas, documentos, asientos })
})
