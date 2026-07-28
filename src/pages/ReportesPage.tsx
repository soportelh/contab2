import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { formatCLP } from '@/lib/format'
import { useEstadosFinancieros, type GrupoSaldo } from '@/hooks/useEstadosFinancieros'
import { useKpis } from '@/hooks/useKpis'
import { useAppStore } from '@/store/AppStore'

const tabs = ['Balance General', 'Estado de Resultados', 'Formulario F29'] as const
type Tab = (typeof tabs)[number]

function GrupoBlock({ grupo }: { grupo: GrupoSaldo }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{grupo.grupo.nombre}</p>
      <div className="space-y-1">
        {grupo.cuentas.map((s) => (
          <div key={s.cuenta.id} className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-600">{s.cuenta.nombre}</span>
            <span className="tabular-nums text-slate-800">{formatCLP(s.saldo)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5 text-sm font-semibold text-slate-900">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatCLP(grupo.total)}</span>
      </div>
    </div>
  )
}

function BalanceGeneral() {
  const { activos, pasivos, patrimonio, totalActivo, totalPasivo, totalPatrimonio, utilidadEjercicio, cuadratura } = useEstadosFinancieros()
  const { empresa } = useAppStore()

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-700">Activos</h3>
            {activos.map((g) => (
              <GrupoBlock key={g.grupo.id} grupo={g} />
            ))}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700">
              <span>Total Activos</span>
              <span className="tabular-nums">{formatCLP(totalActivo)}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Pasivos</h3>
            {pasivos.map((g) => (
              <GrupoBlock key={g.grupo.id} grupo={g} />
            ))}
            <div className="mb-6 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              <span>Total Pasivos</span>
              <span className="tabular-nums">{formatCLP(totalPasivo)}</span>
            </div>

            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Patrimonio</h3>
            {patrimonio.map((g) => (
              <GrupoBlock key={g.grupo.id} grupo={g} />
            ))}
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-600">Utilidad del ejercicio</span>
              <span className="tabular-nums text-slate-800">{formatCLP(utilidadEjercicio)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              <span>Total Patrimonio</span>
              <span className="tabular-nums">{formatCLP(totalPatrimonio)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn('p-5', Math.abs(cuadratura) < 1 ? 'bg-good-bg' : 'bg-critical-bg')}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-semibold', Math.abs(cuadratura) < 1 ? 'text-good' : 'text-critical')}>
              {Math.abs(cuadratura) < 1 ? 'Balance cuadrado correctamente' : 'El balance no está cuadrado'}
            </p>
            <p className="text-xs text-slate-500">{empresa.razonSocial} · Periodo {empresa.periodoActual}</p>
          </div>
          <span className={cn('text-sm font-bold tabular-nums', Math.abs(cuadratura) < 1 ? 'text-good' : 'text-critical')}>
            Diferencia: {formatCLP(cuadratura)}
          </span>
        </div>
      </Card>
    </div>
  )
}

function EstadoResultados() {
  const { ingresos, gastos, totalIngresos, totalGastos, utilidadEjercicio } = useEstadosFinancieros()

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-good">Ingresos operacionales</h3>
        {ingresos.map((g) => (
          <GrupoBlock key={g.grupo.id} grupo={g} />
        ))}
        <div className="mb-8 flex items-center justify-between rounded-xl bg-good-bg px-4 py-3 text-sm font-bold text-good">
          <span>Total Ingresos</span>
          <span className="tabular-nums">{formatCLP(totalIngresos)}</span>
        </div>

        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-critical">Costos y gastos</h3>
        {gastos.map((g) => (
          <GrupoBlock key={g.grupo.id} grupo={g} />
        ))}
        <div className="mb-8 flex items-center justify-between rounded-xl bg-critical-bg px-4 py-3 text-sm font-bold text-critical">
          <span>Total Gastos</span>
          <span className="tabular-nums">{formatCLP(totalGastos)}</span>
        </div>

        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-5 py-4 text-base font-bold',
            utilidadEjercicio >= 0 ? 'bg-brand-600 text-white' : 'bg-critical text-white',
          )}
        >
          <span>{utilidadEjercicio >= 0 ? 'Utilidad del ejercicio' : 'Pérdida del ejercicio'}</span>
          <span className="tabular-nums">{formatCLP(Math.abs(utilidadEjercicio))}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function FormularioF29() {
  const kpis = useKpis()
  const { empresa } = useAppStore()
  const saldoAFavor = kpis.ivaAPagar < 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Formulario 29 (simulado)</CardTitle>
            <CardDescription>
              {empresa.razonSocial} · RUT {empresa.rut} · Periodo tributario {new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date())}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Código 538 · Débito Fiscal (IVA Ventas)</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">{formatCLP(kpis.ivaDebito)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Código 511 · Crédito Fiscal (IVA Compras)</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">{formatCLP(kpis.ivaCredito)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className={cn('p-6', saldoAFavor ? 'bg-good-bg' : 'bg-warning-bg')}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-semibold', saldoAFavor ? 'text-good' : 'text-warning')}>
              {saldoAFavor ? 'Código 077 · Remanente de crédito fiscal' : 'Código 91 · IVA determinado a pagar'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {saldoAFavor ? 'Se arrastra como crédito para el próximo periodo.' : 'Monto a declarar y pagar al SII antes del día 12.'}
            </p>
          </div>
          <span className={cn('text-2xl font-bold tabular-nums', saldoAFavor ? 'text-good' : 'text-warning')}>
            {formatCLP(Math.abs(kpis.ivaAPagar))}
          </span>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Otros antecedentes</CardTitle>
            <CardDescription>Información complementaria del periodo</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Régimen tributario</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{empresa.regimen}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Documentos por cobrar</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatCLP(kpis.montoPorCobrar)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Documentos por pagar</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatCLP(kpis.montoPorPagar)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Facturas pendientes</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{kpis.facturasPendientes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ReportesPage() {
  const [tab, setTab] = useState<Tab>('Balance General')

  return (
    <div>
      <Topbar title="Reportes" description="Estados financieros y antecedentes tributarios" />

      <div className="space-y-6 p-8">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === t ? 'bg-white text-brand-700 shadow-soft-xs' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Balance General' && <BalanceGeneral />}
        {tab === 'Estado de Resultados' && <EstadoResultados />}
        {tab === 'Formulario F29' && <FormularioF29 />}
      </div>
    </div>
  )
}
