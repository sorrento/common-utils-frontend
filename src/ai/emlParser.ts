import { EmlAttachment, ParsedEmlResult, PreparedAiDocument } from '../../../common-utils-shared';

export type { EmlAttachment, ParsedEmlResult, PreparedAiDocument };

/**
 * Decodifica Base64 a Uint8Array de forma segura en navegador
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '');
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodifica Quoted-Printable (ej: =C3=B1, =20, =3D)
 */
export function decodeQuotedPrintable(str: string): string {
  const bytes: number[] = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '=' && i + 2 < str.length && /[0-9A-Fa-f]{2}/.test(str.substring(i + 1, i + 3))) {
      bytes.push(parseInt(str.substring(i + 1, i + 3), 16));
      i += 3;
    } else if (str[i] === '=' && (str[i + 1] === '\r' || str[i + 1] === '\n')) {
      // Soft line break
      if (str[i + 1] === '\r' && str[i + 2] === '\n') {
        i += 3;
      } else {
        i += 2;
      }
    } else {
      const code = str.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else {
        // Multi-byte encode
        const encoded = new TextEncoder().encode(str[i]);
        for (let b of encoded) bytes.push(b);
      }
      i++;
    }
  }
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    return str;
  }
}

/**
 * Convierte código HTML (especialmente etiquetas <table>, <tr>, <td>) a Markdown estructurado
 */
export function htmlToStructuredMarkdown(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Convertir tablas HTML a tablas Markdown
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return;

    let mdTable = '\n\n';
    let isFirstRow = true;
    let colCount = 0;

    rows.forEach((row, rowIdx) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      if (cells.length === 0) return;

      if (isFirstRow) {
        colCount = cells.length;
        mdTable += '| ' + cells.map(c => (c.textContent || '').trim().replace(/\|/g, '-')).join(' | ') + ' |\n';
        mdTable += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
        isFirstRow = false;
      } else {
        const cellTexts = cells.map(c => (c.textContent || '').trim().replace(/\|/g, '-'));
        // Pad if necessary
        while (cellTexts.length < colCount) cellTexts.push('');
        mdTable += '| ' + cellTexts.slice(0, colCount).join(' | ') + ' |\n';
      }
    });
    mdTable += '\n';

    // Reemplazar la tabla original en el DOM con un elemento de texto
    const textNode = doc.createTextNode(mdTable);
    table.parentNode?.replaceChild(textNode, table);
  });

  // Limpiar espacios y retornos
  let result = doc.body.textContent || '';
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  return result;
}

/**
 * Parsea el contenido MIME completo de un archivo .eml
 */
export async function parseEmlFile(file: File): Promise<ParsedEmlResult> {
  const buffer = await file.arrayBuffer();
  const rawContent = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

  const result: ParsedEmlResult = {
    subject: '',
    from: '',
    to: '',
    date: '',
    textBody: '',
    htmlBody: '',
    markdownBody: '',
    attachments: [],
    inlineImages: []
  };

  // Separar Cabecera principal del Cuerpo
  const headerEndMatch = rawContent.search(/\r?\n\r?\n/);
  if (headerEndMatch === -1) {
    result.textBody = rawContent;
    result.markdownBody = rawContent;
    return result;
  }

  const rawHeaders = rawContent.substring(0, headerEndMatch);
  const rawBody = rawContent.substring(headerEndMatch).trim();

  // Parsear Headers
  const headerLines = rawHeaders.split(/\r?\n(?=[^\s])/);
  let mainContentType = 'text/plain';
  let boundary = '';

  headerLines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const name = line.substring(0, colonIdx).trim().toLowerCase();
    let val = line.substring(colonIdx + 1).trim();

    // Decode RFC 2047 (=?UTF-8?B?...?= o =?UTF-8?Q?...?=)
    val = val.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
      try {
        if (encoding.toUpperCase() === 'B') {
          return new TextDecoder(charset).decode(base64ToUint8Array(text));
        } else {
          return decodeQuotedPrintable(text.replace(/_/g, ' '));
        }
      } catch {
        return text;
      }
    });

    if (name === 'subject') result.subject = val;
    else if (name === 'from') result.from = val;
    else if (name === 'to') result.to = val;
    else if (name === 'date') result.date = val;
    else if (name === 'content-type') {
      mainContentType = val;
      const bMatch = val.match(/boundary=["']?([^"';]+)["']?/i);
      if (bMatch) boundary = bMatch[1];
    }
  });

  // Si no es multipart, parsear cuerpo directo
  if (!boundary) {
    let bodyText = rawBody;
    if (/quoted-printable/i.test(rawHeaders)) {
      bodyText = decodeQuotedPrintable(bodyText);
    }
    if (/html/i.test(mainContentType)) {
      result.htmlBody = bodyText;
      result.markdownBody = htmlToStructuredMarkdown(bodyText);
    } else {
      result.textBody = bodyText;
      result.markdownBody = bodyText;
    }
    return result;
  }

  // Parsear Partes MIME recursivamente / por boundary
  parseMimeParts(rawBody, boundary, result);

  if (result.htmlBody && !result.markdownBody) {
    result.markdownBody = htmlToStructuredMarkdown(result.htmlBody);
  } else if (!result.markdownBody) {
    result.markdownBody = result.textBody;
  }

  return result;
}

