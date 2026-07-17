// Challan design engine — shared types.
//
// COORDINATE SYSTEM: everything is stored as a fraction (0..1), never pixels, so
// a design renders identically at any output resolution.
//   x, w  -> fraction of the background's natural WIDTH
//   y, h  -> fraction of the background's natural HEIGHT
//   fontSize -> fraction of the background's natural HEIGHT
// Multiply by the actual render width/height at export time to get pixels.

export type ItemCategory = 'shuttering' | 'jack' | 'cuplock' | 'other';
export type ChallanKind = 'udhar' | 'jama';
export type DesignChallanType = ChallanKind | 'both';

// On multi-page (overflow) exports, controls which pages a field is drawn on.
//   first  -> only page 1 (e.g. a header that shouldn't repeat)
//   last   -> only the final page (e.g. grand total)
//   every  -> every page (e.g. client name, challan no, page number)
export type PrintOn = 'first' | 'last' | 'every';

export interface TextStyle {
  fontSize: number;                          // fraction of height
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  fill: string;                              // CSS color
  align: 'left' | 'center' | 'right';
}

// A single value dropped onto the design (challan no, date, client, grand total…).
export interface PlacedField {
  id: string;
  key: string;                               // key from FIELD_KEYS registry
  x: number;                                 // top-left, fraction of width
  y: number;                                 // top-left, fraction of height
  w: number;                                 // box width, fraction of width
  style: TextStyle;
  printOn: PrintOn;
  staticText?: string;                       // used when key === 'literal'
}

// Which per-row value a row-band column prints.
export type BandColumnField = 'name' | 'qty' | 'borrowed' | 'note' | 'total' | 'index';

// One column of the repeating item table.
export interface BandColumn {
  id: string;
  field: BandColumnField;
  x: number;                                 // left, fraction of width (page-absolute)
  w: number;                                 // width, fraction of width
  style: TextStyle;
}

// The repeating item table region.
export interface RowBand {
  enabled: boolean;
  // preprinted: row labels are printed on the paper already; rows map 1:1 to the
  //   category's item list in sort order and no 'name' column is drawn.
  // dynamic: item set is unknown; the engine also prints the item name.
  labels: 'preprinted' | 'dynamic';
  firstRowY: number;                         // top of row 1, fraction of height
  rowHeight: number;                         // gap between rows, fraction of height (computed from two guides)
  rowsPerPage: number;                       // rows the physical design has room for
  columns: BandColumn[];
}

export interface DesignConfig {
  version: 1;
  fields: PlacedField[];
  band: RowBand;
}

// Full design row as stored in / loaded from the DB.
export interface ChallanDesign {
  id: string;
  name: string;
  category: ItemCategory;
  challan_type: DesignChallanType;
  background_path: string | null;
  background_url: string | null;             // resolved public URL (not a column)
  background_width: number;
  background_height: number;
  config: DesignConfig;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// ---- Runtime input the engine turns into pages -----------------------------

export interface ChallanRow {
  name: string;
  qty: number;
  borrowed: number;
  total: number;
  note: string;
}

export interface ChallanRenderInput {
  challanType: ChallanKind;
  challanNumber: string;
  date: string;
  clientName: string;
  clientNicName?: string;
  site: string;
  phone: string;
  driverName?: string;
  mainNote?: string;
  rows: ChallanRow[];
  grandTotal: number;
}

// ---- Engine output: concrete, resolved pages -------------------------------

export interface ResolvedField {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  style: TextStyle;
}

export interface ResolvedRow {
  y: number;                                 // fraction of height
  cells: Array<{ text: string; x: number; w: number; style: TextStyle }>;
}

export interface RenderPage {
  pageIndex: number;                         // 0-based
  pageCount: number;
  fields: ResolvedField[];
  rows: ResolvedRow[];
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 0.02,                            // 2% of height
  fontFamily: 'Noto Sans Gujarati, Arial, sans-serif',
  bold: true,
  italic: false,
  fill: '#000000',
  align: 'left',
};

export function emptyConfig(): DesignConfig {
  return {
    version: 1,
    fields: [],
    band: {
      enabled: false,
      labels: 'preprinted',
      firstRowY: 0.4,
      rowHeight: 0.04,
      rowsPerPage: 10,
      columns: [],
    },
  };
}
