export type TipoCuenta = 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto'

export type NaturalezaCuenta = 'Deudora' | 'Acreedora'

export interface Cuenta {
  id: string
  codigo: string
  nombre: string
  tipo: TipoCuenta
  naturaleza: NaturalezaCuenta
  nivel: number
  cuentaPadreId: string | null
  imputable: boolean
}

export interface LineaAsiento {
  id: string
  cuentaId: string
  glosa: string
  debe: number
  haber: number
}

export type EstadoAsiento = 'Borrador' | 'Contabilizado'

export interface AsientoContable {
  id: string
  numero: number
  fecha: string
  glosa: string
  tipo: 'Manual' | 'Venta' | 'Compra' | 'Apertura'
  estado: EstadoAsiento
  lineas: LineaAsiento[]
  documentoId?: string
}

export type TipoDte = 'Factura' | 'Boleta' | 'Nota de Crédito' | 'Nota de Débito'

export type EstadoDte = 'Emitido' | 'Pagado' | 'Anulado' | 'Vencido'

export interface ItemDocumento {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  exento: boolean
}

export interface Documento {
  id: string
  tipo: TipoDte
  clase: 'Venta' | 'Compra'
  folio: number
  fecha: string
  fechaVencimiento: string
  rutContraparte: string
  razonSocial: string
  giro: string
  items: ItemDocumento[]
  neto: number
  montoExento: number
  iva: number
  total: number
  estado: EstadoDte
  formaPago: 'Contado' | 'Crédito' | 'Transferencia'
}

export interface Empresa {
  id: string
  razonSocial: string
  nombreFantasia: string
  rut: string
  giro: string
  direccion: string
  comuna: string
  ciudad: string
  regimen: 'Régimen Pro Pyme (14D N°3)' | 'Régimen General (14A)'
  periodoActual: string
}

export interface KpiResumen {
  ingresosMes: number
  gastosMes: number
  utilidadMes: number
  ivaDebito: number
  ivaCredito: number
  ivaAPagar: number
  facturasPendientes: number
  montoPorCobrar: number
}
