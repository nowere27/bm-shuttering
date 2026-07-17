import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  Eye,
  Pencil,
  LayoutGrid,
  Image as ImageIcon,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import DesignEditorCanvas, { Selection } from '../components/challanDesign/DesignEditorCanvas';
import DesignStage from '../components/challanDesign/DesignStage';
import {
  ChallanDesign,
  ChallanRenderInput,
  DEFAULT_TEXT_STYLE,
  DesignChallanType,
  DesignConfig,
  ItemCategory,
  PlacedField,
  PrintOn,
  RowBand,
  TextStyle,
  emptyConfig,
} from '../utils/challanDesign/types';
import { BAND_COLUMN_FIELDS, FIELD_KEYS, fieldKeyLabel } from '../utils/challanDesign/dataKeys';
import { paginate } from '../utils/challanDesign/paginate';
import {
  deleteDesign,
  listDesigns,
  saveDesign,
  uploadBackground,
} from '../utils/challanDesign/designStorage';

type Draft = Omit<ChallanDesign, 'id'> & { id?: string };

const CATEGORY_OPTIONS: Array<{ value: ItemCategory; label: string }> = [
  { value: 'shuttering', label: 'Shuttering Plates' },
  { value: 'jack', label: 'Iron Jacks' },
  { value: 'cuplock', label: 'Cuplock' },
  { value: 'other', label: 'Other' },
];

const CHALLAN_TYPE_OPTIONS: Array<{ value: DesignChallanType; label: string }> = [
  { value: 'both', label: 'Both (Udhar + Jama)' },
  { value: 'udhar', label: 'Udhar' },
  { value: 'jama', label: 'Jama' },
];

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

function newDraft(): Draft {
  return {
    name: '',
    category: 'shuttering',
    challan_type: 'both',
    background_path: null,
    background_url: null,
    background_width: 0,
    background_height: 0,
    config: emptyConfig(),
    is_default: false,
  };
}

function sampleInput(draft: Draft): ChallanRenderInput {
  const preprinted = draft.config.band.labels === 'preprinted';
  const count = preprinted ? draft.config.band.rowsPerPage + 3 : 6; // +3 forces overflow preview
  const rows = Array.from({ length: count }).map((_, i) => {
    const qty = (i * 3 + 2) % 9;
    const borrowed = i % 2;
    return {
      name: `આઈટમ ${i + 1}`,
      qty,
      borrowed,
      total: qty + borrowed,
      note: i % 3 === 0 ? 'નોંધ' : '',
    };
  });
  return {
    challanType: draft.challan_type === 'jama' ? 'jama' : 'udhar',
    challanNumber: '1234',
    date: '18/07/2026',
    clientName: 'નમૂનો ગ્રાહક',
    clientNicName: 'ન-૧',
    site: 'સાઇટ ૧',
    phone: '9876543210',
    driverName: 'ડ્રાઈવર',
    mainNote: 'નમૂનો નોંધ',
    rows,
    grandTotal: rows.reduce((s, r) => s + r.total, 0),
  };
}

