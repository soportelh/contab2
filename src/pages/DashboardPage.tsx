import { TrendingUp, TrendingDown, Wallet, Receipt, AlertTriangle, ArrowRight } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { useAppStore } from '@/store/AppStore'
import { useKpis } from '@/hooks/useKpis'
import { formatCLP, formatDate, formatNumber } from '@/lib/format'
import { Link } from 'react-router-dom'

const COLOR_INGRESOS = '#2a78d6'
const COLOR_GASTOS = '#eb6834'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-soft-md">
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-slate-800">{formatCLP(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { documentos } = useAppStore()
  const kpis = useKpis()

  const ultimosDocumentos = documentos.slice(0, 6)

  return (
    <div>
      <Topbar title="Dashboard" description="Resumen financiero de tu empresa" />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Ingresos del mes"
            value={formatCLP(kpis.ingresosMes)}
            icon={TrendingUp}
            delta={kpis.ingresosVariacion}
            accent="good"
          />
          <StatCard
            label="Gastos del mes"
            value={formatCLP(kpis.gastosMes)}
            icon={TrendingDown}
            delta={kpis.gastosVariacion}
            invertDelta
            accent="critical"
          />
          <StatCard label="Utilidad del mes" value={formatCLP(kpis.utilidadMes)} icon={Wallet} accent="brand" />
          <StatCard
            label="IVA a pagar (F29)"
            value={formatCLP(kpis.ivaAPagar)}
            icon={Receipt}
            accent="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Ingresos vs. Gastos</CardTitle>
                <CardDescription>Últimos 6 meses, montos netos</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpis.serieMeses} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_INGRESOS} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={COLOR_INGRESOS} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_GASTOS} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={COLOR_GASTOS} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e1e0d9" strokeDasharray="0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#898781', fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#898781', fontSize: 11 }}
                      tickFormatter={(v) => `${formatNumber(v / 1_000_000)}M`}
                      width={44}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      name="Ingresos"
                      stroke={COLOR_INGRESOS}
                      strokeWidth={2}
                      fill="url(#fillIngresos)"
                    />
                    <Area
                      type="monotone"
                      dataKey="gastos"
                      name="Gastos"
                      stroke={COLOR_GASTOS}
                      strokeWidth={2}
                      fill="url(#fillGastos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Resumen tributario</CardTitle>
                <CardDescription>Periodo actual (F29)</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">IVA Débito Fiscal</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCLP(kpis.ivaDebito)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">IVA Crédito Fiscal</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCLP(kpis.ivaCredito)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-warning-bg px-4 py-3">
                <span className="text-sm font-medium text-warning">IVA a pagar</span>
                <span className="text-sm font-bold tabular-nums text-warning">{formatCLP(kpis.ivaAPagar)}</span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Por cobrar</span>
                  <span className="font-semibold tabular-nums text-slate-800">{formatCLP(kpis.montoPorCobrar)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Por pagar</span>
                  <span className="font-semibold tabular-nums text-slate-800">{formatCLP(kpis.montoPorPagar)}</span>
                </div>
              </div>

              <Link
                to="/reportes"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Ver reportes completos <ArrowRight size={13} />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Últimos documentos</CardTitle>
                <CardDescription>Facturas y boletas más recientes</CardDescription>
              </div>
              <Link to="/ventas" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Documento</Th>
                    <Th>Contraparte</Th>
                    <Th>Fecha</Th>
                    <Th className="text-right">Total</Th>
                    <Th>Estado</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {ultimosDocumentos.map((doc) => (
                    <Tr key={doc.id}>
                      <Td className="font-medium text-slate-800">
                        {doc.tipo} N°{doc.folio}
                      </Td>
                      <Td className="max-w-[180px] truncate text-slate-500">{doc.razonSocial}</Td>
                      <Td className="text-slate-500">{formatDate(doc.fecha)}</Td>
                      <Td className="text-right font-medium tabular-nums">{formatCLP(doc.total)}</Td>
                      <Td>
                        <Badge
                          tone={doc.estado === 'Pagado' ? 'good' : doc.estado === 'Vencido' ? 'critical' : doc.estado === 'Anulado' ? 'neutral' : 'warning'}
                        >
                          {doc.estado}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Documentos vencidos</CardTitle>
                <CardDescription>Requieren seguimiento</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {kpis.documentosVencidos.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">Sin documentos vencidos.</p>
              )}
              {kpis.documentosVencidos.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-red-200 bg-critical-bg/60 px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-critical shadow-soft-xs">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{doc.razonSocial}</p>
                    <p className="text-[11px] text-slate-500">
                      {doc.tipo} N°{doc.folio} · Vencía {formatDate(doc.fechaVencimiento)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-critical">{formatCLP(doc.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
