import { Router } from 'express'
import { db } from '../db.js'
import { calcularMontosDocumento, lineasParaDocumento } from '../lib/contabilidad.js'
import { mapCuenta, mapDocumento, mapItem } from '../lib/mappers.js'

function insertarItems(documentoId, items) {
  const ins = db.prepare(`INSERT INTO items_documento (id, documento_id, descripcion, cantidad, precio_unitario, exento) VALUES (?, ?, ?, ?, ?, ?)`)
  for (const it of items) {
    ins.run(crypto.randomUUID(), documentoId, it.descripcion, it.cantidad, it.precioUnitario, it.exento ? 1 : 0)
  }
}

function cargarDocumentoCompleto(id) {
  const row = db.prepare('SELECT * FROM documentos WHERE id = ?').get(id)
  if (!row) return null
  const items = db.prepare('SELECT * FROM items_documento WHERE documento_id = ?').all(id).map(mapItem)
  return { ...mapDocumento(row), items }
}

function regenerarAsientoDelDocumento(empresaId, documentoId, doc, montos, cuentas) {
  const lineas = lineasParaDocumento(cuentas, doc, montos)
  const glosaAsiento = `${doc.tipo} N° ${doc.folio} - ${doc.razonSocial}`
  const asientoExistente = db.prepare('SELECT id FROM asientos WHERE documento_id = ?').get(documentoId)

  if (asientoExistente) {
    db.prepare('UPDATE asientos SET fecha=?, glosa=? WHERE id=?').run(doc.fecha, glosaAsiento, asientoExistente.id)
    db.prepare('DELETE FROM lineas_asiento WHERE asiento_id = ?').run(asientoExistente.id)
    const insLinea = db.prepare(`INSERT INTO lineas_asiento (id, asiento_id, cuenta_id, glosa, debe, haber) VALUES (?, ?, ?, ?, ?, ?)`)
    for (const l of lineas) insLinea.run(crypto.randomUUID(), asientoExistente.id, l.cuentaId, l.glosa, l.debe, l.haber)
    return
  }

  const numero = (db.prepare('SELECT MAX(numero) as n FROM asientos WHERE empresa_id = ?').get(empresaId).n ?? 0) + 1
  const asientoId = crypto.randomUUID()
  db.prepare(`INSERT INTO asientos (id, empresa_id, numero, fecha, glosa, tipo, estado, documento_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    asientoId,
    empresaId,
    numero,
    doc.fecha,
    glosaAsiento,
    doc.clase === 'Venta' ? 'Venta' : 'Compra',
    'Contabilizado',
    documentoId,
  )
  const insLinea = db.prepare(`INSERT INTO lineas_asiento (id, asiento_id, cuenta_id, glosa, debe, haber) VALUES (?, ?, ?, ?, ?, ?)`)
  for (const l of lineas) insLinea.run(crypto.randomUUID(), asientoId, l.cuentaId, l.glosa, l.debe, l.haber)
}

// Montado en /api/empresas/:empresaId/documentos
export const documentosRouter = Router({ mergeParams: true })

documentosRouter.post('/', (req, res) => {
  const { empresaId } = req.params
  const { tipo, clase, folio, fecha, fechaVencimiento, rutContraparte, razonSocial, giro, items, estado, formaPago } = req.body ?? {}

  if (!razonSocial?.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'razonSocial y al menos un ítem son obligatorios' })
  }

  const montos = calcularMontosDocumento(items)
  if (montos.neto + montos.montoExento <= 0) {
    return res.status(400).json({ error: 'El documento debe tener un monto mayor a cero' })
  }

  const documentoId = crypto.randomUUID()
  db.prepare(
    `INSERT INTO documentos (id, empresa_id, tipo, clase, folio, fecha, fecha_vencimiento, rut_contraparte, razon_social, giro, neto, monto_exento, iva, total, estado, forma_pago)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    documentoId,
    empresaId,
    tipo,
    clase,
    folio,
    fecha,
    fechaVencimiento,
    rutContraparte || '66.666.666-6',
    razonSocial.trim(),
    giro ?? '',
    montos.neto,
    montos.montoExento,
    montos.iva,
    montos.total,
    estado || 'Emitido',
    formaPago,
  )
  insertarItems(documentoId, items)

  const cuentas = db.prepare('SELECT * FROM cuentas WHERE empresa_id = ?').all(empresaId).map(mapCuenta)
  regenerarAsientoDelDocumento(empresaId, documentoId, { tipo, clase, folio, razonSocial: razonSocial.trim(), fecha, formaPago }, montos, cuentas)

  res.status(201).json(cargarDocumentoCompleto(documentoId))
})

// Montado en /api/documentos
export const documentoByIdRouter = Router()

documentoByIdRouter.patch('/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM documentos WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Documento no encontrado' })

  const { tipo, clase, folio, fecha, fechaVencimiento, rutContraparte, razonSocial, giro, items, estado, formaPago } = req.body ?? {}
  if (!razonSocial?.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'razonSocial y al menos un ítem son obligatorios' })
  }

  const montos = calcularMontosDocumento(items)
  db.prepare(
    `UPDATE documentos SET tipo=?, clase=?, folio=?, fecha=?, fecha_vencimiento=?, rut_contraparte=?, razon_social=?, giro=?, neto=?, monto_exento=?, iva=?, total=?, estado=?, forma_pago=? WHERE id=?`,
  ).run(
    tipo ?? existing.tipo,
    clase ?? existing.clase,
    folio ?? existing.folio,
    fecha ?? existing.fecha,
    fechaVencimiento ?? existing.fecha_vencimiento,
    rutContraparte ?? existing.rut_contraparte,
    razonSocial.trim(),
    giro ?? existing.giro,
    montos.neto,
    montos.montoExento,
    montos.iva,
    montos.total,
    estado ?? existing.estado,
    formaPago ?? existing.forma_pago,
  )
  db.prepare('DELETE FROM items_documento WHERE documento_id = ?').run(id)
  insertarItems(id, items)

  const empresaId = existing.empresa_id
  const cuentas = db.prepare('SELECT * FROM cuentas WHERE empresa_id = ?').all(empresaId).map(mapCuenta)
  regenerarAsientoDelDocumento(
    empresaId,
    id,
    { tipo: tipo ?? existing.tipo, clase: clase ?? existing.clase, folio: folio ?? existing.folio, razonSocial: razonSocial.trim(), fecha: fecha ?? existing.fecha, formaPago: formaPago ?? existing.forma_pago },
    montos,
    cuentas,
  )

  res.json(cargarDocumentoCompleto(id))
})

documentoByIdRouter.patch('/:id/estado', (req, res) => {
  const { id } = req.params
  const { estado } = req.body ?? {}
  if (!estado) return res.status(400).json({ error: 'estado es obligatorio' })
  const existing = db.prepare('SELECT id FROM documentos WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Documento no encontrado' })
  db.prepare('UPDATE documentos SET estado = ? WHERE id = ?').run(estado, id)
  res.json(cargarDocumentoCompleto(id))
})
