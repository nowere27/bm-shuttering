import React, { useState, useEffect, useRef } from 'react';
import {
  Eye, Trash2, Edit as EditIcon, Download, Search, RefreshCw,
  FileText, Package, Calendar, ChevronLeft, ChevronRight, MapPin, Filter
} from 'lucide-react';
import ReceiptTemplate from '../components/ReceiptTemplate';
import { useLanguage } from '../contexts/LanguageContext';
import ChallanDetailsModal from '../components/ChallanDetailsModal';
import ChallanEditModal from '../components/ChallanEditModal';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';
import { generateJPEG } from '../utils/generateJPEG';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { usePlateSizes } from '../hooks/usePlateSizes';

type SortOption = 'dateNewOld' | 'dateOldNew' | 'numberHighLow' | 'numberLowHigh';
type TabType = 'udhar' | 'jama';

interface ItemsData {
  [key: string]: any;
  main_note: string | null;
}

const emptyItems: ItemsData = {
  main_note: null,
};

interface ChallanData {
  challanNumber: string;
  date: string;
  createdAt?: string;
  clientNicName: string;
  clientFullName: string;
  site: string;
  phone: string;
  driverName: string | null;
  isAlternativeSite: boolean;
  isSecondaryPhone: boolean;
  items: ItemsData;
  totalItems: number;
  clientId?: string;
}

const ITEMS_PER_PAGE = 10;

const ITEMS_SELECT = 'items, main_note';

const convertJSONToFlatItems = (jsonItemsArray: any[], mainNote: string | null): ItemsData => {
  const result: any = { main_note: mainNote };
  
  if (Array.isArray(jsonItemsArray)) {
    jsonItemsArray.forEach((item: any) => {
      const sizeId = item.size_id;
      if (sizeId >= 1) {
        result[`size_${sizeId}_qty`] = item.qty || 0;
        result[`size_${sizeId}_borrowed`] = item.borrowed || 0;
        result[`size_${sizeId}_note`] = item.note || null;
      }
    });
  }
  
  return result;
};

function calcTotalItems(items: ItemsData): number {
  let total = 0;
  Object.keys(items).forEach(key => {
    if (key.endsWith('_qty') && key.startsWith('size_')) {
      const sizeId = key.split('_')[1];
      total += ((items as any)[key] || 0) + ((items as any)[`size_${sizeId}_borrowed`] || 0);
    }
  });
  return total;
}

