import { supabase } from './supabase';

interface ItemsData {
  size_1_qty: number;
  size_2_qty: number;
  size_3_qty: number;
  size_4_qty: number;
  size_5_qty: number;
  size_6_qty: number;
  size_7_qty: number;
  size_8_qty: number;
  size_9_qty: number;
  size_1_borrowed: number;
  size_2_borrowed: number;
  size_3_borrowed: number;
  size_4_borrowed: number;
  size_5_borrowed: number;
  size_6_borrowed: number;
  size_7_borrowed: number;
  size_8_borrowed: number;
  size_9_borrowed: number;
  size_1_note: string | null;
  size_2_note: string | null;
  size_3_note: string | null;
  size_4_note: string | null;
  size_5_note: string | null;
  size_6_note: string | null;
  size_7_note: string | null;
  size_8_note: string | null;
  size_9_note: string | null;
  main_note: string | null;
}

const emptyItems: ItemsData = {
  size_1_qty: 0, size_2_qty: 0, size_3_qty: 0, size_4_qty: 0, size_5_qty: 0,
  size_6_qty: 0, size_7_qty: 0, size_8_qty: 0, size_9_qty: 0,
  size_1_borrowed: 0, size_2_borrowed: 0, size_3_borrowed: 0, size_4_borrowed: 0, size_5_borrowed: 0,
  size_6_borrowed: 0, size_7_borrowed: 0, size_8_borrowed: 0, size_9_borrowed: 0,
  size_1_note: null, size_2_note: null, size_3_note: null, size_4_note: null, size_5_note: null,
  size_6_note: null, size_7_note: null, size_8_note: null, size_9_note: null,
  main_note: null,
};

export const fetchUdharChallansForClient = async (clientId?: string) => {
  let query = supabase
    .from('udhar_challans')
    .select(`
      udhar_challan_number,
      udhar_date,
      driver_name,
      alternative_site,
      secondary_phone_number,
      client_id,
      client:clients!udhar_challans_client_id_fkey (
        id,
        client_nic_name,
        client_name,
        site,
        primary_phone_number
      ),
      items:udhar_items!udhar_items_udhar_challan_number_fkey (
        size_1_qty,
        size_2_qty,
        size_3_qty,
        size_4_qty,
        size_5_qty,
        size_6_qty,
        size_7_qty,
        size_8_qty,
        size_9_qty,
        size_1_borrowed,
        size_2_borrowed,
        size_3_borrowed,
        size_4_borrowed,
        size_5_borrowed,
        size_6_borrowed,
        size_7_borrowed,
        size_8_borrowed,
        size_9_borrowed,
        size_1_note,
        size_2_note,
        size_3_note,
        size_4_note,
        size_5_note,
        size_6_note,
        size_7_note,
        size_8_note,
        size_9_note,
        main_note
      )
    `)
    .order('udhar_date', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching udhar challans:', error);
    return [];
  }

  const transformedData = (data || []).map((challan: any) => {
    const rawItems = challan.items;
    const itemRow = Array.isArray(rawItems) ? (rawItems[0] || emptyItems) : (rawItems || emptyItems);

    return {
      challanNumber: challan.udhar_challan_number,
      date: challan.udhar_date,
      type: 'udhar' as const,
      driverName: challan.driver_name,
      clientNicName: challan.client?.client_nic_name || '',
      clientFullName: challan.client?.client_name || '',
      clientId: challan.client_id,
      site: challan.alternative_site || challan.client?.site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || challan.client?.primary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: itemRow,
    };
  });

  return transformedData;
};

export const fetchJamaChallansForClient = async (clientId?: string) => {
  let query = supabase
    .from('jama_challans')
    .select(`
      jama_challan_number,
      jama_date,
      driver_name,
      alternative_site,
      secondary_phone_number,
      client_id,
      client:clients!jama_challans_client_id_fkey (
        id,
        client_nic_name,
        client_name,
        site,
        primary_phone_number
      ),
      items:jama_items!jama_items_jama_challan_number_fkey (
        size_1_qty,
        size_2_qty,
        size_3_qty,
        size_4_qty,
        size_5_qty,
        size_6_qty,
        size_7_qty,
        size_8_qty,
        size_9_qty,
        size_1_borrowed,
        size_2_borrowed,
        size_3_borrowed,
        size_4_borrowed,
        size_5_borrowed,
        size_6_borrowed,
        size_7_borrowed,
        size_8_borrowed,
        size_9_borrowed,
        size_1_note,
        size_2_note,
        size_3_note,
        size_4_note,
        size_5_note,
        size_6_note,
        size_7_note,
        size_8_note,
        size_9_note,
        main_note
      )
    `)
    .order('jama_date', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jama challans:', error);
    return [];
  }

  const transformedData = (data || []).map((challan: any) => {
    const rawItems = challan.items;
    const itemRow = Array.isArray(rawItems) ? (rawItems[0] || emptyItems) : (rawItems || emptyItems);

    return {
      challanNumber: challan.jama_challan_number,
      date: challan.jama_date,
      type: 'jama' as const,
      driverName: challan.driver_name,
      clientNicName: challan.client?.client_nic_name || '',
      clientFullName: challan.client?.client_name || '',
      clientId: challan.client_id,
      site: challan.alternative_site || challan.client?.site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || challan.client?.primary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: itemRow,
    };
  });

  return transformedData;
};

