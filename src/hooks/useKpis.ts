import { useMemo } from 'react'
import { useAppStore } from '@/store/AppStore'

export interface MesResumen {
  mes: string
  label: string
  ingresos: number
  gastos: number
  utilidad: number
}

export function useKpis() {
  const { documentos, cuentas } = useAppStore()

  return useMemo(() => {
    const now = new Date()
    const mesActual = now.toISOString().slice(0, 7)
    const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const mesAnterior = mesAnteriorDate.toISOString().slice(0, 7)

    const ventasMesActual = documentos.filter((d) => d.clase === 'Venta' && d.estado !== 'Anulado' && d.fecha.startsWith(mesActual))
    const comprasMesActual = documentos.filter((d) => d.clase === 'Compra' && d.estado !== 'Anulado' && d.fecha.startsWith(mesActual))
    const ventasMesAnterior = documentos.filter((d) => d.clase === 'Venta' && d.estado !== 'Anulado' && d.fecha.startsWith(mesAnterior))
    const comprasMesAnterior = documentos.filter((d) => d.clase === 'Compra' && d.estado !== 'Anulado' && d.fecha.startsWith(mesAnterior))

    const sum = (docs: typeof documentos, field: 'neto' | 'iva' | 'total') => docs.reduce((s, d) => s + d[field], 0)

    const ingresosMes = sum(ventasMesActual, 'neto')
    const gastosMes = sum(comprasMesActual, 'neto')
    const ingresosMesAnterior = sum(ventasMesAnterior, 'neto')
    const gastosMesAnterior = sum(comprasMesAnterior, 'neto')

    const ivaDebito = sum(ventasMesActual, 'iva')
    const ivaCredito = sum(comprasMesActual, 'iva')
    const ivaAPagar = ivaDebito - ivaCredito

    const facturasPendientes = documentos.filter((d) => d.clase === 'Venta' && (d.estado === 'Emitido' || d.estado === 'Vencido')).length
    const montoPorCobrar = documentos
      .filter((d) => d.clase === 'Venta' && (d.estado === 'Emitido' || d.estado === 'Vencido'))
      .reduce((s, d) => s + d.total, 0)
    const montoPorPagar = documentos
      .filter((d) => d.clase === 'Compra' && (d.estado === 'Emitido' || d.estado === 'Vencido'))
      .reduce((s, d) => s + d.total, 0)

    const serieMeses: MesResumen[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      const label = new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(d).replace('.', '')
      const ingresos = sum(
        documentos.filter((doc) => doc.clase === 'Venta' && doc.estado !== 'Anulado' && doc.fecha.startsWith(key)),
        'neto',
      )
      const gastos = sum(
        documentos.filter((doc) => doc.clase === 'Compra' && doc.estado !== 'Anulado' && doc.fecha.startsWith(key)),
        'neto',
      )
      serieMeses.push({ mes: key, label: label.charAt(0).toUpperCase() + label.slice(1), ingresos, gastos, utilidad: ingresos - gastos })
    }

    const documentosVencidos = documentos.filter((d) => d.estado === 'Vencido').slice(0, 8)

    return {
      ingresosMes,
      gastosMes,
      utilidadMes: ingresosMes - gastosMes,
      ingresosVariacion: ingresosMesAnterior > 0 ? (ingresosMes - ingresosMesAnterior) / ingresosMesAnterior : 0,
      gastosVariacion: gastosMesAnterior > 0 ? (gastosMes - gastosMesAnterior) / gastosMesAnterior : 0,
      ivaDebito,
      ivaCredito,
      ivaAPagar,
      facturasPendientes,
      montoPorCobrar,
      montoPorPagar,
      serieMeses,
      documentosVencidos,
      totalCuentas: cuentas.length,
    }
  }, [documentos, cuentas])
}