/**
 * Parsea sub-partes delimitadas por Boundary
 */
function parseMimeParts(body: string, boundary: string, result: ParsedEmlResult) {
  const parts = body.split(new RegExp(`--${boundary}(?:--)?`));

  for (let part of parts) {
    part = part.trim();
    if (!part || part === '--') continue;

    const headerEnd = part.search(/\r?\n\r?\n/);
    if (headerEnd === -1) continue;

    const partHeaders = part.substring(0, headerEnd);
    let partBody = part.substring(headerEnd).trim();

    let partContentType = 'text/plain';
    let partEncoding = '';
    let partFilename = '';
    let contentId = '';
    let isInline = false;
    let subBoundary = '';

    const lines = partHeaders.split(/\r?\n(?=[^\s])/);
    for (let l of lines) {
      const colIdx = l.indexOf(':');
      if (colIdx === -1) continue;
      const hName = l.substring(0, colIdx).trim().toLowerCase();
      const hVal = l.substring(colIdx + 1).trim();

      if (hName === 'content-type') {
        partContentType = hVal;
        const subBMatch = hVal.match(/boundary=["']?([^"';]+)["']?/i);
        if (subBMatch) subBoundary = subBMatch[1];
        const fnMatch = hVal.match(/name=["']?([^"';]+)["']?/i);
        if (fnMatch) partFilename = fnMatch[1];
      } else if (hName === 'content-transfer-encoding') {
        partEncoding = hVal.toLowerCase();
      } else if (hName === 'content-disposition') {
        if (/inline/i.test(hVal)) isInline = true;
        const fnMatch = hVal.match(/filename=["']?([^"';]+)["']?/i);
        if (fnMatch) partFilename = fnMatch[1];
      } else if (hName === 'content-id') {
        contentId = hVal.replace(/[<>]/g, '').trim();
      }
    }

    // Si tiene sub-boundary (ej. multipart/alternative dentro de multipart/mixed)
    if (subBoundary) {
      parseMimeParts(partBody, subBoundary, result);
      continue;
    }

    // Procesar texto
    if (/text\/plain/i.test(partContentType) && !partFilename) {
      if (partEncoding === 'base64') {
        try {
          const u8 = base64ToUint8Array(partBody);
          result.textBody = new TextDecoder('utf-8').decode(u8);
        } catch {}
      } else if (partEncoding === 'quoted-printable') {
        result.textBody = decodeQuotedPrintable(partBody);
      } else {
        result.textBody = partBody;
      }
    } else if (/text\/html/i.test(partContentType) && !partFilename) {
      if (partEncoding === 'base64') {
        try {
          const u8 = base64ToUint8Array(partBody);
          result.htmlBody = new TextDecoder('utf-8').decode(u8);
        } catch {}
      } else if (partEncoding === 'quoted-printable') {
        result.htmlBody = decodeQuotedPrintable(partBody);
      } else {
        result.htmlBody = partBody;
      }
    } else {
      // Es un archivo adjunto o una imagen inline (captura de pantalla)
      try {
        const cleanMime = partContentType.split(';')[0].trim().toLowerCase();
        let bytes: Uint8Array;

        if (partEncoding === 'base64') {
          bytes = base64ToUint8Array(partBody);
        } else if (partEncoding === 'quoted-printable') {
          const decodedStr = decodeQuotedPrintable(partBody);
          bytes = new TextEncoder().encode(decodedStr);
        } else {
          bytes = new TextEncoder().encode(partBody);
        }

        const fallbackName = cleanMime.startsWith('image/')
          ? `table_capture_${Date.now()}.${cleanMime.split('/')[1] || 'png'}`
          : `attachment_${Date.now()}`;
        const fileName = partFilename || fallbackName;

        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: cleanMime });
        const fileObj = new File([blob], fileName, { type: cleanMime });

        const attachmentObj: EmlAttachment = {
          filename: fileName,
          mimeType: cleanMime,
          blob,
          file: fileObj,
          isInlineImage: cleanMime.startsWith('image/'),
          contentId
        };

        if (cleanMime.startsWith('image/')) {
          result.inlineImages.push(attachmentObj);
        } else {
          result.attachments.push(attachmentObj);
        }
      } catch (err) {
        console.warn('Error decodificando adjunto de EML:', err);
      }
    }
  }
}

