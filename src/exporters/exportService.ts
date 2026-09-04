/**
 * Reusable & Modular Export Service for PDF and Excel documents
 * Common Utils Package
 */

import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

export interface KpiExportItem {
  label: string;
  value: string;
  trend?: string;
  accentColor?: string;
}

export interface TableExportSection {
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  note?: string;
}

export interface KeyValueItem {
  label: string;
  value: string | number;
}

export type PdfContentBlock = 
  | { type: 'paragraph'; text: string; bold?: boolean; color?: string }
  | { type: 'heading'; text: string; level?: 1 | 2 | 3 }
  | { type: 'kv-list'; items: KeyValueItem[]; title?: string }
  | { type: 'table'; section: TableExportSection }
  | { type: 'kpis'; items: KpiExportItem[] }
  | { type: 'divider' }
  | { type: 'space'; heightPx?: number };

export type ExportLanguage = 'es' | 'en';

const I18N_LABELS: Record<ExportLanguage, {
  date: string;
  issued: string;
  confidential: string;
  page: string;
  locale: string;
}> = {
  es: {
    date: 'Fecha',
    issued: 'Emitido',
    confidential: 'Confidencial — Reporte generado automáticamente.',
    page: 'Página 1 de 1',
    locale: 'es-ES'
  },
  en: {
    date: 'Date',
    issued: 'Issued by',
    confidential: 'Confidential — Automatically generated report.',
    page: 'Page 1 of 1',
    locale: 'en-US'
  }
};

export interface PdfExportOptions {
  lang?: ExportLanguage; // Language parameter, defaults to 'es'
  title: string;
  subtitle?: string;
  filename: string;
  generatedBy?: string;
  brandName?: string;
  brandTagline?: string;
  themeColor?: string;
  /** Legacy / High-level sections */
  kpis?: KpiExportItem[];
  sections?: TableExportSection[];
  /** Modular free-form content blocks for maximum flexibility (paragraphs, key-values, headings, tables) */
  blocks?: PdfContentBlock[];
  footerNote?: string;
}

export interface ExcelTabConfig {
  name: string;
  title?: string;
  subtitle?: string;
  themeColor?: string; // Optional hex color override per tab (e.g. '#0EA5E9' or '16324F')
  columnFormats?: Record<number, string>; // Optional custom number formats by column index (e.g. { 1: '#,##0.00', 2: '#,##0' })
  kpis?: KpiExportItem[];
  headers: string[];
  rows: (string | number)[][];
}

