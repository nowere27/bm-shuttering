import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { PlateSize } from '../components/ItemsTable';

let cachedSizes: PlateSize[] | null = null;
let fetchPromise: Promise<PlateSize[]> | null = null;

export const usePlateSizes = () => {
  const [sizes, setSizes] = useState<PlateSize[]>(cachedSizes || []);
  const [loading, setLoading] = useState<boolean>(!cachedSizes);
  const [error, setError] = useState<string | null>(null);

  const fetchSizes = async () => {
    if (cachedSizes) {
      setSizes(cachedSizes);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = supabase
        .from('plate_sizes')
        .select('*')
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error;
          cachedSizes = data || [];
          return cachedSizes;
        });
    }

    try {
      const data = await fetchPromise;
      setSizes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSize = async (name: string, category: string = 'shuttering') => {
    try {
      const { data, error } = await supabase
        .from('plate_sizes')
        .insert([{ name, sort_order: sizes.length + 1, category }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Also add to stock table
      await supabase.from('stock').insert([{ size: data.id }]);
      
      cachedSizes = null;
      fetchPromise = null;
      await fetchSizes();
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateSizesOrder = async (orderedSizes: PlateSize[]) => {
    try {
      const updates = orderedSizes.map((size, index) => ({
        id: size.id,
        name: size.name,
        sort_order: index + 1,
        category: size.category || 'shuttering'
      }));

      const { error } = await supabase
        .from('plate_sizes')
        .upsert(updates);

      if (error) throw error;

      cachedSizes = null;
      fetchPromise = null;
      await fetchSizes();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteSize = async (sizeId: number) => {
    try {
      const { error: stockDeleteError } = await supabase
        .from('stock')
        .delete()
        .eq('size', sizeId);

      if (stockDeleteError) throw stockDeleteError;

      const { error: sizeDeleteError } = await supabase
        .from('plate_sizes')
        .delete()
        .eq('id', sizeId);

      if (sizeDeleteError) throw sizeDeleteError;

      cachedSizes = null;
      fetchPromise = null;
      await fetchSizes();
    } catch (err: any) {
      throw err;
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  return { 
    sizes, 
    loading, 
    error, 
    addSize, 
    updateSizesOrder,
    deleteSize,
    refreshSizes: () => { cachedSizes = null; fetchPromise = null; return fetchSizes(); } 
  };
};
