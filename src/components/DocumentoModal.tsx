import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Label, Input, Select } from '@/components/ui/Input'
import { useAppStore } from '@/store/AppStore'
import { calcularIva, formatCLP, formatRut } from '@/lib/format'
import type { Documento, TipoDte } from '@/types'

interface ItemForm {
  descripcion: string
  cantidad: string
  precioUnitario: string
  exento: boolean
}

function nuevoItem(): ItemForm {
  return { descripcion: '', cantidad: '1', precioUnitario: '', exento: false }
}

interface DocumentoModalProps {
  open: boolean
  onClose: () => void
  clase: 'Venta' | 'Compra'
  documento?: Documento | null
}

export function DocumentoModal({ open, onClose, clase, documento }: DocumentoModalProps) {
  const { addDocumento, updateDocumento } = useAppStore()
  const [tipo, setTipo] = useState<TipoDte>('Factura')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [rut, setRut] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [giro, setGiro] = useState('')
  const [formaPago, setFormaPago] = useState<Documento['formaPago']>('Crédito')
  const [items, setItems] = useState<ItemForm[]>([nuevoItem()])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (documento) {
      setTipo(documento.tipo)
      setFecha(documento.fecha)
      setRut(documento.rutContraparte)
      setRazonSocial(documento.razonSocial)
      setGiro(documento.giro)
      setFormaPago(documento.formaPago)
      setItems(
        documento.items.map((it) => ({
          descripcion: it.descripcion,
          cantidad: String(it.cantidad),
          precioUnitario: String(it.precioUnitario),
          exento: it.exento,
        })),
      )
    } else {
      reset()
    }
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documento])

  const parsedItems = items.map((it) => ({
    ...it,
    cantidadNum: Number(it.cantidad) || 0,
    precioNum: Number(it.precioUnitario) || 0,
  }))
  const neto = parsedItems.reduce((s, it) => s + (it.exento ? 0 : it.cantidadNum * it.precioNum), 0)
  const montoExento = parsedItems.reduce((s, it) => s + (it.exento ? it.cantidadNum * it.precioNum : 0), 0)
  const iva = calcularIva(neto)
  const total = neto + iva + montoExento

  function updateItem(idx: number, patch: Partial<ItemForm>) {
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function reset() {
    setTipo('Factura')
    setFecha(new Date().toISOString().slice(0, 10))
    setRut('')
    setRazonSocial('')
    setGiro('')
    setFormaPago('Crédito')
    setItems([nuevoItem()])
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!razonSocial.trim()) return setError(`Ingresa la razón social del ${clase === 'Venta' ? 'cliente' : 'proveedor'}.`)
    if (items.some((it) => !it.descripcion.trim())) return setError('Todos los ítems deben tener una descripción.')
    if (neto + montoExento <= 0) return setError('El documento debe tener un monto mayor a cero.')

    const itemsPayload = parsedItems.map((it, i) => ({
      id: `item-${Date.now().toString(36)}-${i}`,
      descripcion: it.descripcion,
      cantidad: it.cantidadNum,
      precioUnitario: it.precioNum,
      exento: it.exento,
    }))

    if (documento) {
      updateDocumento(documento.id, {
        tipo,
        clase,
        folio: documento.folio,
        fecha,
        fechaVencimiento: documento.fechaVencimiento,
        rutContraparte: rut || '66.666.666-6',
        razonSocial: razonSocial.trim(),
        giro: giro.trim(),
        items: itemsPayload,
        estado: documento.estado,
        formaPago,
      })
    } else {
      const fechaVenc = new Date(fecha)
      fechaVenc.setDate(fechaVenc.getDate() + 30)
      addDocumento({
        tipo,
        clase,
        folio: Math.floor(1000 + Math.random() * 9000),
        fecha,
        fechaVencimiento: fechaVenc.toISOString().slice(0, 10),
        rutContraparte: rut || '66.666.666-6',
        razonSocial: razonSocial.trim(),
        giro: giro.trim(),
        items: itemsPayload,
        estado: 'Emitido',
        formaPago,
      })
    }
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
      }}
      title={
        documento
          ? `Editar ${documento.tipo.toLowerCase()} N°${documento.folio}`
          : clase === 'Venta'
            ? 'Emitir documento de venta'
            : 'Registrar documento de compra'
      }
      description="Los montos de IVA se calculan automáticamente (19%)"
      widthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Field>
            <Label>Tipo de documento</Label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDte)}>
              {clase === 'Venta' ? (
                <>
                  <option>Factura</option>
                  <option>Boleta</option>
                </>
              ) : (
                <option>Factura</option>
              )}
            </Select>
          </Field>
          <Field>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </Field>
          <Field>
            <Label>Forma de pago</Label>
            <Select value={formaPago} onChange={(e) => setFormaPago(e.target.value as Documento['formaPago'])}>
              <option>Contado</option>
              <option>Crédito</option>
              <option>Transferencia</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>RUT {clase === 'Venta' ? 'cliente' : 'proveedor'}</Label>
            <Input value={rut} onChange={(e) => setRut(formatRut(e.target.value))} placeholder="76.543.210-K" />
          </Field>
          <Field>
            <Label>Razón social</Label>
            <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Nombre o empresa" required />
          </Field>
        </div>
        <Field>
          <Label>Giro (opcional)</Label>
          <Input value={giro} onChange={(e) => setGiro(e.target.value)} placeholder="Giro comercial" />
        </Field>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_70px_120px_60px_28px] gap-2 px-1 text-xs font-medium text-slate-400">
            <span>Descripción</span>
            <span>Cant.</span>
            <span className="text-right">Precio unit.</span>
            <span className="text-center">Exento</span>
            <span />
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_70px_120px_60px_28px] items-center gap-2">
              <Input value={it.descripcion} onChange={(e) => updateItem(idx, { descripcion: e.target.value })} className="h-9 text-xs" />
              <Input
                type="number"
                min={1}
                value={it.cantidad}
                onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                className="h-9 text-xs"
              />
              <Input
                type="number"
                min={0}
                value={it.precioUnitario}
                onChange={(e) => updateItem(idx, { precioUnitario: e.target.value })}
                className="h-9 text-right text-xs"
              />
              <input
                type="checkbox"
                checked={it.exento}
                onChange={(e) => updateItem(idx, { exento: e.target.checked })}
                className="mx-auto h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={() => setItems((its) => its.filter((_, i) => i !== idx))}
                disabled={items.length <= 1}
                className="rounded p-1 text-slate-400 hover:bg-critical-bg hover:text-critical disabled:opacity-30"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((its) => [...its, nuevoItem()])}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus size={13} /> Agregar ítem
          </button>
        </div>

        <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Neto</span>
            <span className="tabular-nums text-slate-700">{formatCLP(neto)}</span>
          </div>
          {montoExento > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Exento</span>
              <span className="tabular-nums text-slate-700">{formatCLP(montoExento)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <span>IVA (19%)</span>
            <span className="tabular-nums text-slate-700">{formatCLP(iva)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-semibold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{formatCLP(total)}</span>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-critical">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {documento ? 'Guardar cambios' : clase === 'Venta' ? 'Emitir documento' : 'Registrar compra'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
