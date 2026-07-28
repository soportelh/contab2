import { db } from './db.js'
import { calcularIva, calcularMontosDocumento, crearPlanDeCuentasBase, lineasParaDocumento } from './lib/contabilidad.js'

const clientes = [
  { rut: '77.111.222-3', razonSocial: 'Constructora Los Robles Ltda.', giro: 'Construcción de obras civiles' },
  { rut: '76.222.333-4', razonSocial: 'Ferretería El Martillo SpA', giro: 'Venta de materiales de construcción' },
  { rut: '78.333.444-5', razonSocial: 'Inversiones Patagonia S.A.', giro: 'Inversiones y rentas' },
  { rut: '76.444.555-6', razonSocial: 'Distribuidora Maule Ltda.', giro: 'Distribución mayorista' },
  { rut: '12.345.678-9', razonSocial: 'Juan Pablo Rojas Muñoz', giro: 'Servicios de arquitectura' },
]

const proveedores = [
  { rut: '96.500.000-K', razonSocial: 'Sodimac S.A.', giro: 'Venta de artículos para el hogar' },
  { rut: '90.111.000-1', razonSocial: 'CGE Distribución S.A.', giro: 'Distribución eléctrica' },
  { rut: '76.999.888-7', razonSocial: 'Transportes Cordillera Ltda.', giro: 'Transporte de carga' },
  { rut: '77.888.777-6', razonSocial: 'Arriendos Providencia SpA', giro: 'Arriendo de bienes raíces' },
  { rut: '76.123.456-7', razonSocial: 'Suministros Industriales del Sur Ltda.', giro: 'Venta de insumos industriales' },
]

const productosVenta = [
  'Set de herramientas manuales',
  'Pack cemento 25kg (x40)',
  'Perfiles de acero galvanizado',
  'Pintura látex 20L',
  'Servicio de instalación eléctrica',
  'Cerámica piso 60x60 (m2)',
]

const conceptosCompra = [
  'Compra de materiales de bodega',
  'Servicio de transporte de mercadería',
  'Arriendo mensual de oficina',
  'Suministro eléctrico mensual',
  'Insumos de aseo y oficina',
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(d, days) {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + days)
  return nd
}