/**
 * Prepara un archivo .eml (o cualquier archivo arrastrado) para el motor de IA Universal Reader.
 * Selecciona inteligentemente el formato con mayor densidad informativa:
 * 1. Adjunto PDF/Excel si existe
 * 2. Imagen/captura de tabla inline si existe (para Gemini Vision)
 * 3. Texto estructurado con tablas Markdown
 */
export async function prepareEmlForAi(file: File): Promise<PreparedAiDocument> {
  const isEml = file.name.toLowerCase().endsWith('.eml') || file.type === 'message/rfc822';

  if (!isEml) {
    return {
      file,
      fileName: file.name,
      sourceType: file.type.startsWith('image/') ? 'image' : 'attachment'
    };
  }

  const parsed = await parseEmlFile(file);

  // Metadatos de cabecera formateados como contexto
  const headerContext = [
    parsed.subject ? `Subject: ${parsed.subject}` : '',
    parsed.from ? `From: ${parsed.from}` : '',
    parsed.date ? `Date: ${parsed.date}` : ''
  ].filter(Boolean).join('\n');

  // 1. Si hay un PDF o Excel adjunto, es la fuente primaria más rica
  const priorityDocAttachment = parsed.attachments.find(a => 
    /\.(pdf|xlsx|xls|csv)$/i.test(a.filename) || 
    a.mimeType === 'application/pdf' || 
    a.mimeType.includes('spreadsheet') || 
    a.mimeType.includes('excel')
  );

  if (priorityDocAttachment) {
    return {
      file: priorityDocAttachment.file,
      fileName: `${file.name} -> ${priorityDocAttachment.filename}`,
      additionalContext: `Extracted from Email:\n${headerContext}\n\nEmail Body:\n${parsed.markdownBody || parsed.textBody}`,
      sourceType: 'attachment'
    };
  }

  // 2. Si hay imágenes inline (capturas de pantalla de tablas), enviar a Gemini Vision
  if (parsed.inlineImages.length > 0) {
    const primaryImage = parsed.inlineImages[0];
    return {
      file: primaryImage.file,
      fileName: `${file.name} -> ${primaryImage.filename}`,
      additionalContext: `Extracted from Email with Table Screenshot:\n${headerContext}\n\nEmail Body:\n${parsed.markdownBody || parsed.textBody}`,
      sourceType: 'image'
    };
  }

  // 3. Si hay otros adjuntos
  if (parsed.attachments.length > 0) {
    const att = parsed.attachments[0];
    return {
      file: att.file,
      fileName: `${file.name} -> ${att.filename}`,
      additionalContext: `Extracted from Email:\n${headerContext}`,
      sourceType: 'attachment'
    };
  }

  // 4. Texto enriquecido con tablas Markdown
  const fullText = [
    headerContext,
    '--- Email Body ---',
    parsed.markdownBody || parsed.textBody || '(Empty email body)'
  ].filter(Boolean).join('\n\n');

  return {
    textContent: fullText,
    fileName: file.name,
    sourceType: parsed.htmlBody?.includes('<table') ? 'table' : 'text'
  };
}
