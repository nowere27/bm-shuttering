// Render a design's resolved pages to images (imperative Konva, offscreen) and
// assemble a single multi-page PDF via pdf-lib.

import Konva from 'konva';
import { PDFDocument } from 'pdf-lib';
import { ChallanDesign, ChallanRenderInput, RenderPage } from './types';
import { paginate } from './paginate';

function fontStyleString(bold: boolean, italic: boolean): string {
  const parts: string[] = [];
  if (italic) parts.push('italic');
  if (bold) parts.push('bold');
  return parts.join(' ') || 'normal';
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load background image'));
    img.src = url;
  });
}

function renderPageToJpeg(
  page: RenderPage,
  bg: HTMLImageElement | null,
  renderWidth: number,
  renderHeight: number,
  pixelRatio: number,
): string {
  const container = document.createElement('div');
  const stage = new Konva.Stage({ container, width: renderWidth, height: renderHeight });
  const layer = new Konva.Layer();
  stage.add(layer);

  if (bg) {
    layer.add(new Konva.Image({ image: bg, x: 0, y: 0, width: renderWidth, height: renderHeight }));
  } else {
    layer.add(new Konva.Rect({ x: 0, y: 0, width: renderWidth, height: renderHeight, fill: '#ffffff' }));
  }

  const addText = (
    text: string,
    xFrac: number,
    yFrac: number,
    wFrac: number,
    style: { fontSize: number; fontFamily: string; bold: boolean; italic: boolean; fill: string; align: 'left' | 'center' | 'right' },
  ) => {
    if (!text) return;
    layer.add(
      new Konva.Text({
        text,
        x: xFrac * renderWidth,
        y: yFrac * renderHeight,
        width: wFrac ? wFrac * renderWidth : undefined,
        fontSize: style.fontSize * renderHeight,
        fontFamily: style.fontFamily,
        fontStyle: fontStyleString(style.bold, style.italic),
        fill: style.fill,
        align: style.align,
      }),
    );
  };

  page.fields.forEach((f) => addText(f.text, f.x, f.y, f.w, f.style));
  page.rows.forEach((row) => row.cells.forEach((c) => addText(c.text, c.x, row.y, c.w, c.style)));

  layer.draw();
  const dataUrl = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.95, pixelRatio });
  stage.destroy();
  return dataUrl;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ExportResult {
  pageCount: number;
}

// Full path: paginate -> render each page -> multi-page PDF -> download.
export async function exportChallanToPdf(
  design: ChallanDesign,
  input: ChallanRenderInput,
  filename: string,
  pixelRatio = 2,
): Promise<ExportResult> {
  const pages = paginate(design.config, input);

  const renderWidth = design.background_width || 1240;
  const aspect =
    design.background_width && design.background_height
      ? design.background_height / design.background_width
      : 1.4142;
  const renderHeight = renderWidth * aspect;

  // Fonts (Gujarati) must be ready before rasterizing to canvas.
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* non-fatal */
    }
  }

  const bg = design.background_url ? await loadImage(design.background_url) : null;

  const pdf = await PDFDocument.create();
  for (const page of pages) {
    const jpeg = renderPageToJpeg(page, bg, renderWidth, renderHeight, pixelRatio);
    const embedded = await pdf.embedJpg(dataUrlToBytes(jpeg));
    const pageWidthPt = 595; // A4-ish width in points
    const pageHeightPt = pageWidthPt * (embedded.height / embedded.width);
    const pdfPage = pdf.addPage([pageWidthPt, pageHeightPt]);
    pdfPage.drawImage(embedded, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });
  }

  const pdfBytes = await pdf.save();
  triggerDownload(pdfBytes, filename);
  return { pageCount: pages.length };
}
