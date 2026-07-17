// Supabase CRUD for challan designs.
//
// The background image is stored INLINE as a base64 data URL in the
// `background_path` column (one image per design). This intentionally avoids
// Supabase Storage: on projects using the new ES256 JWT signing keys the
// storage-api can reject authenticated tokens, whereas PostgREST (regular table
// access) works. Going through the table sidesteps that entirely — same RLS as
// every other table in the app. Large uploads are downscaled first to keep rows
// small and exports crisp.

import { supabase } from '../supabase';
import {
  ChallanDesign,
  DesignChallanType,
  DesignConfig,
  ItemCategory,
  emptyConfig,
} from './types';

const BUCKET = 'challan-designs'; // legacy: only used to resolve pre-existing storage paths
const MAX_DIM = 1600; // px — downscale ceiling for stored backgrounds

interface DesignRow {
  id: string;
  name: string;
  category: ItemCategory;
  challan_type: DesignChallanType;
  background_path: string | null;
  background_width: number;
  background_height: number;
  config: DesignConfig | Record<string, never>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// Inline data URLs are used as-is; anything else is treated as a legacy storage path.
function resolveBackgroundUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('data:')) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function rowToDesign(row: DesignRow): ChallanDesign {
  const config =
    row.config && (row.config as DesignConfig).version ? (row.config as DesignConfig) : emptyConfig();
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    challan_type: row.challan_type,
    background_path: row.background_path,
    background_url: resolveBackgroundUrl(row.background_path),
    background_width: row.background_width,
    background_height: row.background_height,
    config,
    is_default: row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listDesigns(): Promise<ChallanDesign[]> {
  const { data, error } = await supabase
    .from('challan_designs')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as DesignRow[]).map(rowToDesign);
}

// Designs that apply to a given challan flow + item category, default first.
export async function getDesignsFor(
  category: ItemCategory,
  challanType: 'udhar' | 'jama',
): Promise<ChallanDesign[]> {
  const { data, error } = await supabase
    .from('challan_designs')
    .select('*')
    .eq('category', category)
    .in('challan_type', [challanType, 'both'])
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as DesignRow[]).map(rowToDesign);
}

export async function getDesign(id: string): Promise<ChallanDesign | null> {
  const { data, error } = await supabase.from('challan_designs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToDesign(data as DesignRow) : null;
}

export interface SaveDesignInput {
  id?: string;
  name: string;
  category: ItemCategory;
  challan_type: DesignChallanType;
  background_path: string | null;
  background_width: number;
  background_height: number;
  config: DesignConfig;
  is_default: boolean;
}

export async function saveDesign(input: SaveDesignInput): Promise<ChallanDesign> {
  // Only one default per (category, challan_type). Clear others first if this is default.
  if (input.is_default) {
    await supabase
      .from('challan_designs')
      .update({ is_default: false })
      .eq('category', input.category)
      .eq('challan_type', input.challan_type);
  }

  const payload = {
    name: input.name,
    category: input.category,
    challan_type: input.challan_type,
    background_path: input.background_path,
    background_width: input.background_width,
    background_height: input.background_height,
    config: input.config,
    is_default: input.is_default,
  };

  const query = input.id
    ? supabase.from('challan_designs').update(payload).eq('id', input.id).select().single()
    : supabase.from('challan_designs').insert(payload).select().single();

  const { data, error } = await query;
  if (error) throw error;
  return rowToDesign(data as DesignRow);
}

export async function deleteDesign(design: ChallanDesign): Promise<void> {
  const { error } = await supabase.from('challan_designs').delete().eq('id', design.id);
  if (error) throw error;
  // Clean up only legacy storage-backed backgrounds; inline data URLs need nothing.
  if (design.background_path && !design.background_path.startsWith('data:')) {
    await supabase.storage.from(BUCKET).remove([design.background_path]);
  }
}

export interface UploadedBackground {
  path: string; // inline data URL, stored in background_path
  url: string;
  width: number;
  height: number;
}

// Read an image file, downscaling to MAX_DIM, and return a base64 data URL plus
// its (possibly reduced) natural dimensions. No network — purely client-side.
export function uploadBackground(file: File): Promise<UploadedBackground> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const originalUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        let { naturalWidth: w, naturalHeight: h } = img;
        if (Math.max(w, h) <= MAX_DIM) {
          resolve({ path: originalUrl, url: originalUrl, width: w, height: h });
          return;
        }
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ path: originalUrl, url: originalUrl, width: img.naturalWidth, height: img.naturalHeight });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const scaledUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve({ path: scaledUrl, url: scaledUrl, width: w, height: h });
      };
      img.src = originalUrl;
    };
    reader.readAsDataURL(file);
  });
}
