// Pure pagination engine: turns a design + one challan's data into concrete,
// resolved pages. Splitting a big order across multiple challans is just
// slicing the row list by rowsPerPage — this is what removes the old
// hard-coded 10-row cap in ReceiptTemplate.tsx.

import {
  ChallanRenderInput,
  DesignConfig,
  RenderPage,
  ResolvedField,
  ResolvedRow,
} from './types';
import { resolveCellText, resolveFieldText } from './dataKeys';

export function paginate(config: DesignConfig, input: ChallanRenderInput): RenderPage[] {
  const band = config.band;
  const rows = input.rows;
  const rowsPerPage = Math.max(1, Math.floor(band.rowsPerPage) || 1);

  const pageCount =
    band.enabled && rows.length > 0 ? Math.max(1, Math.ceil(rows.length / rowsPerPage)) : 1;

  const pages: RenderPage[] = [];

  for (let p = 0; p < pageCount; p++) {
    const ctx = { pageNumber: p + 1, pageCount };

    const fields: ResolvedField[] = config.fields
      .filter(
        (f) =>
          f.printOn === 'every' ||
          (f.printOn === 'first' && p === 0) ||
          (f.printOn === 'last' && p === pageCount - 1),
      )
      .map((f) => ({
        id: f.id,
        text: resolveFieldText(f.key, input, ctx, f.staticText),
        x: f.x,
        y: f.y,
        w: f.w,
        style: f.style,
      }));

    const resolvedRows: ResolvedRow[] = [];
    if (band.enabled) {
      const start = p * rowsPerPage;
      const slice = rows.slice(start, start + rowsPerPage);
      slice.forEach((row, i) => {
        const y = band.firstRowY + i * band.rowHeight;
        const cells = band.columns
          // In preprinted mode the item names are already on the paper, so we
          // never draw the name column over them.
          .filter((col) => band.labels === 'dynamic' || col.field !== 'name')
          .map((col) => ({
            text: resolveCellText(col.field, row, start + i + 1),
            x: col.x,
            w: col.w,
            style: col.style,
          }));
        resolvedRows.push({ y, cells });
      });
    }

    pages.push({ pageIndex: p, pageCount, fields, rows: resolvedRows });
  }

  return pages;
}
