import { useMemo } from 'react'
import { useAppStore } from '@/store/AppStore'
import type { Cuenta } from '@/types'

export interface SaldoCuenta {
  cuenta: Cuenta
  debe: number
  haber: number
  saldo: number
}

export interface GrupoSaldo {
  grupo: Cuenta
  cuentas: SaldoCuenta[]
  total: number
}

export function useEstadosFinancieros() {
  const { cuentas, asientos } = useAppStore()

  return useMemo(() => {
    const debeHaberPorCuenta = new Map<string, { debe: number; haber: number }>()
    for (const asiento of asientos) {
      for (const linea of asiento.lineas) {
        const acc = debeHaberPorCuenta.get(linea.cuentaId) ?? { debe: 0, haber: 0 }
        acc.debe += linea.debe
        acc.haber += linea.haber
        debeHaberPorCuenta.set(linea.cuentaId, acc)
      }
    }

    const saldos: SaldoCuenta[] = cuentas
      .filter((c) => c.imputable)
      .map((cuenta) => {
        const { debe, haber } = debeHaberPorCuenta.get(cuenta.id) ?? { debe: 0, haber: 0 }
        const saldo = cuenta.naturaleza === 'Deudora' ? debe - haber : haber - debe
        return { cuenta, debe, haber, saldo }
      })
      .filter((s) => s.debe !== 0 || s.haber !== 0)

    function agruparPor(tipo: Cuenta['tipo']): GrupoSaldo[] {
      const gruposNivel2 = cuentas.filter((c) => c.tipo === tipo && !c.imputable)
      const cuentasSueltas = cuentas.filter((c) => c.tipo === tipo && c.imputable && !c.cuentaPadreId)

      const grupos: GrupoSaldo[] = gruposNivel2.map((grupo) => {
        const hijos = saldos.filter((s) => s.cuenta.cuentaPadreId === grupo.id)
        return { grupo, cuentas: hijos, total: hijos.reduce((sum, h) => sum + h.saldo, 0) }
      })

      if (cuentasSueltas.length > 0) {
        const hijos = saldos.filter((s) => cuentasSueltas.some((c) => c.id === s.cuenta.id))
        if (hijos.length > 0) {
          grupos.push({
            grupo: { id: `virtual-${tipo}`, codigo: '', nombre: tipo, tipo, naturaleza: gruposNivel2[0]?.naturaleza ?? 'Deudora', nivel: 1, cuentaPadreId: null, imputable: false },
            cuentas: hijos,
            total: hijos.reduce((sum, h) => sum + h.saldo, 0),
          })
        }
      }

      return grupos.filter((g) => g.cuentas.length > 0)
    }

    const activos = agruparPor('Activo')
    const pasivos = agruparPor('Pasivo')
    const patrimonio = agruparPor('Patrimonio')
    const ingresos = agruparPor('Ingreso')
    const gastos = agruparPor('Gasto')

    const totalActivo = activos.reduce((s, g) => s + g.total, 0)
    const totalPasivo = pasivos.reduce((s, g) => s + g.total, 0)
    const totalIngresos = ingresos.reduce((s, g) => s + g.total, 0)
    const totalGastos = gastos.reduce((s, g) => s + g.total, 0)
    const utilidadEjercicio = totalIngresos - totalGastos
    const totalPatrimonioBase = patrimonio.reduce((s, g) => s + g.total, 0)
    const totalPatrimonio = totalPatrimonioBase + utilidadEjercicio

    return {
      saldos,
      activos,
      pasivos,
      patrimonio,
      ingresos,
      gastos,
      totalActivo,
      totalPasivo,
      totalPatrimonio,
      totalIngresos,
      totalGastos,
      utilidadEjercicio,
      cuadratura: totalActivo - (totalPasivo + totalPatrimonio),
    }
  }, [cuentas, asientos])
}