const ChallanDesigner: React.FC = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<ChallanDesign[]>([]);
  const [draft, setDraft] = useState<Draft>(newDraft());
  const [selection, setSelection] = useState<Selection>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [previewPage, setPreviewPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);

  useLayoutEffect(() => {
    const measure = () => {
      if (canvasWrapRef.current) {
        setCanvasWidth(Math.max(280, Math.min(canvasWrapRef.current.clientWidth, 760)));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setDesigns(await listDesigns());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load designs');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setConfig = (updater: (c: DesignConfig) => DesignConfig) =>
    setDraft((d) => ({ ...d, config: updater(d.config) }));

  const patchBand = (patch: Partial<RowBand>) =>
    setConfig((c) => ({ ...c, band: { ...c.band, ...patch } }));

  const loadDesign = (d: ChallanDesign) => {
    setDraft({ ...d, config: JSON.parse(JSON.stringify(d.config)) });
    setSelection(null);
    setMode('edit');
    setPreviewPage(0);
  };

  const startNew = () => {
    setDraft(newDraft());
    setSelection(null);
    setMode('edit');
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const bg = await uploadBackground(file);
      setDraft((d) => ({
        ...d,
        background_path: bg.path,
        background_url: bg.url,
        background_width: bg.width,
        background_height: bg.height,
      }));
      toast.success('Background uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addField = (key: string) => {
    const field: PlacedField = {
      id: uid(),
      key,
      x: 0.4,
      y: 0.1,
      w: 0,
      style: { ...DEFAULT_TEXT_STYLE },
      printOn: key === 'grandTotal' ? 'last' : 'every',
      staticText: key === 'literal' ? 'Text' : undefined,
    };
    setConfig((c) => ({ ...c, fields: [...c.fields, field] }));
    setSelection({ type: 'field', id: field.id });
  };

  const updateField = (id: string, patch: Partial<PlacedField>) =>
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  const updateFieldStyle = (id: string, patch: Partial<TextStyle>) =>
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f) => (f.id === id ? { ...f, style: { ...f.style, ...patch } } : f)),
    }));

  const deleteField = (id: string) => {
    setConfig((c) => ({ ...c, fields: c.fields.filter((f) => f.id !== id) }));
    setSelection(null);
  };

  const addColumn = (field: (typeof BAND_COLUMN_FIELDS)[number]['field']) => {
    const col = { id: uid(), field, x: 0.4, w: 0.1, style: { ...DEFAULT_TEXT_STYLE, align: 'center' as const } };
    setConfig((c) => ({ ...c, band: { ...c.band, columns: [...c.band.columns, col] } }));
    setSelection({ type: 'column', id: col.id });
  };

  const updateColumn = (id: string, patch: Partial<(typeof draft.config.band.columns)[number]>) =>
    setConfig((c) => ({
      ...c,
      band: { ...c.band, columns: c.band.columns.map((col) => (col.id === id ? { ...col, ...patch } : col)) },
    }));

  const updateColumnStyle = (id: string, patch: Partial<TextStyle>) =>
    setConfig((c) => ({
      ...c,
      band: {
        ...c.band,
        columns: c.band.columns.map((col) => (col.id === id ? { ...col, style: { ...col.style, ...patch } } : col)),
      },
    }));

  const deleteColumn = (id: string) => {
    setConfig((c) => ({ ...c, band: { ...c.band, columns: c.band.columns.filter((col) => col.id !== id) } }));
    setSelection(null);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('Give the design a name');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveDesign({
        id: draft.id,
        name: draft.name.trim(),
        category: draft.category,
        challan_type: draft.challan_type,
        background_path: draft.background_path,
        background_width: draft.background_width,
        background_height: draft.background_height,
        config: draft.config,
        is_default: draft.is_default,
      });
      setDraft({ ...saved, config: JSON.parse(JSON.stringify(saved.config)) });
      await refresh();
      toast.success('Design saved');
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft.id) {
      startNew();
      return;
    }
    try {
      await deleteDesign(draft as ChallanDesign);
      await refresh();
      startNew();
      toast.success('Design deleted');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const selectedField =
    selection?.type === 'field' ? draft.config.fields.find((f) => f.id === selection.id) : undefined;
  const selectedColumn =
    selection?.type === 'column' ? draft.config.band.columns.find((c) => c.id === selection.id) : undefined;

  const previewPages = mode === 'preview' ? paginate(draft.config, sampleInput(draft)) : [];
  const safePreviewPage = Math.min(previewPage, Math.max(0, previewPages.length - 1));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 w-full px-3 py-6 pb-24 sm:px-6 lg:px-8 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Challan Design Studio</h1>
                <p className="text-xs text-gray-500">Configure how exported challans are laid out</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                {mode === 'edit' ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {mode === 'edit' ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
            {/* Canvas column */}
            <div className="space-y-3">
              {/* Saved designs bar */}
              <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl border border-gray-200 p-2">
                <button
                  onClick={startNew}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                    !draft.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
                {designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => loadDesign(d)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      draft.id === d.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    title={`${d.category} · ${d.challan_type}`}
                  >
                    {d.name}
                    {d.is_default && <span className="ml-1 text-[10px] text-emerald-600">★</span>}
                  </button>
                ))}
              </div>

              <div
                ref={canvasWrapRef}
                className="bg-white rounded-xl border border-gray-200 p-2 overflow-auto flex justify-center"
              >
                {!draft.background_url && mode === 'edit' ? (
                  <label className="w-full aspect-[1/1.414] max-w-md flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 text-gray-500">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-sm font-semibold">Upload background design (PNG/JPG)</span>
                    <span className="text-xs">The scanned/printed challan template</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                  </label>
                ) : mode === 'edit' ? (
                  <DesignEditorCanvas
                    backgroundUrl={draft.background_url}
                    naturalWidth={draft.background_width}
                    naturalHeight={draft.background_height}
                    config={draft.config}
                    width={canvasWidth}
                    selection={selection}
                    onSelect={setSelection}
                    onFieldMove={(id, x, y) => updateField(id, { x, y })}
                    onBandChange={patchBand}
                    onColumnMove={(id, x) => updateColumn(id, { x })}
                  />
                ) : (
                  <div className="space-y-2">
                    {previewPages.length > 1 && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <button
                          onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                          className="px-2 py-1 rounded border border-gray-300"
                          disabled={safePreviewPage === 0}
                        >
                          ‹
                        </button>
                        <span className="font-semibold text-gray-600">
                          Page {safePreviewPage + 1} / {previewPages.length}
                        </span>
                        <button
                          onClick={() => setPreviewPage((p) => Math.min(previewPages.length - 1, p + 1))}
                          className="px-2 py-1 rounded border border-gray-300"
                          disabled={safePreviewPage >= previewPages.length - 1}
                        >
                          ›
                        </button>
                      </div>
                    )}
                    {previewPages[safePreviewPage] && (
                      <DesignStage
                        backgroundUrl={draft.background_url}
                        naturalWidth={draft.background_width}
                        naturalHeight={draft.background_height}
                        page={previewPages[safePreviewPage]}
                        width={canvasWidth}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Inspector column */}
            <div className="space-y-4">
              {/* Design meta */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Design</h3>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Design name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-gray-600">
                    Item type
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ItemCategory }))}
                      className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      {CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-600">
                    Challan type
                    <select
                      value={draft.challan_type}
                      onChange={(e) => setDraft((d) => ({ ...d, challan_type: e.target.value as DesignChallanType }))}
                      className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      {CHALLAN_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={draft.is_default}
                    onChange={(e) => setDraft((d) => ({ ...d, is_default: e.target.checked }))}
                  />
                  Default for this item + challan type
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading…' : draft.background_url ? 'Replace background' : 'Upload background'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                  </label>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </section>

              {/* Field palette */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Add value fields</h3>
                <div className="flex flex-wrap gap-1.5">
                  {FIELD_KEYS.map((k) => (
                    <button
                      key={k.key}
                      onClick={() => addField(k.key)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                    >
                      + {k.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Selected field editor */}
              {selectedField && (
                <section className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-blue-700 text-sm">{fieldKeyLabel(selectedField.key)}</h3>
                    <button onClick={() => deleteField(selectedField.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedField.key === 'literal' && (
                    <input
                      value={selectedField.staticText || ''}
                      onChange={(e) => updateField(selectedField.id, { staticText: e.target.value })}
                      placeholder="Static text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  )}
                  <TextStyleControls
                    style={selectedField.style}
                    onChange={(p) => updateFieldStyle(selectedField.id, p)}
                  />
                  <label className="block text-xs font-semibold text-gray-600">
                    Box width (0 = auto): {Math.round(selectedField.w * 100)}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedField.w * 100)}
                      onChange={(e) => updateField(selectedField.id, { w: Number(e.target.value) / 100 })}
                      className="w-full accent-blue-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-gray-600">
                    Print on
                    <select
                      value={selectedField.printOn}
                      onChange={(e) => updateField(selectedField.id, { printOn: e.target.value as PrintOn })}
                      className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="every">Every page</option>
                      <option value="first">First page only</option>
                      <option value="last">Last page only</option>
                    </select>
                  </label>
                </section>
              )}

              {/* Row band */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <label className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">Item rows (repeater)</span>
                  <input
                    type="checkbox"
                    checked={draft.config.band.enabled}
                    onChange={(e) => patchBand({ enabled: e.target.checked })}
                  />
                </label>

                {draft.config.band.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Row labels
                        <select
                          value={draft.config.band.labels}
                          onChange={(e) => patchBand({ labels: e.target.value as RowBand['labels'] })}
                          className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        >
                          <option value="preprinted">Pre-printed on paper</option>
                          <option value="dynamic">Print item names</option>
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        Rows / page
                        <input
                          type="number"
                          min={1}
                          value={draft.config.band.rowsPerPage}
                          onChange={(e) => patchBand({ rowsPerPage: Math.max(1, Number(e.target.value) || 1) })}
                          className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Drag the <span className="text-blue-600 font-semibold">blue (Row 1)</span> and{' '}
                      <span className="text-green-600 font-semibold">green (Row 2)</span> guides on the canvas to set
                      row position and spacing. Row spacing:{' '}
                      <span className="font-semibold">{(draft.config.band.rowHeight * 100).toFixed(1)}%</span>
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Columns</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {BAND_COLUMN_FIELDS.filter(
                          (f) => f.field !== 'name' || draft.config.band.labels === 'dynamic',
                        ).map((f) => (
                          <button
                            key={f.field}
                            onClick={() => addColumn(f.field)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-300"
                          >
                            + {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedColumn && (
                      <div className="border border-amber-200 rounded-lg p-3 space-y-3 bg-amber-50/40">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-700 text-sm capitalize">{selectedColumn.field} column</span>
                          <button
                            onClick={() => deleteColumn(selectedColumn.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500">Drag the amber line on the canvas to set the column's horizontal position.</p>
                        <label className="block text-xs font-semibold text-gray-600">
                          Column width: {Math.round(selectedColumn.w * 100)}%
                          <input
                            type="range"
                            min={2}
                            max={100}
                            value={Math.round(selectedColumn.w * 100)}
                            onChange={(e) => updateColumn(selectedColumn.id, { w: Number(e.target.value) / 100 })}
                            className="w-full accent-amber-600"
                          />
                        </label>
                        <TextStyleControls
                          style={selectedColumn.style}
                          onChange={(p) => updateColumnStyle(selectedColumn.id, p)}
                        />
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Shared font/color/align controls for a TextStyle.
const TextStyleControls: React.FC<{ style: TextStyle; onChange: (patch: Partial<TextStyle>) => void }> = ({
  style,
  onChange,
}) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-gray-600">
      Font size: {Math.round(style.fontSize * 1000)}
      <input
        type="range"
        min={6}
        max={70}
        value={Math.round(style.fontSize * 1000)}
        onChange={(e) => onChange({ fontSize: Number(e.target.value) / 1000 })}
        className="w-full accent-blue-600"
      />
    </label>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange({ bold: !style.bold })}
        className={`px-2.5 py-1 text-sm font-bold rounded border ${
          style.bold ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'
        }`}
      >
        B
      </button>
      <button
        onClick={() => onChange({ italic: !style.italic })}
        className={`px-2.5 py-1 text-sm italic rounded border ${
          style.italic ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'
        }`}
      >
        I
      </button>
      <div className="flex rounded border border-gray-300 overflow-hidden">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            onClick={() => onChange({ align: a })}
            className={`px-2 py-1 text-xs ${style.align === a ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
          >
            {a[0].toUpperCase()}
          </button>
        ))}
      </div>
      <input
        type="color"
        value={style.fill}
        onChange={(e) => onChange({ fill: e.target.value })}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        title="Text color"
      />
    </div>
  </div>
);

export default ChallanDesigner;
