export const IVA_RATE = 0.19

export function calcularIva(neto) {
  return Math.round(neto * IVA_RATE)
}

// ---------------------------------------------------------------------------
// Plan de Cuentas base (estructura estándar chilena simplificada)
// ---------------------------------------------------------------------------

const cuentasRaw = [
  { codigo: '1', nombre: 'ACTIVOS', tipo: 'Activo', naturaleza: 'Deudora', nivel: 1, padre: null, imputable: false },
  { codigo: '1.1', nombre: 'Activo Circulante', tipo: 'Activo', naturaleza: 'Deudora', nivel: 2, padre: '1', imputable: false },
  { codigo: '1.1.01', nombre: 'Caja', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.1', imputable: true },
  { codigo: '1.1.02', nombre: 'Banco Estado Cta. Cte.', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.1', imputable: true },
  { codigo: '1.1.03', nombre: 'Clientes Nacionales', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.1', imputable: true },
  { codigo: '1.1.04', nombre: 'IVA Crédito Fiscal', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.1', imputable: true },
  { codigo: '1.1.05', nombre: 'PPM Pagado', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.1', imputable: true },
  { codigo: '1.1.06', nombre: 'Existencias', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.1', imputable: true },
  { codigo: '1.2', nombre: 'Activo Fijo', tipo: 'Activo', naturaleza: 'Deudora', nivel: 2, padre: '1', imputable: false },
  { codigo: '1.2.01', nombre: 'Muebles y Útiles', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.2', imputable: true },
  { codigo: '1.2.02', nombre: 'Equipos Computacionales', tipo: 'Activo', naturaleza: 'Deudora', nivel: 3, padre: '1.2', imputable: true },
  { codigo: '1.2.03', nombre: 'Depreciación Acumulada', tipo: 'Activo', naturaleza: 'Acreedora', nivel: 3, padre: '1.2', imputable: true },

  { codigo: '2', nombre: 'PASIVOS', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 1, padre: null, imputable: false },
  { codigo: '2.1', nombre: 'Pasivo Circulante', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 2, padre: '2', imputable: false },
  { codigo: '2.1.01', nombre: 'Proveedores Nacionales', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 3, padre: '2.1', imputable: true },
  { codigo: '2.1.02', nombre: 'IVA Débito Fiscal', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 3, padre: '2.1', imputable: true },
  { codigo: '2.1.03', nombre: 'Retenciones por Pagar', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 3, padre: '2.1', imputable: true },
  { codigo: '2.1.04', nombre: 'PPM por Pagar', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 3, padre: '2.1', imputable: true },
  { codigo: '2.1.05', nombre: 'Impuesto a la Renta por Pagar', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 3, padre: '2.1', imputable: true },
  { codigo: '2.2', nombre: 'Pasivo Largo Plazo', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 2, padre: '2', imputable: false },
  { codigo: '2.2.01', nombre: 'Préstamos Bancarios Largo Plazo', tipo: 'Pasivo', naturaleza: 'Acreedora', nivel: 3, padre: '2.2', imputable: true },

  { codigo: '3', nombre: 'PATRIMONIO', tipo: 'Patrimonio', naturaleza: 'Acreedora', nivel: 1, padre: null, imputable: false },
  { codigo: '3.01', nombre: 'Capital', tipo: 'Patrimonio', naturaleza: 'Acreedora', nivel: 2, padre: '3', imputable: true },
  { codigo: '3.02', nombre: 'Resultado del Ejercicio', tipo: 'Patrimonio', naturaleza: 'Acreedora', nivel: 2, padre: '3', imputable: true },
  { codigo: '3.03', nombre: 'Utilidades Acumuladas', tipo: 'Patrimonio', naturaleza: 'Acreedora', nivel: 2, padre: '3', imputable: true },

  { codigo: '4', nombre: 'INGRESOS', tipo: 'Ingreso', naturaleza: 'Acreedora', nivel: 1, padre: null, imputable: false },
  { codigo: '4.01', nombre: 'Ventas del Giro', tipo: 'Ingreso', naturaleza: 'Acreedora', nivel: 2, padre: '4', imputable: true },
  { codigo: '4.02', nombre: 'Ingresos No Operacionales', tipo: 'Ingreso', naturaleza: 'Acreedora', nivel: 2, padre: '4', imputable: true },

  { codigo: '5', nombre: 'GASTOS', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 1, padre: null, imputable: false },
  { codigo: '5.01', nombre: 'Costo de Ventas', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 2, padre: '5', imputable: true },
  { codigo: '5.02', nombre: 'Arriendo', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 2, padre: '5', imputable: true },
  { codigo: '5.03', nombre: 'Remuneraciones', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 2, padre: '5', imputable: true },
  { codigo: '5.04', nombre: 'Gastos Generales', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 2, padre: '5', imputable: true },
  { codigo: '5.05', nombre: 'Gastos Financieros', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 2, padre: '5', imputable: true },
  { codigo: '5.06', nombre: 'Depreciación del Ejercicio', tipo: 'Gasto', naturaleza: 'Deudora', nivel: 2, padre: '5', imputable: true },
]

/** Genera un plan de cuentas base (estructura chilena estándar) con IDs nuevos, listo para insertar en la tabla `cuentas`. */
export function crearPlanDeCuentasBase(empresaId) {
  const codigoToId = new Map()
  const cuentas = cuentasRaw.map((c) => {
    const id = crypto.randomUUID()
    codigoToId.set(c.codigo, id)
    return {
      id,
      empresaId,
      codigo: c.codigo,
      nombre: c.nombre,
      tipo: c.tipo,
      naturaleza: c.naturaleza,
      nivel: c.nivel,
      cuentaPadreId: null,
      imputable: c.imputable,
    }
  })
  cuentas.forEach((c, i) => {
    const padreCodigo = cuentasRaw[i].padre
    c.cuentaPadreId = padreCodigo ? (codigoToId.get(padreCodigo) ?? null) : null
  })
  return cuentas
}

/** Calcula las líneas del asiento contable generado automáticamente para un documento (venta o compra). */
export function lineasParaDocumento(cuentas, doc, montos) {
  const findCta = (codigo) => cuentas.find((c) => c.codigo === codigo)?.id ?? null
  const { neto, montoExento, iva, total } = montos
  if (doc.clase === 'Venta') {
    const cuentaCobro = doc.formaPago === 'Crédito' ? findCta('1.1.03') : findCta('1.1.02')
    return [
      { cuentaId: cuentaCobro, glosa: 'Venta según documento', debe: total, haber: 0 },
      { cuentaId: findCta('4.01'), glosa: 'Venta neta', debe: 0, haber: neto + montoExento },
      { cuentaId: findCta('2.1.02'), glosa: 'IVA débito fiscal', debe: 0, haber: iva },
    ]
  }
  const cuentaPago = doc.formaPago === 'Crédito' ? findCta('2.1.01') : findCta('1.1.02')
  return [
    { cuentaId: findCta('5.04'), glosa: 'Gasto según documento', debe: neto + montoExento, haber: 0 },
    { cuentaId: findCta('1.1.04'), glosa: 'IVA crédito fiscal', debe: iva, haber: 0 },
    { cuentaId: cuentaPago, glosa: 'Compra según documento', debe: 0, haber: total },
  ]
}

export function calcularMontosDocumento(items) {
  const neto = items.reduce((sum, it) => sum + (it.exento ? 0 : it.cantidad * it.precioUnitario), 0)
  const montoExento = items.reduce((sum, it) => sum + (it.exento ? it.cantidad * it.precioUnitario : 0), 0)
  const iva = calcularIva(neto)
  const total = neto + iva + montoExento
  return { neto, montoExento, iva, total }
}
