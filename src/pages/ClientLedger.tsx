import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  Loader2,
  Download
} from 'lucide-react';
import { naturalSort } from '../utils/sortingUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { supabase } from '../utils/supabase';
import {
  fetchUdharChallansForClient,
  fetchJamaChallansForClient,
  fetchBulkClientTransactions
} from '../utils/challanFetching';
import Navbar from '../components/Navbar';
import ClientLedgerCard from '../components/ClientLedgerCard';
import toast, { Toaster } from 'react-hot-toast';

type SortOption = 'nameAZ' | 'nameZA' | 'balanceHighLow' | 'balanceLowHigh';

interface SizeBalance {
  size_1: number; size_2: number; size_3: number; size_4: number; size_5: number;
  size_6: number; size_7: number; size_8: number; size_9: number; grandTotal: number;
}

export interface ClientBalance {
  grandTotal: number;
  sizes: { [key: string]: { main: number; borrowed: number; total: number } };
}

export interface Transaction {
  type: 'udhar' | 'jama';
  challanNumber: string;
  challanId: string;
  date: string;
  grandTotal: number;
  sizes: { [key: string]: { qty: number; borrowed: number } };
  site: string;
  driverName: string;
  items: any;
}

export interface ClientLedgerData {
  clientId: string;
  clientNicName: string;
  clientFullName: string;
  clientSite: string;
  clientPhone: string;
  totalUdhar: SizeBalance;
  totalJama: SizeBalance;
  currentBalance: ClientBalance;
  udharCount: number;
  jamaCount: number;
  transactions: Transaction[];
  transactionsLoaded?: boolean;
  is_hidden?: boolean;
}

// ─── Skeleton cards ────────────────────────────────────────────────────────────

const MobileSkeletonCard = memo(() => (
  <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse sm:hidden">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full" />
        <div>
          <div className="w-28 h-4 mb-1.5 bg-gray-200 rounded-md" />
          <div className="w-20 h-3 bg-gray-200 rounded-md" />
        </div>
      </div>
      <div className="text-right">
        <div className="w-10 h-3 mb-1 ml-auto bg-gray-200 rounded-md" />
        <div className="h-4 bg-gray-200 rounded-md w-14" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 bg-gray-200 rounded-full" />
        <div className="w-20 h-3 bg-gray-200 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-gray-200 rounded-full w-14 h-7" />
        <div className="bg-gray-200 rounded-full w-14 h-7" />
        <div className="bg-gray-200 rounded-full w-7 h-7" />
      </div>
    </div>
  </div>
));
MobileSkeletonCard.displayName = 'MobileSkeletonCard';

const DesktopSkeletonCard = memo(() => (
  <div className="hidden p-4 bg-white border border-gray-200 shadow-sm sm:block rounded-xl lg:p-6 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full lg:w-14 lg:h-14" />
        <div>
          <div className="w-48 h-5 mb-3 bg-gray-200 rounded-md lg:h-6" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
              <div className="w-56 h-3.5 bg-gray-200 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
              <div className="w-32 h-3.5 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4">
        <div className="text-right">
          <div className="w-14 h-3.5 mb-1 bg-gray-200 rounded-md" />
          <div className="w-20 h-5 bg-gray-200 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 bg-gray-200 rounded-full" />
          <div className="w-20 h-8 bg-gray-200 rounded-full" />
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  </div>
));
DesktopSkeletonCard.displayName = 'DesktopSkeletonCard';

const SkeletonCard = memo(() => (
  <>
    <MobileSkeletonCard />
    <DesktopSkeletonCard />
  </>
));
SkeletonCard.displayName = 'SkeletonCard';

// ─── Pure helpers (no hooks, no closures over state) ──────────────────────────

const EMPTY_SIZE: SizeBalance = Object.freeze({
  size_1: 0, size_2: 0, size_3: 0, size_4: 0, size_5: 0,
  size_6: 0, size_7: 0, size_8: 0, size_9: 0, grandTotal: 0,
});