export interface ExcelExportOptions {
  lang?: ExportLanguage; // Language parameter, defaults to 'es'
  filename: string;
  brandName?: string;
  themeColor?: string; // Hex color for header styling
  summaryTab?: ExcelTabConfig;
  detailTab?: ExcelTabConfig;
  /** Standard multi-tab or single-tab config */
  tabs?: ExcelTabConfig[];
  /** Shortcut for quick single-table export */
  quickTable?: {
    sheetName?: string;
    headers: string[];
    rows: (string | number)[][];
  };
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates and returns a PDF document as a binary Blob without triggering immediate download.
 */
export async function generatePdfBlob(options: PdfExportOptions): Promise<{ blob: Blob; filename: string }> {
  const lang = options.lang || 'es';
  const labels = I18N_LABELS[lang] || I18N_LABELS.es;

  const dateStr = new Date().toLocaleDateString(labels.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const brandName = options.brandName || 'EXECUTIVE OS';
  const brandTagline = options.brandTagline || 'REPORT GENERATOR';
  const primaryColor = options.themeColor || '#16324F';

  // Temporary off-screen container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '820px';
  container.style.background = '#ffffff';
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  container.style.color = '#102033';

  // Build HTML Blocks
  let contentHtml = '';

  // 1. Render legacy/shorthand KPIs if present
  if (options.kpis && options.kpis.length > 0) {
    contentHtml += renderKpiGridHtml(options.kpis);
  }

  // 2. Render legacy/shorthand sections if present
  if (options.sections && options.sections.length > 0) {
    contentHtml += options.sections.map(sec => renderTableSectionHtml(sec, primaryColor)).join('');
  }

  // 3. Render modular content blocks if provided
  if (options.blocks && options.blocks.length > 0) {
    for (const block of options.blocks) {
      switch (block.type) {
        case 'paragraph':
          contentHtml += `<p style="font-size:12px;line-height:1.6;color:${block.color || '#23395B'};margin:0 0 12px 0;${block.bold ? 'font-weight:700;' : ''}">${escapeHtml(block.text)}</p>`;
          break;
        case 'heading': {
          const size = block.level === 1 ? '18px' : block.level === 2 ? '15px' : '13px';
          contentHtml += `<h${block.level || 2} style="font-size:${size};font-weight:700;color:${primaryColor};margin:16px 0 8px 0;">${escapeHtml(block.text)}</h${block.level || 2}>`;
          break;
        }
        case 'kv-list':
          contentHtml += `
            <div style="margin-bottom:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:12px 16px;">
              ${block.title ? `<div style="font-size:11px;font-weight:700;color:${primaryColor};text-transform:uppercase;margin-bottom:8px;">${escapeHtml(block.title)}</div>` : ''}
              <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px 16px;">
                ${block.items.map(item => `
                  <div style="font-size:11.5px;"><strong style="color:#4A5568;">${escapeHtml(item.label)}:</strong> <span style="color:#1A202C;">${escapeHtml(String(item.value))}</span></div>
                `).join('')}
              </div>
            </div>
          `;
          break;
        case 'table':
          contentHtml += renderTableSectionHtml(block.section, primaryColor);
          break;
        case 'kpis':
          contentHtml += renderKpiGridHtml(block.items);
          break;
        case 'divider':
          contentHtml += `<hr style="border:0;border-top:1px solid #E2E8F0;margin:16px 0;" />`;
          break;
        case 'space':
          contentHtml += `<div style="height:${block.heightPx || 16}px;"></div>`;
          break;
      }
    }
  }

  container.innerHTML = `
    <!-- Header Banner -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid ${primaryColor};margin-bottom:22px;">
      <div>
        <div style="display:inline-block;background:${primaryColor};color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.8px;padding:4px 10px;border-radius:4px;margin-bottom:6px;text-transform:uppercase;">
          ${escapeHtml(brandName)}
        </div>
        <div style="font-size:24px;font-weight:700;color:${primaryColor};margin-bottom:4px;letter-spacing:-0.3px;">
          ${escapeHtml(options.title)}
        </div>
        ${options.subtitle ? `<div style="font-size:12.5px;color:#496074;font-weight:500;">${escapeHtml(options.subtitle)}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:11px;color:#7D93A6;">
        <strong style="display:block;color:${primaryColor};font-size:12px;margin-bottom:2px;">${escapeHtml(brandTagline)}</strong>
        <div>${labels.date}: ${dateStr}</div>
        ${options.generatedBy ? `<div>${labels.issued}: ${escapeHtml(options.generatedBy)}</div>` : ''}
      </div>
    </div>

    <!-- Main Content Area -->
    ${contentHtml}

    <!-- Footer -->
    <div style="margin-top:30px;padding-top:12px;border-top:1px solid #E1E9F0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#899EAF;">
      <div>${options.footerNote ? escapeHtml(options.footerNote) : labels.confidential}</div>
      <div>${labels.page}</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    const filename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
    return { blob, filename };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates and directly downloads a high-resolution PDF document.
 * Flexible: Supports simple text documents, key-value lists, or full executive report dashboards.
 */
export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const { blob, filename } = await generatePdfBlob(options);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function renderKpiGridHtml(kpis: KpiExportItem[]): string {
  return `
    <div style="display:grid;grid-template-columns:repeat(${Math.min(kpis.length, 4)}, 1fr);gap:12px;margin-bottom:22px;">
      ${kpis.map(kpi => `
        <div style="background:#F5FAFC;border:1px solid #D9E6EC;border-radius:10px;padding:12px 14px;position:relative;overflow:hidden;">
          <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${kpi.accentColor || '#2B73E0'};"></div>
          <div style="font-size:10px;font-weight:700;color:#5A738E;text-transform:uppercase;margin-bottom:4px;">${escapeHtml(kpi.label)}</div>
          <div style="font-size:17px;font-weight:800;color:#0F2942;line-height:1.2;">${escapeHtml(kpi.value)}</div>
          ${kpi.trend ? `<div style="font-size:10px;color:#057A55;font-weight:700;margin-top:4px;">${escapeHtml(kpi.trend)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTableSectionHtml(sec: TableExportSection, primaryColor: string): string {
  return `
    <div style="margin-bottom:24px;">
      ${sec.title ? `<div style="font-size:14px;font-weight:700;color:${primaryColor};margin-bottom:4px;border-left:3px solid ${primaryColor};padding-left:8px;">${escapeHtml(sec.title)}</div>` : ''}
      ${sec.subtitle ? `<div style="font-size:11px;color:#637C95;margin-bottom:8px;padding-left:11px;">${escapeHtml(sec.subtitle)}</div>` : ''}
      
      <table style="width:100%;border-collapse:separate;border-spacing:0;border-radius:8px;overflow:hidden;border:1px solid #D9E6EC;font-size:11px;">
        <thead>
          <tr style="background:${primaryColor};color:#ffffff;">
            ${sec.headers.map(h => `<th style="padding:8px 10px;text-align:left;font-weight:700;font-size:10.5px;letter-spacing:0.3px;">${escapeHtml(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${sec.rows.map((row, idx) => `
            <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F7FAFC'};">
              ${row.map(cell => `<td style="padding:7px 10px;border-bottom:1px solid #EAEFF4;color:#23395B;font-size:11px;">${escapeHtml(String(cell))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${sec.note ? `<div style="font-size:10px;color:#7A8E9F;font-style:italic;margin-top:4px;padding-left:4px;">* ${escapeHtml(sec.note)}</div>` : ''}
    </div>
  `;
}

/* ==========================================================================
   EXPORT TO EXCEL
   ========================================================================== */

/**
 * Generates and downloads a binary .xlsx Excel Workbook.
 * Supports simple single-table quick exports OR rich multi-tab structured workbooks.
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.brandName || 'Executive Tools';
  workbook.created = new Date();

  const primaryHeaderColor = options.themeColor ? options.themeColor.replace('#', '') : '16324F';
  const tabs: ExcelTabConfig[] = [];

  // Support summaryTab, detailTab, or generic tabs
  if (options.summaryTab) tabs.push(options.summaryTab);
  if (options.detailTab) tabs.push(options.detailTab);

  // If user passed quickTable shortcut
  if (options.quickTable) {
    tabs.push({
      name: options.quickTable.sheetName || 'Datos',
      headers: options.quickTable.headers,
      rows: options.quickTable.rows,
    });
  } else if (options.tabs && options.tabs.length > 0) {
    tabs.push(...options.tabs);
  }

  if (tabs.length === 0) {
    throw new Error('Debe proporcionar al menos una tabla o configuración de pestaña para exportar a Excel.');
  }

  for (const tabConfig of tabs) {
    const sheet = workbook.addWorksheet(tabConfig.name, {
      views: [{ showGridLines: true }],
    });

    let currentRow = 1;

    const rawColor = (tabConfig.themeColor || options.themeColor || '16324F').replace('#', '').trim();
    const tabHeaderColor = rawColor.length === 6 ? 'FF' + rawColor : rawColor;
    const numCols = Math.max(tabConfig.headers.length, 1);

    // Optional Title Banner
    if (tabConfig.title) {
      sheet.mergeCells(currentRow, 1, currentRow, numCols);
      const titleCell = sheet.getCell(currentRow, 1);
      titleCell.value = `${options.brandName ? options.brandName.toUpperCase() + ' — ' : ''}${tabConfig.title}`;
      titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tabHeaderColor } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(currentRow).height = 28;
      currentRow++;
    }

    // Optional Subtitle
    if (tabConfig.subtitle) {
      const lang = options.lang || 'es';
      const labels = I18N_LABELS[lang] || I18N_LABELS.es;
      sheet.mergeCells(currentRow, 1, currentRow, numCols);
      const subCell = sheet.getCell(currentRow, 1);
      subCell.value = `${tabConfig.subtitle} | ${labels.date}: ${new Date().toLocaleDateString(labels.locale)}`;
      subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '496074' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(currentRow).height = 20;
      currentRow++;
    }

    if (tabConfig.title || tabConfig.subtitle) {
      currentRow++; // Spacing line
    }

    // Optional KPI Cards
    if (tabConfig.kpis && tabConfig.kpis.length > 0) {
      tabConfig.kpis.forEach((kpi, index) => {
        const colStart = (index * 2) + 1;
        const colEnd = colStart + 1;
        if (colEnd <= tabConfig.headers.length + 2) {
          sheet.mergeCells(currentRow, colStart, currentRow, colEnd);
          const kpiLabelCell = sheet.getCell(currentRow, colStart);
          kpiLabelCell.value = kpi.label.toUpperCase();
          kpiLabelCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '5A738E' } };
          kpiLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };
          kpiLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

          sheet.mergeCells(currentRow + 1, colStart, currentRow + 1, colEnd);
          const kpiValueCell = sheet.getCell(currentRow + 1, colStart);
          kpiValueCell.value = kpi.value;
          kpiValueCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: primaryHeaderColor } };
          kpiValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };
          kpiValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      sheet.getRow(currentRow).height = 18;
      sheet.getRow(currentRow + 1).height = 24;
      currentRow += 3;
    }

    // Column Headers Row
    const headerRow = sheet.getRow(currentRow);
    tabConfig.headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tabHeaderColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: '0F253C' } },
        bottom: { style: 'medium', color: { argb: '0F253C' } },
      };
    });
    headerRow.height = 24;
    currentRow++;

    // Data Rows with intelligent number formatting and alignment
    tabConfig.rows.forEach((rowValues, rowIndex) => {
      const r = sheet.getRow(currentRow);
      rowValues.forEach((val, i) => {
        const cell = r.getCell(i + 1);

        const headerName = (tabConfig.headers[i] || '').toLowerCase();
        const customFmt = tabConfig.columnFormats?.[i];
        const isMoneyCol = customFmt != null ||
                           headerName.includes('($)') ||
                           headerName.includes('(€)') ||
                           headerName.includes('(gbp)') ||
                           headerName.includes('pda') ||
                           headerName.includes('share') ||
                           headerName.includes('margin') ||
                           headerName.includes('amount') ||
                           headerName.includes('cost') ||
                           headerName.includes('proforma') ||
                           headerName.includes('fee') ||
                           headerName.includes('price') ||
                           headerName.includes('monto') ||
                           headerName.includes('precio');

        let numValue: number | null = null;
        if (typeof val === 'number') {
          numValue = val;
        } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.replace(',', '.')))) {
          numValue = Number(val.replace(',', '.'));
        }

        if (numValue !== null) {
          cell.value = numValue;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (customFmt) {
            cell.numFmt = customFmt;
          } else if (isMoneyCol) {
            cell.numFmt = Number.isInteger(numValue) ? '#,##0' : '#,##0.00';
          }
        } else {
          cell.value = val;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        cell.font = { name: 'Calibri', size: 10, color: { argb: '102033' } };

        if (rowIndex % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFC' } };
        }

        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E1E9F0' } },
          left: { style: 'thin', color: { argb: 'E1E9F0' } },
          right: { style: 'thin', color: { argb: 'E1E9F0' } },
        };
      });
      r.height = 20;
      currentRow++;
    });

    // Auto-fit Column Widths precisely based on header and cell content (including thousand separators)
    tabConfig.headers.forEach((h, colIdx) => {
      let maxLen = h ? String(h).length : 10;
      tabConfig.rows.forEach(row => {
        const rawVal = row[colIdx];
        let cellVal = rawVal != null ? String(rawVal) : '';
        if (typeof rawVal === 'number') {
          cellVal = rawVal.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(rawVal) ? 0 : 2 });
        }
        if (cellVal.length < 60) {
          maxLen = Math.max(maxLen, cellVal.length);
        }
      });
      const col = sheet.getColumn(colIdx + 1);
      col.width = Math.min(Math.max(maxLen + 4, 12), 42);
    });
  }

  // Trigger binary download in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.filename}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/* ==========================================================================
   EXPORT TO WORD (DOC)
   ========================================================================== */

export type DocExportOptions = PdfExportOptions;

/**
 * Generates and directly downloads a rich Microsoft Word (.doc) document.
 * Universal and zero-dependency: works seamlessly across modern browsers and Word processors.
 */
export async function exportToDoc(options: DocExportOptions): Promise<void> {
  const lang = options.lang || 'es';
  const labels = I18N_LABELS[lang] || I18N_LABELS.es;

  const dateStr = new Date().toLocaleDateString(labels.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const brandName = options.brandName || 'EXECUTIVE OS';
  const brandTagline = options.brandTagline || 'REPORT GENERATOR';
  const primaryColor = options.themeColor || '#16324F';

  let contentHtml = '';

  // 1. Render KPIs
  if (options.kpis && options.kpis.length > 0) {
    contentHtml += renderKpiGridHtml(options.kpis);
  }

  // 2. Render sections
  if (options.sections && options.sections.length > 0) {
    contentHtml += options.sections.map(sec => renderTableSectionHtml(sec, primaryColor)).join('');
  }

  // 3. Render modular content blocks
  if (options.blocks && options.blocks.length > 0) {
    for (const block of options.blocks) {
      switch (block.type) {
        case 'paragraph':
          contentHtml += `<p style="font-size:11pt;font-family:'Calibri',sans-serif;line-height:1.5;color:${block.color || '#23395B'};margin:0 0 10pt 0;${block.bold ? 'font-weight:bold;' : ''}">${escapeHtml(block.text)}</p>`;
          break;
        case 'heading': {
          const size = block.level === 1 ? '16pt' : block.level === 2 ? '13pt' : '11pt';
          contentHtml += `<h${block.level || 2} style="font-size:${size};font-family:'Calibri',sans-serif;font-weight:bold;color:${primaryColor};margin:12pt 0 6pt 0;">${escapeHtml(block.text)}</h${block.level || 2}>`;
          break;
        }
        case 'kv-list':
          contentHtml += `
            <div style="margin-bottom:12pt;background:#F8FAFC;border:1px solid #E2E8F0;padding:10pt 12pt;">
              ${block.title ? `<div style="font-size:10pt;font-family:'Calibri',sans-serif;font-weight:bold;color:${primaryColor};text-transform:uppercase;margin-bottom:6pt;">${escapeHtml(block.title)}</div>` : ''}
              <table style="width:100%;border-collapse:collapse;font-family:'Calibri',sans-serif;font-size:10.5pt;">
                ${block.items.map(item => `
                  <tr>
                    <td style="padding:4pt 6pt;font-weight:bold;color:#4A5568;width:35%;border-bottom:1px solid #EDF2F7;">${escapeHtml(item.label)}</td>
                    <td style="padding:4pt 6pt;color:#1A202C;border-bottom:1px solid #EDF2F7;">${escapeHtml(String(item.value))}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          `;
          break;
        case 'table':
          contentHtml += renderTableSectionHtml(block.section, primaryColor);
          break;
        case 'kpis':
          contentHtml += renderKpiGridHtml(block.items);
          break;
        case 'divider':
          contentHtml += `<hr style="border:0;border-top:1px solid #E2E8F0;margin:12pt 0;" />`;
          break;
        case 'space':
          contentHtml += `<div style="height:${block.heightPx || 16}px;"></div>`;
          break;
      }
    }
  }

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(options.title)}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 2.54cm 2.54cm 2.54cm 2.54cm;
        }
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          color: #102033;
          font-size: 11pt;
          line-height: 1.4;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12pt;
        }
        th, td {
          font-family: 'Calibri', sans-serif;
        }
      </style>
    </head>
    <body>
      <!-- Header Banner -->
      <table style="width:100%;border-bottom:2px solid ${primaryColor};margin-bottom:16pt;padding-bottom:8pt;">
        <tr>
          <td style="vertical-align:top;">
            <div style="background:${primaryColor};color:#ffffff;font-size:9pt;font-weight:bold;letter-spacing:0.5pt;padding:3pt 8pt;display:inline-block;border-radius:3pt;text-transform:uppercase;">
              ${escapeHtml(brandName)}
            </div>
            <div style="font-size:18pt;font-weight:bold;color:${primaryColor};margin-top:4pt;">
              ${escapeHtml(options.title)}
            </div>
            ${options.subtitle ? `<div style="font-size:11pt;color:#496074;">${escapeHtml(options.subtitle)}</div>` : ''}
          </td>
          <td style="vertical-align:top;text-align:right;font-size:9.5pt;color:#7D93A6;">
            <strong style="color:${primaryColor};font-size:10.5pt;">${escapeHtml(brandTagline)}</strong><br/>
            ${labels.date}: ${dateStr}<br/>
            ${options.generatedBy ? `${labels.issued}: ${escapeHtml(options.generatedBy)}` : ''}
          </td>
        </tr>
      </table>

      <!-- Main Content -->
      ${contentHtml}

      <!-- Footer -->
      <table style="width:100%;margin-top:20pt;border-top:1px solid #E1E9F0;padding-top:8pt;font-size:9pt;color:#899EAF;">
        <tr>
          <td>${options.footerNote ? escapeHtml(options.footerNote) : labels.confidential}</td>
          <td style="text-align:right;">${labels.page}</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename.endsWith('.doc') || options.filename.endsWith('.docx') ? options.filename : `${options.filename}.doc`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export const exportToWord = exportToDoc;

/**
 * Generates and returns an Excel document as a binary Blob.
 */
export async function generateExcelBlob(options: ExcelExportOptions): Promise<{ blob: Blob; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.brandName || 'EXECUTIVE OS';
  workbook.created = new Date();

  const tabs: ExcelTabConfig[] = [];

  if (options.quickTable) {
    tabs.push({
      name: options.quickTable.sheetName || 'Datos',
      headers: options.quickTable.headers,
      rows: options.quickTable.rows,
    });
  }

  if (options.summaryTab) tabs.push(options.summaryTab);
  if (options.detailTab) tabs.push(options.detailTab);
  if (options.tabs && options.tabs.length > 0) {
    tabs.push(...options.tabs);
  }

  if (tabs.length === 0) {
    throw new Error('Debe proporcionar al menos una tabla o configuración de pestaña para exportar a Excel.');
  }

  for (const tabConfig of tabs) {
    const sheet = workbook.addWorksheet(tabConfig.name, {
      views: [{ showGridLines: true }],
    });

    let currentRow = 1;
    const rawColor = (tabConfig.themeColor || options.themeColor || '16324F').replace('#', '').trim();
    const tabHeaderColor = rawColor.length === 6 ? 'FF' + rawColor : rawColor;
    const numCols = Math.max(tabConfig.headers.length, 1);

    if (tabConfig.title) {
      sheet.mergeCells(currentRow, 1, currentRow, numCols);
      const titleCell = sheet.getCell(currentRow, 1);
      titleCell.value = `${options.brandName ? options.brandName.toUpperCase() + ' — ' : ''}${tabConfig.title}`;
      titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tabHeaderColor } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(currentRow).height = 28;
      currentRow++;
    }

    if (tabConfig.subtitle) {
      const lang = options.lang || 'es';
      const labels = I18N_LABELS[lang] || I18N_LABELS.es;
      sheet.mergeCells(currentRow, 1, currentRow, numCols);
      const subCell = sheet.getCell(currentRow, 1);
      subCell.value = `${tabConfig.subtitle} | ${labels.date}: ${new Date().toLocaleDateString(labels.locale)}`;
      subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '496074' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(currentRow).height = 20;
      currentRow++;
    }

    if (tabConfig.title || tabConfig.subtitle) {
      currentRow++;
    }

    if (tabConfig.kpis && tabConfig.kpis.length > 0) {
      tabConfig.kpis.forEach((kpi, index) => {
        const colStart = (index * 2) + 1;
        const colEnd = colStart + 1;
        if (colEnd <= numCols) {
          sheet.mergeCells(currentRow, colStart, currentRow, colEnd);
          sheet.mergeCells(currentRow + 1, colStart, currentRow + 1, colEnd);

          const labelCell = sheet.getCell(currentRow, colStart);
          labelCell.value = kpi.label.toUpperCase();
          labelCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '5A738E' } };
          labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };

          const valCell = sheet.getCell(currentRow + 1, colStart);
          valCell.value = kpi.value;
          valCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: '0F2942' } };
          valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };
        }
      });
      currentRow += 3;
    }

    const headerRow = sheet.getRow(currentRow);
    tabConfig.headers.forEach((headerText, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = headerText;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tabHeaderColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'D2DDE6' } },
        bottom: { style: 'medium', color: { argb: 'B0C4DE' } },
        left: { style: 'thin', color: { argb: 'D2DDE6' } },
        right: { style: 'thin', color: { argb: 'D2DDE6' } },
      };
    });
    headerRow.height = 24;
    currentRow++;

    tabConfig.rows.forEach((rowData, rIdx) => {
      const r = sheet.getRow(currentRow);
      const isEven = rIdx % 2 === 0;
      const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      rowData.forEach((val, cIdx) => {
        const cell = r.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10.5, color: { argb: '102033' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: typeof val === 'number' ? 'right' : 'left',
        };
        if (tabConfig.columnFormats && tabConfig.columnFormats[cIdx]) {
          cell.numFmt = tabConfig.columnFormats[cIdx];
        } else if (typeof val === 'number') {
          cell.numFmt = Number.isInteger(val) ? '#,##0' : '#,##0.00';
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'E1E9F0' } },
          bottom: { style: 'thin', color: { argb: 'E1E9F0' } },
          left: { style: 'thin', color: { argb: 'E1E9F0' } },
          right: { style: 'thin', color: { argb: 'E1E9F0' } },
        };
      });
      r.height = 20;
      currentRow++;
    });

    tabConfig.headers.forEach((h, colIdx) => {
      let maxLen = h ? String(h).length : 10;
      tabConfig.rows.forEach(row => {
        const rawVal = row[colIdx];
        let cellVal = rawVal != null ? String(rawVal) : '';
        if (typeof rawVal === 'number') {
          cellVal = rawVal.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(rawVal) ? 0 : 2 });
        }
        if (cellVal.length < 60) {
          maxLen = Math.max(maxLen, cellVal.length);
        }
      });
      const col = sheet.getColumn(colIdx + 1);
      col.width = Math.min(Math.max(maxLen + 4, 12), 42);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`;
  return { blob, filename };
}

/* ==========================================================================
   EXPORT MULTIPLE FILES AS A COMPRESSED ZIP ARCHIVE
   ========================================================================== */

export interface ZipFileItem {
  name: string;
  blob: Blob | Uint8Array | ArrayBuffer | string;
}

/**
 * Packages multiple files into a single `.zip` file and triggers a browser download.
 * Completely avoids popup and multi-download blocking in modern browsers.
 */
export async function exportFilesToZip(zipFilename: string, files: ZipFileItem[]): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach(f => {
    zip.file(f.name, f.blob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  a.click();
  window.URL.revokeObjectURL(url);
}

