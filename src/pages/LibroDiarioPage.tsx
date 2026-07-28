import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Field, Label, Input, Select } from '@/components/ui/Input'
import { useAppStore } from '@/store/AppStore'
import { formatCLP, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

interface LineaForm {
  cuentaId: string
  glosa: string
  debe: string
  haber: string
}

function nuevaLinea(): LineaForm {
  return { cuentaId: '', glosa: '', debe: '', haber: '' }
}

export function LibroDiarioPage() {
  const { asientos, cuentas, addAsientoManual, updateAsiento } = useAppStore()
  const [expandido, setExpandido] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [glosa, setGlosa] = useState('')
  const [lineas, setLineas] = useState<LineaForm[]>([nuevaLinea(), nuevaLinea()])
  const [error, setError] = useState('')

  const cuentaMap = useMemo(() => new Map(cuentas.map((c) => [c.id, c])), [cuentas])
  const cuentasImputables = useMemo(() => cuentas.filter((c) => c.imputable).sort((a, b) => a.codigo.localeCompare(b.codigo)), [cuentas])

  const totalDebe = lineas.reduce((s, l) => s + (Number(l.debe) || 0), 0)
  const totalHaber = lineas.reduce((s, l) => s + (Number(l.haber) || 0), 0)
  const descuadre = totalDebe - totalHaber

  function updateLinea(idx: number, patch: Partial<LineaForm>) {
    setLineas((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  function resetForm() {
    setFecha(new Date().toISOString().slice(0, 10))
    setGlosa('')
    setLineas([nuevaLinea(), nuevaLinea()])
    setError('')
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
  }

  function openNuevoAsiento() {
    setEditingId(null)
    resetForm()
    setModalOpen(true)
  }

  function openEditarAsiento(id: string) {
    const asiento = asientos.find((a) => a.id === id)
    if (!asiento) return
    setEditingId(id)
    setFecha(asiento.fecha)
    setGlosa(asiento.glosa)
    setLineas(
      asiento.lineas.map((l) => ({
        cuentaId: l.cuentaId,
        glosa: l.glosa,
        debe: l.debe ? String(l.debe) : '',
        haber: l.haber ? String(l.haber) : '',
      })),
    )
    setError('')
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!glosa.trim()) return setError('Ingresa una glosa para el asiento.')
    if (lineas.some((l) => !l.cuentaId)) return setError('Todas las líneas deben tener una cuenta seleccionada.')
    if (totalDebe === 0 && totalHaber === 0) return setError('Ingresa al menos un monto en Debe o Haber.')
    if (Math.abs(descuadre) > 0.5) return setError('El asiento no cuadra: el total Debe debe ser igual al total Haber.')

    const lineasPayload = lineas
      .filter((l) => l.cuentaId)
      .map((l) => ({ cuentaId: l.cuentaId, glosa: l.glosa.trim() || glosa.trim(), debe: Number(l.debe) || 0, haber: Number(l.haber) || 0 }))

    if (editingId) {
      updateAsiento(editingId, fecha, glosa.trim(), lineasPayload)
    } else {
      addAsientoManual(fecha, glosa.trim(), lineasPayload)
    }
    resetForm()
    setEditingId(null)
    setModalOpen(false)
  }

  return (
    <div>
      <Topbar title="Libro Diario" description="Registro cronológico de asientos contables" />

      <div className="space-y-6 p-8">
        <div className="flex justify-end">
          <Button size="sm" onClick={openNuevoAsiento}>
            <Plus size={15} /> Nuevo asiento manual
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-8"></Th>
                  <Th>N°</Th>
                  <Th>Fecha</Th>
                  <Th>Glosa</Th>
                  <Th>Tipo</Th>
                  <Th className="text-right">Debe</Th>
                  <Th className="text-right">Haber</Th>
                  <Th className="text-right" sticky>
                    Acciones
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {asientos.map((asiento) => {
                  const totDebe = asiento.lineas.reduce((s, l) => s + l.debe, 0)
                  const totHaber = asiento.lineas.reduce((s, l) => s + l.haber, 0)
                  const isOpen = expandido === asiento.id
                  return (
                    <Fragment key={asiento.id}>
                      <Tr className="cursor-pointer" onClick={() => setExpandido(isOpen ? null : asiento.id)}>
                        <Td>{isOpen ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}</Td>
                        <Td className="font-mono text-xs text-slate-500">#{asiento.numero}</Td>
                        <Td className="text-slate-500">{formatDate(asiento.fecha)}</Td>
                        <Td className="max-w-[280px] truncate font-medium text-slate-800">{asiento.glosa}</Td>
                        <Td>
                          <Badge tone={asiento.tipo === 'Venta' ? 'good' : asiento.tipo === 'Compra' ? 'warning' : 'neutral'}>{asiento.tipo}</Badge>
                        </Td>
                        <Td className="text-right font-medium tabular-nums">{formatCLP(totDebe)}</Td>
                        <Td className="text-right font-medium tabular-nums">{formatCLP(totHaber)}</Td>
                        <Td className="text-right" sticky>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditarAsiento(asiento.id)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Pencil size={14} />
                          </button>
                        </Td>
                      </Tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50/70 px-4 py-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-slate-400">
                                  <th className="pb-2 font-medium">Cuenta</th>
                                  <th className="pb-2 font-medium">Glosa</th>
                                  <th className="pb-2 text-right font-medium">Debe</th>
                                  <th className="pb-2 text-right font-medium">Haber</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {asiento.lineas.map((l) => {
                                  const cta = cuentaMap.get(l.cuentaId)
                                  return (
                                    <tr key={l.id}>
                                      <td className="py-1.5 text-slate-700">
                                        {cta ? `${cta.codigo} · ${cta.nombre}` : 'Cuenta eliminada'}
                                      </td>
                                      <td className="py-1.5 text-slate-500">{l.glosa}</td>
                                      <td className="py-1.5 text-right tabular-nums text-slate-700">{l.debe ? formatCLP(l.debe) : '—'}</td>
                                      <td className="py-1.5 text-right tabular-nums text-slate-700">{l.haber ? formatCLP(l.haber) : '—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar asiento contable' : 'Nuevo asiento manual'}
        description="Registra un movimiento contable de partida doble"
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </Field>
            <Field>
              <Label>Glosa general</Label>
              <Input value={glosa} onChange={(e) => setGlosa(e.target.value)} placeholder="Ej: Pago de servicios básicos" required />
            </Field>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_100px_100px_28px] gap-2 px-1 text-xs font-medium text-slate-400">
              <span>Cuenta</span>
              <span>Glosa línea</span>
              <span className="text-right">Debe</span>
              <span className="text-right">Haber</span>
              <span />
            </div>
            {lineas.map((l, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_100px_100px_28px] items-center gap-2">
                <Select value={l.cuentaId} onChange={(e) => updateLinea(idx, { cuentaId: e.target.value })} className="h-9 text-xs">
                  <option value="">Seleccionar…</option>
                  {cuentasImputables.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} · {c.nombre}
                    </option>
                  ))}
                </Select>
                <Input
                  value={l.glosa}
                  onChange={(e) => updateLinea(idx, { glosa: e.target.value })}
                  placeholder="(opcional)"
                  className="h-9 text-xs"
                />
                <Input
                  type="number"
                  value={l.debe}
                  onChange={(e) => updateLinea(idx, { debe: e.target.value, haber: e.target.value ? '' : l.haber })}
                  placeholder="0"
                  className="h-9 text-right text-xs"
                />
                <Input
                  type="number"
                  value={l.haber}
                  onChange={(e) => updateLinea(idx, { haber: e.target.value, debe: e.target.value ? '' : l.debe })}
                  placeholder="0"
                  className="h-9 text-right text-xs"
                />
                <button
                  type="button"
                  onClick={() => setLineas((ls) => ls.filter((_, i) => i !== idx))}
                  disabled={lineas.length <= 2}
                  className="rounded p-1 text-slate-400 hover:bg-critical-bg hover:text-critical disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLineas((ls) => [...ls, nuevaLinea()])}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus size={13} /> Agregar línea
            </button>
          </div>

          <div
            className={cn(
              'flex items-center justify-between rounded-xl px-4 py-3 text-sm',
              Math.abs(descuadre) > 0.5 ? 'bg-critical-bg text-critical' : 'bg-good-bg text-good',
            )}
          >
            <span className="font-medium">{Math.abs(descuadre) > 0.5 ? 'Asiento descuadrado' : 'Asiento cuadrado'}</span>
            <span className="tabular-nums">
              Debe {formatCLP(totalDebe)} · Haber {formatCLP(totalHaber)}
            </span>
          </div>

          {error && <p className="text-xs font-medium text-critical">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? 'Guardar cambios' : 'Contabilizar asiento'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