function buildLedgerFromTransactions(client: any, rawTransactions: any[]): ClientLedgerData {
  const udharTotals = { ...EMPTY_SIZE };
  const jamaTotals = { ...EMPTY_SIZE };
  const sizes: ClientBalance['sizes'] = {};
  for (let i = 1; i <= 9; i++) sizes[i] = { main: 0, borrowed: 0, total: 0 };

  const transactions: Transaction[] = rawTransactions.map(t => {
    const sizeData: Transaction['sizes'] = {};
    let grandTotal = 0;
    const multiplier = t.type === 'udhar' ? 1 : -1;
    const totals = t.type === 'udhar' ? udharTotals : jamaTotals;

    for (let i = 1; i <= 9; i++) {
      const qty = t.items[`size_${i}_qty`] || 0;
      const borrowed = t.items[`size_${i}_borrowed`] || 0;
      sizeData[i] = { qty, borrowed };
      grandTotal += qty + borrowed;

      const key = `size_${i}` as keyof SizeBalance;
      (totals as any)[key] += qty + borrowed;
      totals.grandTotal += qty + borrowed;

      sizes[i].main += qty * multiplier;
      sizes[i].borrowed += borrowed * multiplier;
      sizes[i].total = sizes[i].main + sizes[i].borrowed;
    }

    return {
      type: t.type,
      challanNumber: t.challanNumber,
      challanId: t.challanNumber,
      date: t.date,
      grandTotal,
      sizes: sizeData,
      site: t.site || client.site || '',
      driverName: t.driverName || '',
      items: t.items,
    };
  });

  const grandTotal = Object.values(sizes).reduce((sum, s) => sum + s.total, 0);

  return {
    clientId: client.id,
    clientNicName: client.client_nic_name,
    clientFullName: client.client_name,
    clientSite: client.site,
    clientPhone: client.primary_phone_number,
    totalUdhar: udharTotals,
    totalJama: jamaTotals,
    currentBalance: { grandTotal, sizes },
    udharCount: rawTransactions.filter(t => t.type === 'udhar').length,
    jamaCount: rawTransactions.filter(t => t.type === 'jama').length,
    transactions,
    transactionsLoaded: true,
    is_hidden: client.is_hidden,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export default function ClientLedger() {
  const { language } = useLanguage();
  const t = translations[language];

  const [allClients, setAllClients] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<ClientLedgerData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('nameAZ');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Guard to prevent concurrent loadVisibleLedgers calls
  const loadingMoreRef = useRef(false);

  // ── Derived state ───────────────────────────────────────────────────────────

  const ledgersMap = useMemo(() => {
    const map = new Map<string, ClientLedgerData>();
    ledgers.forEach(l => map.set(l.clientId, l));
    return map;
  }, [ledgers]);

  const filteredClients = useMemo(() => {
    const visible = allClients.filter(c => !c.is_hidden);
    if (!searchQuery.trim()) return visible;

    const query = searchQuery.toLowerCase().trim();
    const searchNum = parseInt(query);
    const isNum = !isNaN(searchNum);

    return visible.filter(client => {
      if (isNum) {
        const m = (client.client_nic_name || '').match(/^(\d+)/);
        if (m && parseInt(m[1]) === searchNum) return true;
      }
      const nic = (client.client_nic_name || '').toLowerCase();
      const name = (client.client_name || '').toLowerCase();
      const site = (client.site || '').toLowerCase();
      return nic.includes(query) || name.includes(query) || site.includes(query);
    });
  }, [allClients, searchQuery]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const aNic = (a.client_nic_name || '').toLowerCase();
        const bNic = (b.client_nic_name || '').toLowerCase();
        const getId = (s: string) => { const m = s.match(/^(\d+)/); return m ? m[1] : ''; };
        const aId = getId(aNic), bId = getId(bNic);
        if (aId === query && bId !== query) return -1;
        if (bId === query && aId !== query) return 1;
        if (aNic.startsWith(query) && !bNic.startsWith(query)) return -1;
        if (bNic.startsWith(query) && !aNic.startsWith(query)) return 1;
      }
      switch (sortOption) {
        case 'nameAZ': return naturalSort(a.client_nic_name || '', b.client_nic_name || '');
        case 'nameZA': return naturalSort(b.client_nic_name || '', a.client_nic_name || '');
        case 'balanceHighLow': {
          const ba = ledgersMap.get(a.id)?.currentBalance.grandTotal || 0;
          const bb = ledgersMap.get(b.id)?.currentBalance.grandTotal || 0;
          return bb !== ba ? bb - ba : naturalSort(a.client_nic_name || '', b.client_nic_name || '');
        }
        case 'balanceLowHigh': {
          const ba = ledgersMap.get(a.id)?.currentBalance.grandTotal || 0;
          const bb = ledgersMap.get(b.id)?.currentBalance.grandTotal || 0;
          return ba !== bb ? ba - bb : naturalSort(a.client_nic_name || '', b.client_nic_name || '');
        }
        default: return 0;
      }
    });
  }, [filteredClients, sortOption, ledgersMap, searchQuery]);

  const { filteredCount, hasMore } = useMemo(() => ({
    filteredCount: filteredClients.length,
    hasMore: currentPage * ITEMS_PER_PAGE < filteredClients.length,
  }), [filteredClients, currentPage]);

  const filteredAndSortedLedgers = useMemo(() => {
    const end = currentPage * ITEMS_PER_PAGE;
    const empty: ClientBalance = {
      grandTotal: 0,
      sizes: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, { main: 0, borrowed: 0, total: 0 }])),
    };
    const emptySize = { ...EMPTY_SIZE };

    return sortedClients.slice(0, end).map(client => {
      const existing = ledgersMap.get(client.id);
      if (existing) return existing;
      return {
        clientId: client.id,
        clientNicName: client.client_nic_name,
        clientFullName: client.client_name,
        clientSite: client.site,
        clientPhone: client.primary_phone_number,
        totalUdhar: emptySize,
        totalJama: emptySize,
        currentBalance: empty,
        udharCount: 0,
        jamaCount: 0,
        transactions: [],
        transactionsLoaded: false,
      } satisfies ClientLedgerData;
    });
  }, [sortedClients, ledgersMap, currentPage]);

  // ── Data loading ────────────────────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_nic_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }, []);

  const loadInitialData = useCallback(async (showRefreshToast = false) => {
    setLoading(true);
    setRefreshing(showRefreshToast);
    try {
      const clients = await fetchClients();
      setAllClients(clients);

      // Pre-load first page: 2 queries total instead of 2×ITEMS_PER_PAGE queries
      const firstPage = clients
        .filter(c => !c.is_hidden)
        .sort((a, b) => naturalSort(a.client_nic_name || '', b.client_nic_name || ''))
        .slice(0, ITEMS_PER_PAGE);

      const clientIds = firstPage.map(c => c.id);
      const bulkData = await fetchBulkClientTransactions(clientIds);

      setLedgers(firstPage.map(c => buildLedgerFromTransactions(c, bulkData.get(c.id) || [])));
      setCurrentPage(1);
      if (showRefreshToast) toast.success('Ledger data refreshed successfully');
    } catch (err) {
      console.error('Error loading ledgers:', err);
      toast.error('Failed to load client ledgers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchClients]);

  // Load any clients that are visible but not yet loaded (pagination + search)
  const loadVisibleLedgers = useCallback(async () => {
    if (loadingMoreRef.current) return;

    const end = currentPage * ITEMS_PER_PAGE;
    const unloaded = sortedClients.slice(0, end).filter(c => !ledgersMap.get(c.id)?.transactionsLoaded);
    if (unloaded.length === 0) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const clientIds = unloaded.map(c => c.id);
      const bulkData = await fetchBulkClientTransactions(clientIds);

      const newLedgers = unloaded.map(c => buildLedgerFromTransactions(c, bulkData.get(c.id) || []));

      setLedgers(prev => {
        const next = [...prev];
        newLedgers.forEach(nl => {
          const idx = next.findIndex(l => l.clientId === nl.clientId);
          if (idx !== -1) next[idx] = nl;
          else next.push(nl);
        });
        return next;
      });
    } catch (err) {
      console.error('Error loading more ledgers:', err);
      toast.error('Failed to load client data');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [sortedClients, currentPage, ledgersMap]);

  // CSV backup download (all clients, 2 bulk queries)
  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const clients = await fetchClients();
      const [allUdhar, allJama] = await Promise.all([
        fetchUdharChallansForClient(),
        fetchJamaChallansForClient(),
      ]);

      const csvRows = [['Client Sort Name', 'Client Name', 'Site', 'Phone', 'Grand Total',
        'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5', 'Size 6', 'Size 7', 'Size 8', 'Size 9']];

      const udharMap = new Map<string, any[]>();
      const jamaMap = new Map<string, any[]>();
      allUdhar.forEach((u: any) => { if (!udharMap.has(u.clientId)) udharMap.set(u.clientId, []); udharMap.get(u.clientId)!.push(u); });
      allJama.forEach((j: any) => { if (!jamaMap.has(j.clientId)) jamaMap.set(j.clientId, []); jamaMap.get(j.clientId)!.push(j); });

      const calcTotals = (challans: any[]) => {
        const t = { ...EMPTY_SIZE };
        challans.forEach(ch => {
          for (let i = 1; i <= 9; i++) {
            const v = (ch.items[`size_${i}_qty`] || 0) + (ch.items[`size_${i}_borrowed`] || 0);
            (t as any)[`size_${i}`] += v;
            t.grandTotal += v;
          }
        });
        return t;
      };

      clients.forEach(client => {
        const u = calcTotals(udharMap.get(client.id) || []);
        const j = calcTotals(jamaMap.get(client.id) || []);
        const row = [
          `"${client.client_nic_name || ''}"`,
          `"${client.client_name || ''}"`,
          `"${client.site || ''}"`,
          `"${client.primary_phone_number || ''}"`,
          (u.grandTotal - j.grandTotal).toString(),
        ];
        for (let i = 1; i <= 9; i++) row.push(((u as any)[`size_${i}`] - (j as any)[`size_${i}`]).toString());
        csvRows.push(row);
      });

      const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `client_ledger_backup_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const t = e.currentTarget;
    if (!loadingMore && hasMore && t.scrollHeight - t.scrollTop - t.clientHeight < 100) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  useEffect(() => { loadVisibleLedgers(); }, [loadVisibleLedgers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.sort-menu-container')) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'nameAZ': return t.nameAZ;
      case 'nameZA': return t.nameZA;
      case 'balanceHighLow': return t.balanceHighLow;
      case 'balanceLowHigh': return t.balanceLowHigh;
      default: return '';
    }
  };

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
      <main
        className="flex-1 w-full ml-0 overflow-y-auto pt-14 sm:pt-0 lg:ml-64 h-[100dvh]"
        onScroll={handleScroll}
      >
        <div className="w-full h-full px-3 py-3 pb-20 mx-auto sm:px-4 sm:py-5 lg:px-8 lg:py-12 lg:pb-12 max-w-7xl">

          {/* Header */}
          <div className="items-center justify-between hidden mb-6 sm:flex lg:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{t.clientLedger}</h1>
              <p className="mt-1 text-xs text-gray-600">{t.rentalHistory}</p>
            </div>
            <button
              onClick={() => loadInitialData(true)}
              disabled={refreshing}
              title="Refresh"
              className="p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 touch-manipulation active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search + controls */}
          <div className="relative mb-4">
            <div className="relative flex items-center w-full">
              <Search className="absolute w-4 h-4 text-gray-400 left-3" />
              <input
                type="text"
                placeholder={t.searchClients}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-28 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute flex items-center gap-2 right-2">
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
                    <div className="flex items-center justify-center w-4 h-4">×</div>
                  </button>
                )}
                <div className="relative sort-menu-container flex items-center gap-2">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    title="Download Backup (CSV)"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Backup</span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowSortMenu(p => !p)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 rounded-md"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{getSortLabel(sortOption)}</span>
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {(['nameAZ', 'nameZA', 'balanceHighLow', 'balanceLowHigh'] as SortOption[]).map(option => (
                          <button
                            key={option}
                            onClick={() => { setSortOption(option); setShowSortMenu(false); }}
                            className={`w-full px-4 py-2 text-xs text-left transition-colors hover:bg-gray-50 ${sortOption === option ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                          >
                            {getSortLabel(option)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : filteredAndSortedLedgers.length === 0 ? (
            <div className="p-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm sm:p-12 lg:p-16 sm:rounded-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full sm:w-14 sm:h-14 sm:mb-4 lg:w-16 lg:h-16">
                <Users className="w-6 h-6 text-gray-400 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
                {searchQuery ? t.noMatchingClients : t.noClients}
              </h3>
              <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria' : 'Add clients to start tracking their rental history'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 mt-3 text-xs font-medium text-blue-600 transition-colors rounded-lg sm:px-4 sm:py-2 sm:mt-4 sm:text-sm hover:text-blue-700 hover:bg-blue-50 touch-manipulation active:scale-95"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {filteredAndSortedLedgers.map(ledger => (
                  <ClientLedgerCard key={ledger.clientId} ledger={ledger} />
                ))}
              </div>
              {hasMore && loadingMore && (
                <div className="flex justify-center py-4 sm:py-8">
                  <div className="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Loading more clients...</span>
                  </div>
                </div>
              )}
              {!hasMore && filteredCount > ITEMS_PER_PAGE && (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">You've reached the end of the list</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
