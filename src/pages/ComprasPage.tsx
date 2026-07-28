import { useMemo, useState } from 'react'
import { Plus, CheckCircle2, Pencil } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { DocumentoModal } from '@/components/DocumentoModal'
import { useAppStore } from '@/store/AppStore'
import { formatCLP, formatDate } from '@/lib/format'
import type { Documento, EstadoDte } from '@/types'

const estadoTone: Record<EstadoDte, 'good' | 'warning' | 'critical' | 'neutral'> = {
  Pagado: 'good',
  Emitido: 'warning',
  Vencido: 'critical',
  Anulado: 'neutral',
}

export function ComprasPage() {
  const { documentos, updateDocumentoEstado } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null)
  const [filtro, setFiltro] = useState<'Todos' | EstadoDte>('Todos')

  function openNuevaCompra() {
    setEditingDoc(null)
    setModalOpen(true)
  }

  function openEditarDocumento(doc: Documento) {
    setEditingDoc(doc)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingDoc(null)
  }

  const compras = useMemo(() => documentos.filter((d) => d.clase === 'Compra'), [documentos])
  const comprasFiltradas = compras.filter((d) => filtro === 'Todos' || d.estado === filtro)

  const totales = compras.reduce(
    (acc, d) => ({ neto: acc.neto + d.neto, iva: acc.iva + d.iva, total: acc.total + d.total }),
    { neto: 0, iva: 0, total: 0 },
  )

  return (
    <div>
      <Topbar title="Compras" description="Libro de compras y registro de facturas de proveedores" />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-medium text-slate-500">Total neto</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">{formatCLP(totales.neto)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-medium text-slate-500">IVA crédito fiscal</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">{formatCLP(totales.iva)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-medium text-slate-500">Total documentos</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">{formatCLP(totales.total)}</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div className="flex flex-wrap gap-1.5">
              {(['Todos', 'Emitido', 'Pagado', 'Vencido', 'Anulado'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtro === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={openNuevaCompra}>
              <Plus size={15} /> Registrar compra
            </Button>
          </div>

          <CardContent className="p-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Documento</Th>
                  <Th>Proveedor</Th>
                  <Th>Fecha</Th>
                  <Th>Vencimiento</Th>
                  <Th className="text-right">Neto</Th>
                  <Th className="text-right">IVA</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Estado</Th>
                  <Th className="text-right" sticky>
                    Acciones
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {comprasFiltradas.map((doc) => (
                  <Tr key={doc.id}>
                    <Td className="font-medium text-slate-800">
                      {doc.tipo} N°{doc.folio}
                    </Td>
                    <Td className="max-w-[140px] truncate text-slate-500">{doc.razonSocial}</Td>
                    <Td className="text-slate-500">{formatDate(doc.fecha)}</Td>
                    <Td className="text-slate-500">{formatDate(doc.fechaVencimiento)}</Td>
                    <Td className="text-right tabular-nums">{formatCLP(doc.neto)}</Td>
                    <Td className="text-right tabular-nums">{formatCLP(doc.iva)}</Td>
                    <Td className="text-right font-medium tabular-nums">{formatCLP(doc.total)}</Td>
                    <Td>
                      <Badge tone={estadoTone[doc.estado]}>{doc.estado}</Badge>
                    </Td>
                    <Td className="text-right" sticky>
                      <div className="flex items-center justify-end gap-1">
                        {doc.estado !== 'Pagado' && doc.estado !== 'Anulado' && (
                          <button
                            onClick={() => updateDocumentoEstado(doc.id, 'Pagado')}
                            title="Marcar pagado"
                            className="rounded-lg p-1.5 text-good hover:bg-good-bg"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditarDocumento(doc)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
                {comprasFiltradas.length === 0 && (
                  <Tr>
                    <Td colSpan={9} className="py-10 text-center text-sm text-slate-400">
                      No hay documentos para este filtro.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DocumentoModal open={modalOpen} onClose={closeModal} clase="Compra" documento={editingDoc} />
    </div>
  )
}
