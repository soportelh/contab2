import { useEffect, useState } from 'react'
import { Building2, Check, Plus, Trash2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Label, Input, Select } from '@/components/ui/Input'
import { useAppStore } from '@/store/AppStore'
import { formatRut, isValidRut } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Empresa } from '@/types'

const empresaVacia: Omit<Empresa, 'id'> = {
  razonSocial: '',
  nombreFantasia: '',
  rut: '',
  giro: '',
  direccion: '',
  comuna: '',
  ciudad: '',
  regimen: 'Régimen Pro Pyme (14D N°3)',
  periodoActual: String(new Date().getFullYear()),
}

export function EmpresaPage() {
  const { empresa, empresas, updateEmpresa, addEmpresa, cambiarEmpresaActiva, eliminarEmpresa } = useAppStore()
  const [form, setForm] = useState<Empresa>(empresa)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevaForm, setNuevaForm] = useState<Omit<Empresa, 'id'>>(empresaVacia)
  const [nuevaError, setNuevaError] = useState('')

  useEffect(() => {
    setForm(empresa)
    setError('')
    setSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa.id])

  function set<K extends keyof Empresa>(key: K, value: Empresa[K]) {
    setSaved(false)
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.razonSocial.trim()) return setError('Ingresa la razón social.')
    if (!isValidRut(form.rut)) return setError('El RUT ingresado no es válido.')
    if (!form.direccion.trim()) return setError('Ingresa una dirección.')

    updateEmpresa(form.id, {
      razonSocial: form.razonSocial.trim(),
      nombreFantasia: form.nombreFantasia.trim() || form.razonSocial.trim(),
      rut: formatRut(form.rut),
      giro: form.giro.trim(),
      direccion: form.direccion.trim(),
      comuna: form.comuna.trim(),
      ciudad: form.ciudad.trim(),
      regimen: form.regimen,
      periodoActual: form.periodoActual,
    })
    setSaved(true)
  }

  function handleCrearEmpresa(e: React.FormEvent) {
    e.preventDefault()
    setNuevaError('')
    if (!nuevaForm.razonSocial.trim()) return setNuevaError('Ingresa la razón social.')
    if (!isValidRut(nuevaForm.rut)) return setNuevaError('El RUT ingresado no es válido.')

    addEmpresa({
      razonSocial: nuevaForm.razonSocial.trim(),
      nombreFantasia: nuevaForm.nombreFantasia.trim() || nuevaForm.razonSocial.trim(),
      rut: formatRut(nuevaForm.rut),
      giro: nuevaForm.giro.trim(),
      direccion: nuevaForm.direccion.trim(),
      comuna: nuevaForm.comuna.trim(),
      ciudad: nuevaForm.ciudad.trim(),
      regimen: nuevaForm.regimen,
      periodoActual: nuevaForm.periodoActual,
    })
    setNuevaForm(empresaVacia)
    setModalOpen(false)
  }

  function handleEliminar(id: string) {
    if (empresas.length <= 1) return
    eliminarEmpresa(id)
  }

  return (
    <div>
      <Topbar title="Empresa" description="Gestiona tus empresas y sus datos tributarios" />

      <div className="space-y-6 p-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tus empresas</CardTitle>
              <CardDescription>Cada empresa tiene su propio plan de cuentas, documentos y libro diario</CardDescription>
            </div>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Nueva empresa
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((e) => {
              const activa = e.id === empresa.id
              return (
                <div
                  key={e.id}
                  className={cn(
                    'group relative flex items-start gap-3 rounded-xl border p-4 transition-colors',
                    activa ? 'border-brand-400 bg-brand-50' : 'border-slate-300 hover:border-slate-400',
                  )}
                >
                  <button onClick={() => cambiarEmpresaActiva(e.id)} className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        activa ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.nombreFantasia}</p>
                      <p className="truncate text-xs text-slate-500">{e.rut}</p>
                      {activa && (
                        <Badge tone="brand" className="mt-1.5">
                          Activa
                        </Badge>
                      )}
                    </div>
                  </button>
                  {empresas.length > 1 && (
                    <button
                      onClick={() => handleEliminar(e.id)}
                      title="Eliminar empresa"
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-critical-bg hover:text-critical group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <div>
              <CardTitle>Información general — {empresa.nombreFantasia}</CardTitle>
              <CardDescription>Estos datos aparecen en los documentos y reportes emitidos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Razón social</Label>
                  <Input value={form.razonSocial} onChange={(e) => set('razonSocial', e.target.value)} placeholder="Comercial Andes Sur SpA" required />
                </Field>
                <Field>
                  <Label>Nombre de fantasía</Label>
                  <Input value={form.nombreFantasia} onChange={(e) => set('nombreFantasia', e.target.value)} placeholder="Andes Sur" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>RUT</Label>
                  <Input value={form.rut} onChange={(e) => set('rut', formatRut(e.target.value))} placeholder="76.543.210-K" required />
                </Field>
                <Field>
                  <Label>Régimen tributario</Label>
                  <Select value={form.regimen} onChange={(e) => set('regimen', e.target.value as Empresa['regimen'])}>
                    <option>Régimen Pro Pyme (14D N°3)</option>
                    <option>Régimen General (14A)</option>
                  </Select>
                </Field>
              </div>

              <Field>
                <Label>Giro</Label>
                <Input value={form.giro} onChange={(e) => set('giro', e.target.value)} placeholder="Giro comercial" />
              </Field>

              <Field>
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Av. Providencia 1650, Of. 402" required />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Comuna</Label>
                  <Input value={form.comuna} onChange={(e) => set('comuna', e.target.value)} placeholder="Providencia" />
                </Field>
                <Field>
                  <Label>Ciudad</Label>
                  <Input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Santiago" />
                </Field>
              </div>

              <Field className="max-w-[200px]">
                <Label>Periodo tributario actual</Label>
                <Input value={form.periodoActual} onChange={(e) => set('periodoActual', e.target.value)} placeholder="2026" />
              </Field>

              {error && <p className="text-xs font-medium text-critical">{error}</p>}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit">Guardar cambios</Button>
                {saved && (
                  <span className="flex items-center gap-1 text-xs font-medium text-good">
                    <Check size={14} /> Cambios guardados
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva empresa"
        description="Se creará con un plan de cuentas chileno estándar, sin documentos ni asientos"
      >
        <form onSubmit={handleCrearEmpresa} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Razón social</Label>
              <Input
                value={nuevaForm.razonSocial}
                onChange={(e) => setNuevaForm((f) => ({ ...f, razonSocial: e.target.value }))}
                placeholder="Mi Empresa SpA"
                required
              />
            </Field>
            <Field>
              <Label>Nombre de fantasía</Label>
              <Input
                value={nuevaForm.nombreFantasia}
                onChange={(e) => setNuevaForm((f) => ({ ...f, nombreFantasia: e.target.value }))}
                placeholder="Mi Empresa"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>RUT</Label>
              <Input
                value={nuevaForm.rut}
                onChange={(e) => setNuevaForm((f) => ({ ...f, rut: formatRut(e.target.value) }))}
                placeholder="76.543.210-K"
                required
              />
            </Field>
            <Field>
              <Label>Régimen tributario</Label>
              <Select value={nuevaForm.regimen} onChange={(e) => setNuevaForm((f) => ({ ...f, regimen: e.target.value as Empresa['regimen'] }))}>
                <option>Régimen Pro Pyme (14D N°3)</option>
                <option>Régimen General (14A)</option>
              </Select>
            </Field>
          </div>
          <Field>
            <Label>Giro</Label>
            <Input value={nuevaForm.giro} onChange={(e) => setNuevaForm((f) => ({ ...f, giro: e.target.value }))} placeholder="Giro comercial" />
          </Field>
          <Field>
            <Label>Dirección</Label>
            <Input
              value={nuevaForm.direccion}
              onChange={(e) => setNuevaForm((f) => ({ ...f, direccion: e.target.value }))}
              placeholder="Dirección comercial"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Comuna</Label>
              <Input value={nuevaForm.comuna} onChange={(e) => setNuevaForm((f) => ({ ...f, comuna: e.target.value }))} placeholder="Providencia" />
            </Field>
            <Field>
              <Label>Ciudad</Label>
              <Input value={nuevaForm.ciudad} onChange={(e) => setNuevaForm((f) => ({ ...f, ciudad: e.target.value }))} placeholder="Santiago" />
            </Field>
          </div>

          {nuevaError && <p className="text-xs font-medium text-critical">{nuevaError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear empresa</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
