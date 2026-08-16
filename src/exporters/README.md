# 📄 Módulo `exporters` (PDF y Excel)

Utilidades avanzadas y flexibles para la generación y descarga automática de archivos **PDF** y **Excel (`.xlsx`)** en aplicaciones web.

---

## 🌐 Idioma y Localización (`lang`)

Tanto `exportToPdf` como `exportToExcel` aceptan el parámetro opcional **`lang`**:
* **`'es'` (por defecto)**: Formatea fechas y etiquetas en español (`Fecha`, `Emitido`, `Página 1 de 1`, `Confidencial`).
* **`'en'`**: Formatea fechas y etiquetas en inglés (`Date`, `Issued by`, `Page 1 of 1`, `Confidential`).

```typescript
// Ejemplo especificando idioma
await exportToPdf({
  lang: 'es', // Opcional (defecto 'es')
  title: 'Reporte de Operaciones',
  filename: 'reporte_es'
});
```

---

## 📄 Exportar a PDF (`exportToPdf`)

### 1. PDF Simple (Texto y Listas Clave-Valor)
```typescript
import { exportToPdf } from '../../common-utils';

await exportToPdf({
  title: 'Informe Resumido',
  filename: 'informe_simple',
  blocks: [
    { type: 'heading', text: 'Resumen Ejecutivo', level: 1 },
    { type: 'paragraph', text: 'Este es un párrafo de texto libre explicativo.' },
    { type: 'divider' },
    {
      type: 'kv-list',
      title: 'Datos del Cliente',
      items: [
        { label: 'Empresa', value: 'Empresa Demo S.L.' },
        { label: 'Estado', value: 'Activo' }
      ]
    }
  ]
});
```

### 2. PDF de Tabla Simple
```typescript
await exportToPdf({
  title: 'Listado de Usuarios',
  filename: 'usuarios',
  sections: [
    {
      headers: ['ID', 'Nombre', 'Email', 'Rol'],
      rows: [
        [1, 'Ana López', 'ana@example.com', 'Admin'],
        [2, 'Carlos Ruiz', 'carlos@example.com', 'User']
      ]
    }
  ]
});
```

### 3. PDF Ejecutivo Avanzado (KPIs + Tablas + Estilos Corporativos)
```typescript
await exportToPdf({
  title: 'Reporte Mensual de Ventas',
  subtitle: 'Junio 2026',
  brandName: 'MI EMPRESA',
  brandTagline: 'ANALYTICS OS',
  themeColor: '#16324F',
  filename: 'reporte_ventas',
  kpis: [
    { label: 'Facturación', value: '145.200 €', trend: '+12%', accentColor: '#2B73E0' },
    { label: 'Nuevos Clientes', value: '34', accentColor: '#057A55' }
  ],
  sections: [
    {
      title: 'Ventas por Región',
      headers: ['Región', 'Ventas', 'Crecimiento'],
      rows: [
        ['Norte', '45.000 €', '+8%'],
        ['Sur', '32.000 €', '+15%']
      ]
    }
  ]
});
```

---

## 📊 Exportar a Excel (`exportToExcel`)

### 1. Excel Rápido (Una sola Tabla)
```typescript
import { exportToExcel } from '../../common-utils';

await exportToExcel({
  filename: 'contactos',
  quickTable: {
    sheetName: 'Contactos',
    headers: ['Nombre', 'Teléfono', 'Ciudad'],
    rows: [
      ['Juan Pérez', '600112233', 'Madrid'],
      ['Laura Gómez', '677889900', 'Barcelona']
    ]
  }
});
```

### 2. Excel Avanzado Multi-Pestaña
```typescript
await exportToExcel({
  filename: 'informe_financiero',
  brandName: 'FINANCE DEPT',
  themeColor: '#0F2942',
  tabs: [
    {
      name: 'Resumen',
      title: 'KPIs Principales',
      headers: ['Concepto', 'Agent PDA ($)', 'Client Proforma ($)'],
      // Detección automática de separadores de miles (#,##0 y #,##0.00) en columnas financieras y numéricas
      rows: [
        ['Port dues', 56825, 56825],
        ['Other / misc', 41327.54, 41327.54]
      ]
    }
  ]
});
```

---

## 📝 Exportar a Word / DOC (`exportToDoc` / `exportToWord`)

Permite la generación y descarga directa de documentos Word (`.doc`) totalmente formateados desde el navegador, sin dependencias pesadas y compatibles con Microsoft Word, Google Docs y LibreOffice.

### 1. Documento Word Generador General
```typescript
import { exportToDoc } from '../../common-utils';

await exportToDoc({
  title: 'Paquete de Bill of Lading (BL)',
  subtitle: 'Vessel: MT MARITIME HERO — Call Ref: NM-2026-0001',
  brandName: 'NEW MARITIME HUB',
  brandTagline: 'OPERATIONS OS',
  themeColor: '#16324F',
  filename: 'BL_Package_NM-2026-0001',
  generatedBy: 'Operations Desk',
  blocks: [
    { type: 'heading', text: 'Datos Principales del Embarque', level: 1 },
    {
      type: 'kv-list',
      title: 'Información de Flete',
      items: [
        { label: 'Shipper', value: 'Global Energy Trading Ltd' },
        { label: 'Consignee', value: 'To Order' },
        { label: 'Notify Party', value: 'MARITIME Desk' },
        { label: 'Cargo Terms', value: 'Discharging at Algeciras' }
      ]
    },
    { type: 'heading', text: 'Reglas de División (Split Rules)', level: 2 },
    {
      type: 'table',
      section: {
        headers: ['BL Ref', 'Parcela / Carga', 'Cantidad', 'Consignatario'],
        rows: [
          ['BL 1', 'LPG', '12,400 MT', 'To Order'],
          ['BL 2', 'Gasoline', '5,700 MT', 'MARITIME Desk']
        ]
      }
    }
  ]
});
```