export const fetchDailyChallans = async (date: Date) => {
  const dateStr = date.toISOString().split('T')[0];

  const [udharChallans, jamaChallans, bills] = await Promise.all([
    supabase
      .from('udhar_challans')
      .select(`
        udhar_challan_number,
        udhar_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        client:clients!udhar_challans_client_id_fkey (
          id,
          client_nic_name,
          client_name,
          site,
          primary_phone_number
        ),
        items:udhar_items!udhar_items_udhar_challan_number_fkey (
          size_1_qty, size_2_qty, size_3_qty, size_4_qty, size_5_qty,
          size_6_qty, size_7_qty, size_8_qty, size_9_qty,
          size_1_borrowed, size_2_borrowed, size_3_borrowed,
          size_4_borrowed, size_5_borrowed, size_6_borrowed,
          size_7_borrowed, size_8_borrowed, size_9_borrowed,
          size_1_note, size_2_note, size_3_note,
          size_4_note, size_5_note, size_6_note,
          size_7_note, size_8_note, size_9_note,
          main_note
        )
      `)
      .eq('udhar_date', dateStr)
      .order('udhar_challan_number', { ascending: false }),
    supabase
      .from('jama_challans')
      .select(`
        jama_challan_number,
        jama_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        client:clients!jama_challans_client_id_fkey (
          id,
          client_nic_name,
          client_name,
          site,
          primary_phone_number
        ),
        items:jama_items!jama_items_jama_challan_number_fkey (
          size_1_qty, size_2_qty, size_3_qty, size_4_qty, size_5_qty,
          size_6_qty, size_7_qty, size_8_qty, size_9_qty,
          size_1_borrowed, size_2_borrowed, size_3_borrowed,
          size_4_borrowed, size_5_borrowed, size_6_borrowed,
          size_7_borrowed, size_8_borrowed, size_9_borrowed,
          size_1_note, size_2_note, size_3_note,
          size_4_note, size_5_note, size_6_note,
          size_7_note, size_8_note, size_9_note,
          main_note
        )
      `)
      .eq('jama_date', dateStr)
      .order('jama_challan_number', { ascending: false }),
    supabase
      .from('bills')
      .select(`
        bill_number,
        billing_date,
        total_rent_amount,
        total_extra_cost,
        client_id,
        client:clients (
          client_nic_name,
          client_name,
          site,
          primary_phone_number
        )
      `)
      .eq('billing_date', dateStr)
      .order('created_at', { ascending: false })
  ]);

  const mapChallan = (challan: any, type: 'udhar' | 'jama') => {
    const rawItems = challan.items;
    const itemRow = Array.isArray(rawItems) ? (rawItems[0] || emptyItems) : (rawItems || emptyItems);

    return {
      challanNumber: type === 'udhar' ? challan.udhar_challan_number : challan.jama_challan_number,
      date: type === 'udhar' ? challan.udhar_date : challan.jama_date,
      type,
      driverName: challan.driver_name,
      clientNicName: challan.client?.client_nic_name || '',
      clientFullName: challan.client?.client_name || '',
      clientId: challan.client_id,
      site: challan.alternative_site || challan.client?.site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || challan.client?.primary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: itemRow,
      totalItems: calculateTotalFromItems(itemRow)
    };
  };

  const mapBill = (bill: any) => ({
    challanNumber: bill.bill_number,
    date: bill.billing_date,
    type: 'bill' as const,
    driverName: '',
    clientNicName: bill.client?.client_nic_name || '',
    clientFullName: bill.client?.client_name || '',
    clientId: bill.client_id,
    site: bill.client?.site || '',
    isAlternativeSite: false,
    phone: bill.client?.primary_phone_number || '',
    isSecondaryPhone: false,
    items: emptyItems,
    totalItems: 0,
    amount: (bill.total_rent_amount || 0) + (bill.total_extra_cost || 0)
  });

  const udharData = (udharChallans.data || []).map(c => mapChallan(c, 'udhar'));
  const jamaData = (jamaChallans.data || []).map(c => mapChallan(c, 'jama'));
  const billData = (bills.data || []).map(b => mapBill(b));

  return [...billData, ...udharData, ...jamaData].sort((a, b) => {
    // Basic sort by ID/Number usually works if formats align, otherwise standard collator
    return b.challanNumber.localeCompare(a.challanNumber);
  });
};

