export function mapEmpresa(row) {
  return {
    id: row.id,
    razonSocial: row.razon_social,
    nombreFantasia: row.nombre_fantasia,
    rut: row.rut,
    giro: row.giro,
    direccion: row.direccion,
    comuna: row.comuna,
    ciudad: row.ciudad,
    regimen: row.regimen,
    periodoActual: row.periodo_actual,
  }
}

export function mapCuenta(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo,
    naturaleza: row.naturaleza,
    nivel: row.nivel,
    cuentaPadreId: row.cuenta_padre_id,
    imputable: !!row.imputable,
  }
}

export function mapItem(row) {
  return {
    id: row.id,
    descripcion: row.descripcion,
    cantidad: row.cantidad,
    precioUnitario: row.precio_unitario,
    exento: !!row.exento,
  }
}

export function mapDocumento(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    clase: row.clase,
    folio: row.folio,
    fecha: row.fecha,
    fechaVencimiento: row.fecha_vencimiento,
    rutContraparte: row.rut_contraparte,
    razonSocial: row.razon_social,
    giro: row.giro,
    neto: row.neto,
    montoExento: row.monto_exento,
    iva: row.iva,
    total: row.total,
    estado: row.estado,
    formaPago: row.forma_pago,
  }
}

export function mapAsiento(row) {
  return {
    id: row.id,
    numero: row.numero,
    fecha: row.fecha,
    glosa: row.glosa,
    tipo: row.tipo,
    estado: row.estado,
    documentoId: row.documento_id ?? undefined,
  }
}

export function mapLinea(row) {
  return {
    id: row.id,
    cuentaId: row.cuenta_id,
    glosa: row.glosa,
    debe: row.debe,
    haber: row.haber,
  }
}
