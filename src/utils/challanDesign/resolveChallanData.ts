// Bridge between the app's challan data (plate_sizes + ItemsData) and the
// engine's ChallanRenderInput.

import { ItemsData, PlateSize } from '../../components/ItemsTable';
import { ChallanDesign, ChallanKind, ChallanRenderInput, ChallanRow } from './types';

export interface ChallanMeta {
  challanType: ChallanKind;
  challanNumber: string;
  date: string;
  clientName: string;
  clientNicName?: string;
  site: string;
  phone: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
}

interface BuildParams {
  design: ChallanDesign;
  plateSizes: PlateSize[];
  items: ItemsData;
  meta: ChallanMeta;
}

// Produce the ordered row list for a design's category, then the full engine
// input. In "preprinted" mode we keep every size (including zeros) in sort
// order so rows line up with the labels printed on the paper; in "dynamic"
// mode we keep only rows that actually have data.
export function buildRenderInput({ design, plateSizes, items, meta }: BuildParams): ChallanRenderInput {
  const category = design.category;

  const categorySizes = plateSizes
    .filter((ps) => (ps.category || 'shuttering') === category)
    .sort((a, b) => a.sort_order - b.sort_order);

  const toRow = (ps: PlateSize): ChallanRow => {
    const it = items.items?.[ps.id] || { qty: 0, borrowed: 0, lost: 0, damaged: 0, note: '' };
    const qty = it.qty || 0;
    const borrowed = it.borrowed || 0;
    const lost = it.lost || 0;
    const damaged = it.damaged || 0;
    // total stays the physical returned count; lost/damaged print in their own columns
    return { name: ps.name, qty, borrowed, lost, damaged, total: qty + borrowed, note: it.note || '' };
  };

  const preprinted = design.config.band.labels === 'preprinted';
  const rows: ChallanRow[] = preprinted
    ? categorySizes.map(toRow)
    : categorySizes.map(toRow).filter((r) => r.qty > 0 || r.borrowed > 0 || (r.lost || 0) > 0 || (r.damaged || 0) > 0 || !!r.note);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return {
    challanType: meta.challanType,
    challanNumber: meta.challanNumber,
    date: meta.date,
    clientName: meta.clientName,
    clientNicName: meta.clientNicName,
    site: meta.site,
    phone: meta.phone,
    driverName: meta.driverName,
    driverPhone: meta.driverPhone,
    vehicleNumber: meta.vehicleNumber,
    mainNote: items.main_note,
    rows,
    grandTotal,
  };
}