export function seedDemoData() {
  const yaExiste = db.prepare('SELECT COUNT(*) as n FROM empresas').get().n > 0
  if (yaExiste) return

  const empresaId = crypto.randomUUID()
  db.prepare(
    `INSERT INTO empresas (id, razon_social, nombre_fantasia, rut, giro, direccion, comuna, ciudad, regimen, periodo_actual)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    empresaId,
    'Comercial Andes Sur SpA',
    'Andes Sur',
    '76.543.210-3',
    'Venta al por mayor de artículos de ferretería y construcción',
    'Av. Providencia 1650, Of. 402',
    'Providencia',
    'Santiago',
    'Régimen Pro Pyme (14D N°3)',
    '2026',
  )

  const cuentas = crearPlanDeCuentasBase(empresaId)
  const insCuenta = db.prepare(
    `INSERT INTO cuentas (id, empresa_id, codigo, nombre, tipo, naturaleza, nivel, cuenta_padre_id, imputable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const c of cuentas) {
    insCuenta.run(c.id, c.empresaId, c.codigo, c.nombre, c.tipo, c.naturaleza, c.nivel, c.cuentaPadreId, c.imputable ? 1 : 0)
  }
  const cuentaId = (codigo) => cuentas.find((c) => c.codigo === codigo).id

  const insAsiento = db.prepare(
    `INSERT INTO asientos (id, empresa_id, numero, fecha, glosa, tipo, estado, documento_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const insLinea = db.prepare(`INSERT INTO lineas_asiento (id, asiento_id, cuenta_id, glosa, debe, haber) VALUES (?, ?, ?, ?, ?, ?)`)
  const insDocumento = db.prepare(
    `INSERT INTO documentos (id, empresa_id, tipo, clase, folio, fecha, fecha_vencimiento, rut_contraparte, razon_social, giro, neto, monto_exento, iva, total, estado, forma_pago)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const insItem = db.prepare(
    `INSERT INTO items_documento (id, documento_id, descripcion, cantidad, precio_unitario, exento) VALUES (?, ?, ?, ?, ?, ?)`,
  )

  let numeroAsiento = 1
  function agregarAsiento(fecha, glosa, tipo, lineas, documentoId = null) {
    const asientoId = crypto.randomUUID()
    insAsiento.run(asientoId, empresaId, numeroAsiento++, fecha, glosa, tipo, 'Contabilizado', documentoId)
    for (const l of lineas) {
      insLinea.run(crypto.randomUUID(), asientoId, l.cuentaId, l.glosa, l.debe, l.haber)
    }
  }

  // Apertura de capital
  agregarAsiento('2026-01-02', 'Apertura de capital social', 'Apertura', [
    { cuentaId: cuentaId('1.1.02'), glosa: 'Aporte de capital inicial', debe: 25_000_000, haber: 0 },
    { cuentaId: cuentaId('3.01'), glosa: 'Capital social', debe: 0, haber: 25_000_000 },
  ])

  const today = new Date('2026-07-26')
  const mesesAtras = 6
  const inicioPeriodo = new Date(today.getFullYear(), today.getMonth() - mesesAtras, 1)
  let folioFactura = 1200
  let folioBoleta = 8400
  let folioCompra = 5000

  // Ventas
  for (let i = 0; i < 46; i++) {
    const fecha = addDays(inicioPeriodo, randInt(0, (today.getTime() - inicioPeriodo.getTime()) / 86_400_000))
    const esFactura = Math.random() > 0.35
    const cliente = pick(clientes)
    const nItems = randInt(1, 3)
    const items = Array.from({ length: nItems }, () => ({
      descripcion: pick(productosVenta),
      cantidad: randInt(1, 12),
      precioUnitario: randInt(8, 90) * 1000,
      exento: false,
    }))
    const { neto, montoExento, iva, total } = calcularMontosDocumento(items)
    const fechaVenc = addDays(fecha, 30)
    const vencida = esFactura && fechaVenc < today && Math.random() > 0.6
    const estado = !esFactura ? 'Pagado' : vencida ? 'Vencido' : Math.random() > 0.3 ? 'Pagado' : 'Emitido'
    const formaPago = esFactura ? (Math.random() > 0.5 ? 'Crédito' : 'Transferencia') : 'Contado'

    const documentoId = crypto.randomUUID()
    insDocumento.run(
      documentoId,
      empresaId,
      esFactura ? 'Factura' : 'Boleta',
      'Venta',
      esFactura ? folioFactura++ : folioBoleta++,
      isoDate(fecha),
      isoDate(fechaVenc),
      esFactura ? cliente.rut : '66.666.666-6',
      esFactura ? cliente.razonSocial : 'Consumidor Final',
      esFactura ? cliente.giro : '',
      neto,
      montoExento,
      iva,
      total,
      estado,
      formaPago,
    )
    for (const it of items) {
      insItem.run(crypto.randomUUID(), documentoId, it.descripcion, it.cantidad, it.precioUnitario, it.exento ? 1 : 0)
    }

    const lineas = lineasParaDocumento(cuentas, { clase: 'Venta', formaPago }, { neto, montoExento, iva, total })
    agregarAsiento(
      isoDate(fecha),
      `${esFactura ? 'Factura' : 'Boleta'} N° ${esFactura ? folioFactura - 1 : folioBoleta - 1} - ${esFactura ? cliente.razonSocial : 'Consumidor Final'}`,
      'Venta',
      lineas,
      documentoId,
    )
  }

  // Compras
  for (let i = 0; i < 28; i++) {
    const fecha = addDays(inicioPeriodo, randInt(0, (today.getTime() - inicioPeriodo.getTime()) / 86_400_000))
    const proveedor = pick(proveedores)
    const neto = randInt(30, 950) * 1000
    const iva = calcularIva(neto)
    const total = neto + iva
    const fechaVenc = addDays(fecha, 30)
    const vencida = fechaVenc < today && Math.random() > 0.7
    const estado = vencida ? 'Vencido' : Math.random() > 0.4 ? 'Pagado' : 'Emitido'
    const formaPago = Math.random() > 0.4 ? 'Crédito' : 'Transferencia'

    const documentoId = crypto.randomUUID()
    const folio = folioCompra++
    insDocumento.run(
      documentoId,
      empresaId,
      'Factura',
      'Compra',
      folio,
      isoDate(fecha),
      isoDate(fechaVenc),
      proveedor.rut,
      proveedor.razonSocial,
      proveedor.giro,
      neto,
      0,
      iva,
      total,
      estado,
      formaPago,
    )
    const descripcion = pick(conceptosCompra)
    insItem.run(crypto.randomUUID(), documentoId, descripcion, 1, neto, 0)

    const lineas = lineasParaDocumento(cuentas, { clase: 'Compra', formaPago }, { neto, montoExento: 0, iva, total })
    agregarAsiento(isoDate(fecha), `Factura N° ${folio} - ${proveedor.razonSocial}`, 'Compra', lineas, documentoId)
  }

  // Gastos operacionales fijos mensuales
  for (let m = 0; m <= mesesAtras; m++) {
    const fecha = new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth() + m, 28)
    if (fecha > today) continue
    agregarAsiento(isoDate(fecha), 'Remuneraciones del mes', 'Manual', [
      { cuentaId: cuentaId('5.03'), glosa: 'Sueldos y honorarios', debe: 2_450_000, haber: 0 },
      { cuentaId: cuentaId('1.1.02'), glosa: 'Pago de remuneraciones', debe: 0, haber: 2_450_000 },
    ])
    agregarAsiento(isoDate(fecha), 'Arriendo de oficina del mes', 'Manual', [
      { cuentaId: cuentaId('5.02'), glosa: 'Arriendo mensual', debe: 550_000, haber: 0 },
      { cuentaId: cuentaId('1.1.02'), glosa: 'Pago de arriendo', debe: 0, haber: 550_000 },
    ])
  }

  console.log(`[seed] Datos de ejemplo creados para la empresa demo (${empresaId})`)
}
