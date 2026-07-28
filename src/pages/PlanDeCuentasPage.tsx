import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Field, Label, Input, Select } from '@/components/ui/Input'
import { useAppStore } from '@/store/AppStore'
import type { NaturalezaCuenta, TipoCuenta } from '@/types'

const tipoTone: Record<TipoCuenta, 'brand' | 'critical' | 'good' | 'warning' | 'neutral'> = {
  Activo: 'brand',
  Pasivo: 'critical',
  Patrimonio: 'warning',
  Ingreso: 'good',
  Gasto: 'neutral',
}

const emptyForm = {
  codigo: '',
  nombre: '',
  tipo: 'Activo' as TipoCuenta,
  naturaleza: 'Deudora' as NaturalezaCuenta,
  nivel: 3,
  cuentaPadreId: '',
  imputable: true,
}

export function PlanDeCuentasPage() {
  const { cuentas, addCuenta, updateCuenta, deleteCuenta } = useAppStore()
  const [filtroTipo, setFiltroTipo] = useState<TipoCuenta | 'Todos'>('Todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const cuentasOrdenadas = useMemo(
    () => [...cuentas].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true })),
    [cuentas],
  )

  const cuentasFiltradas = cuentasOrdenadas.filter((c) => filtroTipo === 'Todos' || c.tipo === filtroTipo)

  function openNuevaCuenta() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditarCuenta(id: string) {
    const cuenta = cuentas.find((c) => c.id === id)
    if (!cuenta) return
    setEditingId(id)
    setForm({
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      naturaleza: cuenta.naturaleza,
      nivel: cuenta.nivel,
      cuentaPadreId: cuenta.cuentaPadreId ?? '',
      imputable: cuenta.imputable,
    })
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo.trim() || !form.nombre.trim()) return
    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      naturaleza: form.naturaleza,
      nivel: form.nivel,
      cuentaPadreId: form.cuentaPadreId || null,
      imputable: form.imputable,
    }
    if (editingId) {
      updateCuenta(editingId, payload)
    } else {
      addCuenta(payload)
    }
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(false)
  }

  return (
    <div>
      <Topbar title="Plan de Cuentas" description="Estructura contable de la empresa" />

      <div className="space-y-6 p-8">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div className="flex flex-wrap gap-1.5">
              {(['Todos', 'Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtroTipo === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={openNuevaCuenta}>
              <Plus size={15} /> Nueva cuenta
            </Button>
          </div>

          <CardContent className="pt-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Código</Th>
                  <Th>Nombre</Th>
                  <Th>Tipo</Th>
                  <Th>Naturaleza</Th>
                  <Th>Imputable</Th>
                  <Th className="text-right" sticky>
                    Acciones
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {cuentasFiltradas.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-mono text-xs text-slate-500" style={{ paddingLeft: `${16 + (c.nivel - 1) * 20}px` }}>
                      {c.codigo}
                    </Td>
                    <Td className={c.imputable ? 'text-slate-700' : 'font-semibold text-slate-900'}>{c.nombre}</Td>
                    <Td>
                      <Badge tone={tipoTone[c.tipo]}>{c.tipo}</Badge>
                    </Td>
                    <Td className="text-slate-500">{c.naturaleza}</Td>
                    <Td>
                      {c.imputable ? (
                        <Badge tone="good">Sí</Badge>
                      ) : (
                        <Badge tone="neutral">No (grupo)</Badge>
                      )}
                    </Td>
                    <Td className="text-right" sticky>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditarCuenta(c.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteCuenta(c.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-critical-bg hover:text-critical"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar cuenta contable' : 'Nueva cuenta contable'}
        description={editingId ? 'Modifica los datos de la cuenta' : 'Agrega una cuenta al plan de cuentas'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Código</Label>
              <Input value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="1.1.07" required />
            </Field>
            <Field>
              <Label>Nivel</Label>
              <Input
                type="number"
                min={1}
                max={4}
                value={form.nivel}
                onChange={(e) => setForm((f) => ({ ...f, nivel: Number(e.target.value) }))}
              />
            </Field>
          </div>
          <Field>
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Anticipo de clientes" required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Tipo</Label>
              <Select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoCuenta }))}>
                <option>Activo</option>
                <option>Pasivo</option>
                <option>Patrimonio</option>
                <option>Ingreso</option>
                <option>Gasto</option>
              </Select>
            </Field>
            <Field>
              <Label>Naturaleza</Label>
              <Select value={form.naturaleza} onChange={(e) => setForm((f) => ({ ...f, naturaleza: e.target.value as NaturalezaCuenta }))}>
                <option>Deudora</option>
                <option>Acreedora</option>
              </Select>
            </Field>
          </div>
          <Field>
            <Label>Cuenta padre (opcional)</Label>
            <Select value={form.cuentaPadreId} onChange={(e) => setForm((f) => ({ ...f, cuentaPadreId: e.target.value }))}>
              <option value="">Sin cuenta padre</option>
              {cuentasOrdenadas
                .filter((c) => !c.imputable && c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} · {c.nombre}
                  </option>
                ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.imputable}
              onChange={(e) => setForm((f) => ({ ...f, imputable: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            />
            Cuenta imputable (acepta movimientos)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? 'Guardar cambios' : 'Guardar cuenta'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