// Fetch one page of challans from the DB with server-side sort + search filter.
// Returns the page data and the total count matching the query.
async function fetchChallansPage(
  tab: TabType,
  page: number,
  search: string,
  sort: SortOption,
): Promise<{ data: ChallanData[]; count: number }> {
  const isUdhar = tab === 'udhar';
  const table = isUdhar ? 'udhar_challans' : 'jama_challans';
  const numField = isUdhar ? 'udhar_challan_number' : 'jama_challan_number';
  const dateField = isUdhar ? 'udhar_date' : 'jama_date';
  const itemsRel = isUdhar
    ? 'udhar_items!udhar_items_udhar_challan_number_fkey'
    : 'jama_items!jama_items_jama_challan_number_fkey';
  const clientRel = isUdhar
    ? 'clients!udhar_challans_client_id_fkey'
    : 'clients!jama_challans_client_id_fkey';

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from(table)
    .select(
      `${numField}, ${dateField}, created_at, driver_name,
       alternative_site, secondary_phone_number, client_id,
       client:${clientRel} ( id, client_nic_name, client_name, site, primary_phone_number ),
       items:${itemsRel} ( ${ITEMS_SELECT} )`,
      { count: 'exact' },
    )
    .range(start, end);

  // Sort
  switch (sort) {
    case 'dateNewOld':    query = query.order(dateField, { ascending: false }); break;
    case 'dateOldNew':    query = query.order(dateField, { ascending: true });  break;
    case 'numberHighLow': query = query.order(numField,  { ascending: false }); break;
    case 'numberLowHigh': query = query.order(numField,  { ascending: true });  break;
  }

  // Search: look up matching client IDs first, then OR-filter on challan + client
  if (search.trim()) {
    const s = search.trim();
    const { data: matchClients } = await supabase
      .from('clients')
      .select('id')
      .or(`client_nic_name.ilike.%${s}%,client_name.ilike.%${s}%,site.ilike.%${s}%`);

    const clientIds = (matchClients || []).map((c: any) => c.id);
    const conditions = [`${numField}.ilike.%${s}%`, `alternative_site.ilike.%${s}%`];
    if (clientIds.length > 0) conditions.push(`client_id.in.(${clientIds.join(',')})`);
    query = query.or(conditions.join(','));
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const transformed: ChallanData[] = (data || []).map((ch: any) => {
    const raw = ch.items;
    const row = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
    const itemRow = convertJSONToFlatItems(row.items || [], row.main_note);
    return {
      challanNumber: ch[numField],
      date: ch[dateField],
      createdAt: ch.created_at,
      driverName: ch.driver_name,
      clientNicName: ch.client?.client_nic_name || '',
      clientFullName: ch.client?.client_name || '',
      clientId: ch.client_id,
      site: ch.alternative_site || ch.client?.site || '',
      isAlternativeSite: !!ch.alternative_site,
      phone: ch.secondary_phone_number || ch.client?.primary_phone_number || '',
      isSecondaryPhone: !!ch.secondary_phone_number,
      items: itemRow,
      totalItems: calcTotalItems(itemRow),
    };
  });

  return { data: transformed, count: count ?? 0 };
}

const ChallanBook: React.FC = () => {
  const { sizes: plateSizes } = usePlateSizes();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>('udhar');
  const [challans, setChallans] = useState<ChallanData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [udharTabCount, setUdharTabCount] = useState(0);
  const [jamaTabCount, setJamaTabCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<ChallanData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('dateNewOld');
  const [showSortMenu, setShowSortMenu] = useState(false);
  // Bumped after delete/edit to force the main effect to re-run
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // ── Debounce search ─────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Reset page when filter changes ──────────────────────────────────────────

  const prevFilter = useRef({ activeTab, debouncedSearch, sortOption });
  useEffect(() => {
    const p = prevFilter.current;
    if (p.activeTab !== activeTab || p.debouncedSearch !== debouncedSearch || p.sortOption !== sortOption) {
      prevFilter.current = { activeTab, debouncedSearch, sortOption };
      setCurrentPage(1);
    }
  }, [activeTab, debouncedSearch, sortOption]);

  // ── Fetch tab badge counts once on mount ────────────────────────────────────

  useEffect(() => {
    Promise.all([
      supabase.from('udhar_challans').select('*', { count: 'exact', head: true }),
      supabase.from('jama_challans').select('*', { count: 'exact', head: true }),
    ]).then(([u, j]) => {
      setUdharTabCount(u.count ?? 0);
      setJamaTabCount(j.count ?? 0);
    });
  }, []);

  // ── Main data fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const result = await fetchChallansPage(activeTab, currentPage, debouncedSearch, sortOption);
        if (!cancelled) {
          setChallans(result.data);
          setTotalCount(result.count);
        }
      } catch (err) {
        console.error('Error loading challans:', err);
        if (!cancelled) toast.error('Failed to load challans');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeTab, currentPage, debouncedSearch, sortOption, refreshKey]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchChallansPage(activeTab, currentPage, debouncedSearch, sortOption);
      setChallans(result.data);
      setTotalCount(result.count);
      toast.success('Challans refreshed successfully');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = (challan: ChallanData) => {
    setSelectedChallan(challan);
    setShowDetailsModal(true);
  };

  const handleEdit = (challan: ChallanData) => {
    setSelectedChallan(challan);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    setRefreshKey(k => k + 1);
    toast.success('Challan updated successfully');
  };

  const transformItems = (items: ItemsData) => ({
    ...items,
    size_1_note: items.size_1_note || '', size_2_note: items.size_2_note || '',
    size_3_note: items.size_3_note || '', size_4_note: items.size_4_note || '',
    size_5_note: items.size_5_note || '', size_6_note: items.size_6_note || '',
    size_7_note: items.size_7_note || '', size_8_note: items.size_8_note || '',
    size_9_note: items.size_9_note || '', size_10_note: items.size_10_note || '', main_note: items.main_note || '',
  });

  const handleDownloadJPEG = async (challan: ChallanData) => {
    const loadingToast = toast.loading('Generating JPEG...');
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const root = await import('react-dom/client');
      const reactRoot = root.createRoot(container);

      await new Promise<void>(resolve => {
        reactRoot.render(
          <ReceiptTemplate
            challanType={activeTab}
            challanNumber={challan.challanNumber}
            date={new Date(challan.date).toLocaleDateString('en-GB')}
            clientName={challan.clientFullName}
            clientSortName={challan.clientNicName}
            site={challan.site}
            phone={challan.phone}
            driverName={challan.driverName || ''}
            items={transformItems(challan.items)}
          />
        );
        setTimeout(resolve, 100);
      });

      await generateJPEG(activeTab, challan.challanNumber, new Date(challan.date).toLocaleDateString('en-GB'));
      reactRoot.unmount();
      document.body.removeChild(container);
      toast.dismiss(loadingToast);
      toast.success(t('challanDownloadSuccess'));
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error generating JPEG:', error);
      toast.error(t('challanDownloadError'));
    }
  };

  const handleDelete = async (challan: ChallanData) => {
    const confirmed = window.confirm(
      `${t('confirmDelete')}\n\n${t('challanNumber')}: ${challan.challanNumber}\n${t('totalItems')}: ${challan.totalItems} ${t('pieces')}\n\n${t('deleteWarning')}`
    );
    if (!confirmed) return;

    const loadingToast = toast.loading('Deleting challan...');
    try {
      const rpc = activeTab === 'udhar' ? 'delete_udhar_challan_with_stock' : 'delete_jama_challan_with_stock';
      
      const itemsList: any[] = [];
      Object.keys(challan.items).forEach(key => {
        if (key.endsWith('_qty') && key.startsWith('size_')) {
          const sizeId = parseInt(key.split('_')[1]);
          const qty = (challan.items as any)[`size_${sizeId}_qty`] || 0;
          const borrowed = (challan.items as any)[`size_${sizeId}_borrowed`] || 0;
          const note = (challan.items as any)[`size_${sizeId}_note`] || '';
          if (qty > 0 || borrowed > 0 || note) {
            itemsList.push({
              size_id: sizeId,
              qty,
              borrowed,
              note
            });
          }
        }
      });

      const { data, error } = await supabase.rpc(rpc, {
        p_challan_number: challan.challanNumber,
        p_items: itemsList,
      });

      toast.dismiss(loadingToast);
      if (error) throw error;

      const success = !data || typeof data !== 'object' || !('success' in data) || (data as any).success;
      if (success) {
        toast.success('Challan deleted successfully');
        // Update tab badge count
        if (activeTab === 'udhar') setUdharTabCount(n => Math.max(0, n - 1));
        else setJamaTabCount(n => Math.max(0, n - 1));
        // If we just deleted the last item on a non-first page, go back one page
        const newTotal = totalCount - 1;
        const newPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
        if (currentPage > newPages && currentPage > 1) {
          setCurrentPage(p => p - 1); // effect will reload
        } else {
          setRefreshKey(k => k + 1); // force reload same page
        }
      } else {
        toast.error(`Error: ${(data as any).message}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error deleting challan:', error);
      toast.error('Failed to delete challan');
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'dateNewOld':    return t('dateNewOld');
      case 'dateOldNew':    return t('dateOldNew');
      case 'numberHighLow': return t('numberHighLow');
      case 'numberLowHigh': return t('numberLowHigh');
      default: return '';
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.sort-menu-container')) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Skeleton ────────────────────────────────────────────────────────────────

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-3 sm:px-6 sm:py-4"><div className="w-20 h-4 bg-gray-200 rounded sm:w-24" /></td>
      <td className="px-4 py-3 sm:px-6 sm:py-4"><div className="w-16 h-4 bg-gray-200 rounded sm:w-20" /></td>
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="w-24 h-4 mb-1 bg-gray-200 rounded sm:w-32" />
        <div className="w-20 h-3 bg-gray-200 rounded sm:w-24" />
      </td>
      <td className="px-4 py-3 sm:px-6 sm:py-4"><div className="w-20 h-4 bg-gray-200 rounded sm:w-28" /></td>
      <td className="px-4 py-3 sm:px-6 sm:py-4"><div className="w-20 h-4 bg-gray-200 rounded sm:w-24" /></td>
      <td className="px-4 py-3 sm:px-6 sm:py-4"><div className="w-12 h-4 bg-gray-200 rounded sm:w-16" /></td>
      <td className="px-4 py-3 sm:px-6 sm:py-4"><div className="w-24 h-8 bg-gray-200 rounded sm:w-32" /></td>
    </tr>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: { background: '#363636', color: '#fff', fontSize: '13px', padding: '10px 14px' },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
      <Navbar />
      <main className="flex-1 w-full ml-0 overflow-auto pt-14 sm:pt-0 lg:ml-64">
        <div className={`w-full px-3 py-3 pb-20 mx-auto sm:px-4 sm:py-5 lg:px-8 lg:py-12 lg:pb-12 max-w-7xl ${showDetailsModal || showEditModal ? 'blur-sm' : ''} transition-all duration-200`}>

          {/* Header */}
          <div className="items-center justify-between hidden mb-6 sm:flex lg:mb-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl">{t('challanBook')}</h2>
              <p className="mt-1 text-xs text-gray-600">{t('challanBookSubtitle')}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
              className="p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 touch-manipulation active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm sm:rounded-xl">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {(['udhar', 'jama'] as TabType[]).map(tab => {
                  const isActive = activeTab === tab;
                  const count = tab === 'udhar' ? udharTabCount : jamaTabCount;
                  const color = tab === 'udhar' ? 'red' : 'green';
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 text-center font-semibold text-xs sm:text-sm transition-colors touch-manipulation active:scale-[0.98] ${
                        isActive
                          ? `border-b-2 border-${color}-600 text-${color}-600 bg-${color}-50`
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {tab === 'udhar' ? <FileText className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        <span className="hidden sm:inline">{t(tab === 'udhar' ? 'udharChallans' : 'jamaChallans')}</span>
                        <span className="sm:hidden">{t(tab)}</span>
                        <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full ${
                          isActive ? `bg-${color}-100 text-${color}-700` : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Search + sort */}
            <div className="p-3 border-b border-gray-200 sm:p-4 lg:p-6 bg-gray-50">
              <div className="relative flex items-center w-full">
                <Search className="absolute w-4 h-4 text-gray-400 left-3" />
                <input
                  type="text"
                  placeholder={t('searchChallan')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-28 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute flex items-center gap-2 right-2">
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="p-1 text-gray-400 hover:text-gray-600">
                      <div className="flex items-center justify-center w-4 h-4">×</div>
                    </button>
                  )}
                  <div className="relative sort-menu-container">
                    <button
                      onClick={() => setShowSortMenu(p => !p)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 rounded-md"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{getSortLabel(sortOption)}</span>
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {(['dateNewOld', 'dateOldNew', 'numberHighLow', 'numberLowHigh'] as SortOption[]).map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setSortOption(opt); setShowSortMenu(false); }}
                            className={`w-full px-4 py-2 text-xs text-left transition-colors hover:bg-gray-50 ${sortOption === opt ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                          >
                            {getSortLabel(opt)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              {loading ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[t('challanNumber'), t('date'), t('clientName'), t('site'), t('phone'), t('totalItems'), t('actions')].map(h => (
                        <th key={h} className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                  </tbody>
                </table>
              ) : challans.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">{t('noChallansFound')}</p>
                  <p className="mt-1 text-sm text-gray-400">{t('tryAdjustingSearch')}</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{t('challanNumber')}</th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                        <div className="flex items-center justify-center gap-2"><Calendar size={14} />{t('date')}</div>
                      </th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{t('clientName')}</th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{t('site')}</th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{t('phone')}</th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{t('totalItems')}</th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {challans.map((challan, index) => (
                      <tr key={challan.challanNumber} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4 text-sm font-bold text-center text-gray-900 whitespace-nowrap">{challan.challanNumber}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                          <div>{challan.date ? format(new Date(challan.date), 'dd/MM/yyyy') : 'N/A'}</div>
                          <div className="text-[10px] text-gray-500">{challan.createdAt ? format(new Date(challan.createdAt), 'hh:mm a') : ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">
                          <div className="font-semibold">{challan.clientNicName}</div>
                          <div className="text-xs text-gray-500">{challan.clientFullName}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">{challan.site}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">{challan.phone}</td>
                        <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Package size={12} />{challan.totalItems}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleViewDetails(challan)} className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-50 touch-manipulation active:scale-95" title={t('viewDetails')}><Eye size={16} /></button>
                            <button onClick={() => handleEdit(challan)} className="p-2 text-yellow-600 transition-colors rounded-lg hover:bg-yellow-50 touch-manipulation active:scale-95" title={t('edit')}><EditIcon size={16} /></button>
                            <button onClick={() => handleDownloadJPEG(challan)} className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-50 touch-manipulation active:scale-95" title={t('downloadJPEG')}><Download size={16} /></button>
                            <button onClick={() => handleDelete(challan)} className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-50 touch-manipulation active:scale-95" title={t('delete')}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mobile cards */}
            <div className="p-3 space-y-3 sm:p-4 sm:space-y-4 lg:hidden">
              {loading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 sm:rounded-xl animate-pulse">
                      <div className="w-24 h-5 mb-3 bg-gray-200 rounded sm:w-32 sm:h-6" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded" /><div className="h-4 bg-gray-200 rounded" /><div className="h-4 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </>
              ) : challans.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-gray-300 sm:w-12 sm:h-12" />
                  <p className="text-sm font-medium text-gray-500 sm:text-base">{t('noChallansFound')}</p>
                </div>
              ) : (
                challans.map(challan => (
                  <div
                    key={challan.challanNumber}
                    className={`p-3 sm:p-4 border shadow-sm rounded-lg sm:rounded-xl ${activeTab === 'udhar' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm text-white ${activeTab === 'udhar' ? 'bg-red-600' : 'bg-green-600'}`}>
                          #{challan.challanNumber}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-medium ${activeTab === 'udhar' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{challan.totalItems}
                      </span>
                    </div>

                    <div className="pb-3 mb-3 space-y-2 text-xs border-b border-gray-300 sm:text-sm">
                      <div className="flex gap-2 sm:hidden">
                        <span className="font-semibold text-gray-900">{challan.clientNicName}</span>
                        <span className="text-gray-600">-</span>
                        <span className="text-gray-600">{challan.clientFullName}</span>
                      </div>
                      <div className="hidden sm:block">
                        <span className="font-semibold text-gray-900">{challan.clientNicName}</span>
                        <div className="text-[10px] sm:text-xs text-gray-600">{challan.clientFullName}</div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <div className="flex flex-col sm:flex-row sm:gap-1.5 sm:items-baseline">
                            <span>{challan.date ? format(new Date(challan.date), 'dd/MM/yyyy') : 'N/A'}</span>
                            <span className="text-[9px] text-gray-400 sm:text-xs">{challan.createdAt ? format(new Date(challan.createdAt), 'hh:mm a') : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700 min-w-0 flex-1">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">{challan.site}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {[
                        { label: 'View',     icon: <Eye className="w-4 h-4 sm:w-5 sm:h-5" />,      cls: 'text-blue-600   hover:bg-blue-50',   action: () => handleViewDetails(challan) },
                        { label: 'Edit',     icon: <EditIcon className="w-4 h-4 sm:w-5 sm:h-5" />, cls: 'text-yellow-600 hover:bg-yellow-50', action: () => handleEdit(challan) },
                        { label: 'Download', icon: <Download className="w-4 h-4 sm:w-5 sm:h-5" />, cls: 'text-blue-600   hover:bg-blue-50',   action: () => handleDownloadJPEG(challan) },
                        { label: 'Delete',   icon: <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />,   cls: 'text-red-600    hover:bg-red-50',    action: () => handleDelete(challan) },
                      ].map(({ label, icon, cls, action }) => (
                        <button
                          key={label}
                          onClick={action}
                          className={`flex flex-col items-center justify-center gap-1 px-2 py-2 bg-white rounded-lg transition-colors touch-manipulation active:scale-95 ${cls}`}
                        >
                          {icon}
                          <span className="text-[9px] sm:text-[10px] font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!loading && totalCount > 0 && (
              <div className="px-3 py-3 border-t border-gray-200 sm:px-4 sm:py-4 lg:px-6 bg-gray-50">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-0">
                  <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span>{' '}
                    of <span className="font-medium">{totalCount}</span> challans
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 sm:p-2 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5)              pageNum = i + 1;
                        else if (currentPage <= 3)        pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else                              pageNum = currentPage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs lg:text-sm font-medium rounded-lg transition-colors touch-manipulation active:scale-95 ${
                              currentPage === pageNum
                                ? activeTab === 'udhar' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 sm:p-2 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChallanDetailsModal
        challan={selectedChallan}
        type={activeTab}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onDownload={handleDownloadJPEG}
      />
      <ChallanEditModal
        challan={selectedChallan}
        type={activeTab}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default ChallanBook;
