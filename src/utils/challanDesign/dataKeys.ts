// Registry of bindable data keys and how each resolves to text.

import { BandColumnField, ChallanRenderInput, ChallanRow } from './types';

export interface FieldKeyDef {
  key: string;
  label: string;       // English label shown in the palette
  labelGu: string;     // Gujarati label
}

// Single-value fields the user can drop onto a design.
export const FIELD_KEYS: FieldKeyDef[] = [
  { key: 'challanNumber', label: 'Challan No.', labelGu: 'ચલણ નં.' },
  { key: 'challanType', label: 'Challan Type', labelGu: 'ચલણ પ્રકાર' },
  { key: 'date', label: 'Date', labelGu: 'તારીખ' },
  { key: 'clientName', label: 'Client Name', labelGu: 'ગ્રાહકનું નામ' },
  { key: 'clientNicName', label: 'Client Short Name', labelGu: 'ટૂંકું નામ' },
  { key: 'site', label: 'Site', labelGu: 'સાઇટ' },
  { key: 'phone', label: 'Phone', labelGu: 'ફોન' },
  { key: 'driverName', label: 'Driver Name', labelGu: 'ડ્રાઈવર નામ' },
  { key: 'driverPhone', label: 'Driver Phone', labelGu: 'ડ્રાઈવર ફોન' },
  { key: 'vehicleNumber', label: 'Vehicle Number', labelGu: 'ગાડી નંબર' },
  { key: 'grandTotal', label: 'Grand Total', labelGu: 'કુલ સરવાળો' },
  { key: 'mainNote', label: 'Main Note', labelGu: 'મુખ્ય નોંધ' },
  { key: 'pageNumber', label: 'Page Number', labelGu: 'પાનું નં.' },
  { key: 'pageCount', label: 'Total Pages', labelGu: 'કુલ પાનાં' },
  { key: 'pageLabel', label: 'Page X of Y', labelGu: 'પાનું X / Y' },
  { key: 'literal', label: 'Static Text', labelGu: 'સ્થિર લખાણ' },
];

export const BAND_COLUMN_FIELDS: Array<{ field: BandColumnField; label: string; labelGu: string }> = [
  { field: 'index', label: 'Row No.', labelGu: 'ક્રમ' },
  { field: 'name', label: 'Item / Size', labelGu: 'આઈટમ / સાઇઝ' },
  { field: 'qty', label: 'Quantity', labelGu: 'નંગ' },
  { field: 'borrowed', label: 'Marco (Borrowed)', labelGu: 'બીજો ડેપો' },
  { field: 'lost', label: 'Lost', labelGu: 'ગુમ' },
  { field: 'damaged', label: 'Damaged', labelGu: 'નુકસાન' },
  { field: 'total', label: 'Total', labelGu: 'કુલ' },
  { field: 'note', label: 'Note', labelGu: 'નોંધ' },
];

export function fieldKeyLabel(key: string, gu = false): string {
  const def = FIELD_KEYS.find((k) => k.key === key);
  if (!def) return key;
  return gu ? def.labelGu : def.label;
}

export function bandFieldLabel(field: BandColumnField, gu = false): string {
  const def = BAND_COLUMN_FIELDS.find((f) => f.field === field);
  if (!def) return field;
  return gu ? def.labelGu : def.label;
}

export interface PageContext {
  pageNumber: number; // 1-based
  pageCount: number;
}

// Resolve a single-value field key to display text.
export function resolveFieldText(
  key: string,
  input: ChallanRenderInput,
  ctx: PageContext,
  staticText?: string,
): string {
  switch (key) {
    case 'challanNumber': return input.challanNumber ?? '';
    case 'challanType': return input.challanType === 'jama' ? 'જમા' : 'ઉધાર';
    case 'date': return input.date ?? '';
    case 'clientName': return input.clientName ?? '';
    case 'clientNicName': return input.clientNicName ?? '';
    case 'site': return input.site ?? '';
    case 'phone': return input.phone ?? '';
    case 'driverName': return input.driverName ?? '';
    case 'driverPhone': return input.driverPhone ?? '';
    case 'vehicleNumber': return input.vehicleNumber ?? '';
    case 'grandTotal': return input.grandTotal ? String(input.grandTotal) : '';
    case 'mainNote': return input.mainNote ?? '';
    case 'pageNumber': return String(ctx.pageNumber);
    case 'pageCount': return String(ctx.pageCount);
    case 'pageLabel': return `${ctx.pageNumber} / ${ctx.pageCount}`;
    case 'literal': return staticText ?? '';
    default: return '';
  }
}

// Resolve a row-band column to display text for a given row.
export function resolveCellText(
  field: BandColumnField,
  row: ChallanRow,
  rowNumberOverall: number,
): string {
  switch (field) {
    case 'index': return String(rowNumberOverall);
    case 'name': return row.name ?? '';
    case 'qty': return row.qty ? String(row.qty) : '';
    case 'borrowed': return row.borrowed ? String(row.borrowed) : '';
    case 'lost': return row.lost ? String(row.lost) : '';
    case 'damaged': return row.damaged ? String(row.damaged) : '';
    case 'total': return row.total ? String(row.total) : '';
    case 'note': return row.note ?? '';
    default: return '';
  }
}