// Cache for transactions to avoid redundant fetches
const transactionCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const fetchClientTransactions = async (clientId: string) => {
  // Check cache first
  const cached = transactionCache.get(clientId);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  const [udharChallans, jamaChallans] = await Promise.all([
    fetchUdharChallansForClient(clientId),
    fetchJamaChallansForClient(clientId),
  ]);

  const allTransactions = [...udharChallans, ...jamaChallans].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Cache the results
  transactionCache.set(clientId, { data: allTransactions, timestamp: Date.now() });

  return allTransactions;
};

export const clearTransactionCache = () => transactionCache.clear();

// Fetch transactions for multiple clients in 2 queries instead of 2×N queries.
// Returns a Map<clientId, transaction[]> sorted by date ascending per client.
export const fetchBulkClientTransactions = async (clientIds: string[]): Promise<Map<string, any[]>> => {
  if (clientIds.length === 0) return new Map();

  const [udharResult, jamaResult] = await Promise.all([
    supabase
      .from('udhar_challans')
      .select(`
        udhar_challan_number,
        udhar_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        items:udhar_items!udhar_items_udhar_challan_number_fkey (
          size_1_qty, size_2_qty, size_3_qty, size_4_qty, size_5_qty,
          size_6_qty, size_7_qty, size_8_qty, size_9_qty,
          size_1_borrowed, size_2_borrowed, size_3_borrowed,
          size_4_borrowed, size_5_borrowed, size_6_borrowed,
          size_7_borrowed, size_8_borrowed, size_9_borrowed,
          size_1_note, size_2_note, size_3_note, size_4_note, size_5_note,
          size_6_note, size_7_note, size_8_note, size_9_note, main_note
        )
      `)
      .in('client_id', clientIds)
      .order('udhar_date', { ascending: true }),
    supabase
      .from('jama_challans')
      .select(`
        jama_challan_number,
        jama_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        items:jama_items!jama_items_jama_challan_number_fkey (
          size_1_qty, size_2_qty, size_3_qty, size_4_qty, size_5_qty,
          size_6_qty, size_7_qty, size_8_qty, size_9_qty,
          size_1_borrowed, size_2_borrowed, size_3_borrowed,
          size_4_borrowed, size_5_borrowed, size_6_borrowed,
          size_7_borrowed, size_8_borrowed, size_9_borrowed,
          size_1_note, size_2_note, size_3_note, size_4_note, size_5_note,
          size_6_note, size_7_note, size_8_note, size_9_note, main_note
        )
      `)
      .in('client_id', clientIds)
      .order('jama_date', { ascending: true }),
  ]);

  const byClient = new Map<string, any[]>();

  (udharResult.data || []).forEach((challan: any) => {
    const cid = challan.client_id;
    if (!byClient.has(cid)) byClient.set(cid, []);
    const raw = challan.items;
    const itemRow = Array.isArray(raw) ? (raw[0] ?? emptyItems) : (raw ?? emptyItems);
    byClient.get(cid)!.push({
      challanNumber: challan.udhar_challan_number,
      date: challan.udhar_date,
      type: 'udhar' as const,
      driverName: challan.driver_name || '',
      clientId: cid,
      site: challan.alternative_site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: itemRow,
    });
  });

  (jamaResult.data || []).forEach((challan: any) => {
    const cid = challan.client_id;
    if (!byClient.has(cid)) byClient.set(cid, []);
    const raw = challan.items;
    const itemRow = Array.isArray(raw) ? (raw[0] ?? emptyItems) : (raw ?? emptyItems);
    byClient.get(cid)!.push({
      challanNumber: challan.jama_challan_number,
      date: challan.jama_date,
      type: 'jama' as const,
      driverName: challan.driver_name || '',
      clientId: cid,
      site: challan.alternative_site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: itemRow,
    });
  });

  // Sort each client's transactions chronologically
  byClient.forEach((txs, cid) => {
    byClient.set(cid, txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  });

  return byClient;
};

export const calculateTotalFromItems = (items: ItemsData): number => {
  let total = 0;
  for (let i = 1; i <= 9; i++) {
    total += ((items as any)[`size_${i}_qty`] || 0) + ((items as any)[`size_${i}_borrowed`] || 0);
  }
  return total;
};
