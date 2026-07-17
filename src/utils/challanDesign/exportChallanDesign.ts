// Integration entry point used by the challan pages. Auto-selects the design
// for the challan's item category (a challan is locked to one category) and
// exports a multi-page PDF. Returns false when there is no usable design so the
// caller can fall back to the legacy JPEG template.

import { ItemsData, PlateSize } from '../../components/ItemsTable';
import { getDesignsFor } from './designStorage';
import { buildRenderInput } from './resolveChallanData';
import { ChallanKind, ItemCategory } from './types';

export function detectActiveCategory(items: ItemsData, plateSizes: PlateSize[]): ItemCategory | null {
  for (const ps of plateSizes) {
    const it = items.items?.[ps.id];
    if (it && ((it.qty || 0) > 0 || (it.borrowed || 0) > 0)) {
      return (ps.category || 'shuttering') as ItemCategory;
    }
  }
  return null;
}

export interface ExportChallanParams {
  challanType: ChallanKind;
  challanNumber: string;
  date: string; // display-formatted, e.g. 18/07/2026
  plateSizes: PlateSize[];
  items: ItemsData;
  clientName: string;
  clientNicName?: string;
  site: string;
  phone: string;
  driverName?: string;
  designId?: string; // optional override; falls back to the category default
}

export async function tryExportChallanDesign(p: ExportChallanParams): Promise<boolean> {
  const category = detectActiveCategory(p.items, p.plateSizes);
  if (!category) return false;

  const designs = await getDesignsFor(category, p.challanType);
  if (designs.length === 0) return false;

  const design = (p.designId && designs.find((d) => d.id === p.designId)) || designs[0];
  if (!design.background_url) return false;

  const input = buildRenderInput({
    design,
    plateSizes: p.plateSizes,
    items: p.items,
    meta: {
      challanType: p.challanType,
      challanNumber: p.challanNumber,
      date: p.date,
      clientName: p.clientName,
      clientNicName: p.clientNicName,
      site: p.site,
      phone: p.phone,
      driverName: p.driverName,
    },
  });

  const filename = `${p.challanType}_${p.challanNumber}_${p.date.replace(/\//g, '-')}.pdf`;
  // Load konva + pdf-lib on demand so the challan pages stay light until an
  // actual design-based export happens.
  const { exportChallanToPdf } = await import('./exportChallanPdf');
  await exportChallanToPdf(design, input, filename);
  return true;
}
