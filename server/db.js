import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(path.join(dataDir, 'contab.db'))

db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    razon_social TEXT NOT NULL,
    nombre_fantasia TEXT NOT NULL,
    rut TEXT NOT NULL,
    giro TEXT NOT NULL DEFAULT '',
    direccion TEXT NOT NULL DEFAULT '',
    comuna TEXT NOT NULL DEFAULT '',
    ciudad TEXT NOT NULL DEFAULT '',
    regimen TEXT NOT NULL DEFAULT 'Régimen Pro Pyme (14D N°3)',
    periodo_actual TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS cuentas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    naturaleza TEXT NOT NULL,
    nivel INTEGER NOT NULL,
    cuenta_padre_id TEXT,
    imputable INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_cuentas_empresa ON cuentas(empresa_id);

  CREATE TABLE IF NOT EXISTS documentos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    clase TEXT NOT NULL,
    folio INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    fecha_vencimiento TEXT NOT NULL,
    rut_contraparte TEXT NOT NULL DEFAULT '',
    razon_social TEXT NOT NULL DEFAULT '',
    giro TEXT NOT NULL DEFAULT '',
    neto REAL NOT NULL,
    monto_exento REAL NOT NULL DEFAULT 0,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    estado TEXT NOT NULL,
    forma_pago TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON documentos(empresa_id);

  CREATE TABLE IF NOT EXISTS items_documento (
    id TEXT PRIMARY KEY,
    documento_id TEXT NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    exento INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_items_documento ON items_documento(documento_id);

  CREATE TABLE IF NOT EXISTS asientos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    glosa TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL,
    documento_id TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_asientos_empresa ON asientos(empresa_id);
  CREATE INDEX IF NOT EXISTS idx_asientos_documento ON asientos(documento_id);

  CREATE TABLE IF NOT EXISTS lineas_asiento (
    id TEXT PRIMARY KEY,
    asiento_id TEXT NOT NULL REFERENCES asientos(id) ON DELETE CASCADE,
    cuenta_id TEXT NOT NULL,
    glosa TEXT NOT NULL DEFAULT '',
    debe REAL NOT NULL DEFAULT 0,
    haber REAL NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_lineas_asiento ON lineas_asiento(asiento_id);
`)
