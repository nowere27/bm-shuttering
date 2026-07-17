import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Plus,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

type SortOption = 'nameAZ' | 'nameZA';
import ClientForm, { ClientFormData } from '../components/ClientForm';

// Natural sort function for client names
const naturalSort = (a: string, b: string): number => {
  // Helper function to extract number and suffix
  const parseClientName = (name: string): { num: number; suffix: string } => {
    const match = name.match(/^(\d+)([a-zA-Z]*)$/);
    if (match) {
      return {
        num: parseInt(match[1]),
        suffix: match[2].toLowerCase()
      };
    }
    return { num: 0, suffix: name.toLowerCase() };
  };

  // Parse both strings
  const aInfo = parseClientName(a.trim());
  const bInfo = parseClientName(b.trim());

  // If both have numbers, compare numbers first
  if (aInfo.num > 0 && bInfo.num > 0) {
    if (aInfo.num !== bInfo.num) {
      return aInfo.num - bInfo.num;
    }
    // If numbers are equal, compare suffixes
    return aInfo.suffix.localeCompare(bInfo.suffix);
  }

  // If only one has a number, put numbered items first
  if (aInfo.num > 0 && bInfo.num === 0) return -1;
  if (aInfo.num === 0 && bInfo.num > 0) return 1;

  // If neither has a number, do a regular string compare
  return a.toLowerCase().localeCompare(b.toLowerCase());
};
import ClientList from '../components/ClientList';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';
import toast, { Toaster } from 'react-hot-toast';

const ClientManagement: React.FC = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientFormData[]>([]);
  const [editingClient, setEditingClient] = useState<ClientFormData | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allClients, setAllClients] = useState<ClientFormData[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('nameAZ');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Scroll handler for infinite loading
  const handleScroll = async (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const scrolledToBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5;

    if (!loadingMore && hasMore && scrolledToBottom) {
      setLoadingMore(true);
      try {
        const relevantClients = searchQuery
          ? allClients.filter(client => {
            const searchLower = searchQuery.toLowerCase();
            return client.client_nic_name.toLowerCase().includes(searchLower) ||
              client.client_name.toLowerCase().includes(searchLower) ||
              client.site.toLowerCase().includes(searchLower);
          })
          : allClients;

        const start = currentPage * ITEMS_PER_PAGE;
        const nextBatch = relevantClients.slice(start, start + ITEMS_PER_PAGE);

        if (nextBatch.length > 0) {
          setClients(prev => [...prev, ...nextBatch]);
          setCurrentPage(prev => prev + 1);
          setHasMore(start + ITEMS_PER_PAGE < relevantClients.length);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading more clients:', error);
        toast.error('Failed to load more clients');
      } finally {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [sortOption]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
    if (searchQuery) {
      const filteredResults = allClients.filter(client => {
        const searchLower = searchQuery.toLowerCase();
        return client.client_nic_name.toLowerCase().includes(searchLower) ||
          client.client_name.toLowerCase().includes(searchLower) ||
          client.site.toLowerCase().includes(searchLower);
      });
      setClients(filteredResults.slice(0, ITEMS_PER_PAGE));
      setHasMore(filteredResults.length > ITEMS_PER_PAGE);
    } else {
      setClients(allClients.slice(0, ITEMS_PER_PAGE));
      setHasMore(allClients.length > ITEMS_PER_PAGE);
    }
  }, [searchQuery, allClients]);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'nameAZ': return t('nameAZ') || 'Name (A to Z)';
      case 'nameZA': return t('nameZA') || 'Name (Z to A)';
      default: return '';
    }
  };

  // Click outside handler to close sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-menu-container')) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClients = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) {
        console.error('Error fetching clients:', error);
        toast.error(t('failedToLoad'));
        return;
      }

      // Sort the data using improved natural sort
      const sortedData = [...(data || [])].sort((a, b) => {
        const result = naturalSort(
          a.client_nic_name.toString(),
          b.client_nic_name.toString()
        );
        return sortOption === 'nameAZ' ? result : -result;
      });

      // Store all clients
      setAllClients(sortedData);

      // Set initial batch
      const initialBatch = sortedData.slice(0, ITEMS_PER_PAGE);
      setClients(initialBatch);

      // Reset pagination
      setCurrentPage(1);
      setHasMore(sortedData.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    const loadingToast = toast.loading(editingClient?.id ? 'Updating client...' : 'Creating client...');

    if (editingClient?.id) {
      // Check for duplicate sort name (only if name changed)
      if (data.client_nic_name !== editingClient.client_nic_name) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('client_nic_name', data.client_nic_name)
          .single();

        if (existingClient) {
          toast.dismiss(loadingToast);
          toast.error('A client with this sort name already exists');
          return;
        }
      }

      const { error } = await supabase
        .from('clients')
        .update({
          client_nic_name: data.client_nic_name,
          client_name: data.client_name,
          site: data.site,
          primary_phone_number: data.primary_phone_number,
          daily_rent_price: data.daily_rent_price ?? 1,
          jack_rents: data.jack_rents ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.id);

      toast.dismiss(loadingToast);

      if (error) {
        console.error('Error updating client:', error);
        toast.error(t('failedToUpdate'));
      } else {
        toast.success(t('clientUpdated'));
        setEditingClient(undefined);
        setShowForm(false);
        fetchClients();
      }
    } else {
      // Check for duplicate sort name when creating
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('client_nic_name', data.client_nic_name)
        .single();

      if (existingClient) {
        toast.dismiss(loadingToast);
        toast.error('A client with this sort name already exists');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .insert({
          client_nic_name: data.client_nic_name,
          client_name: data.client_name,
          site: data.site,
          primary_phone_number: data.primary_phone_number,
          daily_rent_price: data.daily_rent_price ?? 1,
          jack_rents: data.jack_rents ?? {},
        });

      toast.dismiss(loadingToast);

      if (error) {
        console.error('Error creating client:', error);
        toast.error('Failed to create client');
      } else {
        toast.success('Client created successfully');
        setShowForm(false);
        fetchClients();
      }
    }
  };

  const handleEdit = (client: ClientFormData) => {
    setEditingClient(client);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show a toast-based confirmation with Cancel and Delete actions
  const showDeleteConfirmToast = (clientName?: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const toastId = toast(() => (
        <div className="max-w-sm">
          <div className="mb-2 font-medium">{t('deleteConfirm')}</div>
          {clientName && <div className="mb-3 text-sm truncate">"{clientName}"</div>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { toast.dismiss(String(toastId)); resolve(false); }}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => { toast.dismiss(String(toastId)); resolve(true); }}
              className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      ), { duration: Infinity });
    });
  };

  const handleDelete = async (id: string) => {
    const client = clients.find(c => c.id === id);
    const confirmed = await showDeleteConfirmToast(client?.client_nic_name);

    if (!confirmed) return;

    const loadingToast = toast.loading(t('deletingClient') || 'Deleting client...');

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    toast.dismiss(loadingToast);

    if (error) {
      console.error('Error deleting client:', error);
      toast.error(t('failedToDelete'));
    } else {
      toast.success(t('clientDeleted'));
      fetchClients();
    }
  };
  
  const handleToggleHide = async (client: ClientFormData) => {
    if (!client.id) return;
    
    const loadingToast = toast.loading(client.is_hidden ? 'Unhiding client...' : 'Hiding client...');
    
    const { error } = await supabase
      .from('clients')
      .update({ is_hidden: !client.is_hidden })
      .eq('id', client.id);
      
    toast.dismiss(loadingToast);
    
    if (error) {
      console.error('Error toggling hide status:', error);
      toast.error('Failed to update hide status');
    } else {
      toast.success(client.is_hidden ? 'Client unhidden' : 'Client hidden');
      fetchClients();
    }
  };

  const handleCancel = () => {
    setEditingClient(undefined);
    setShowForm(false);
  };

  const filteredClients = useMemo(() => {
    // First filter the clients
    const filteredAllClients = allClients.filter(client => {
      // Respect showHidden toggle
      if (!showHidden && client.is_hidden) return false;

      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;

      // Try to parse the search term as a number
      const searchNum = parseInt(searchLower);
      const isSearchingNumber = !isNaN(searchNum);

      // If searching for a number, try to match it against the numeric part of client_nic_name
      if (isSearchingNumber) {
        const nicNameMatch = client.client_nic_name?.match(/^(\d+)/);
        if (nicNameMatch) {
          const clientNum = parseInt(nicNameMatch[1]);
          if (clientNum === searchNum) return true;
        }
      }

      // Standard text search
      return (
        (client.client_nic_name || '').toLowerCase().includes(searchLower) ||
        (client.client_name || '').toLowerCase().includes(searchLower) ||
        (client.site || '').toLowerCase().includes(searchLower)
      );
    });

    // Sort using natural sort
    const sortedClients = [...filteredAllClients].sort((a, b) => {
      const result = naturalSort(
        (a.client_nic_name || '').toString(),
        (b.client_nic_name || '').toString()
      );
      return sortOption === 'nameAZ' ? result : -result;
    });

    // Return only the paginated portion
    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
    return sortedClients.slice(start, end);
  }, [allClients, searchQuery, currentPage, sortOption, showHidden]);



  const SkeletonCard = () => (
    <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-3 lg:p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="w-20 h-3 mb-1.5 bg-gray-200 rounded sm:w-24 sm:h-4 sm:mb-2"></div>
          <div className="w-24 h-2.5 bg-gray-200 rounded sm:w-32 sm:h-3"></div>
        </div>
        <div className="w-12 h-5 bg-gray-200 rounded sm:w-16 sm:h-6"></div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '13px',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Navbar />
      <main
        className="flex-1 w-full ml-0 overflow-y-auto pt-14 sm:pt-0 lg:ml-64 h-[100dvh]"
        onScroll={handleScroll}
      >
        <div className="w-full px-4 py-6 mx-auto lg:px-8 lg:py-8 max-w-7xl" style={{ backgroundColor: '#f9fafb' }}>
          {/* Header Section - Hidden on Mobile */}
          <div className="hidden mb-4 sm:block sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{t('clients')}</h1>
                <p className="mt-1 text-xs text-gray-600">{t('search')}</p>
              </div>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 touch-manipulation active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('addNewClient')}
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Search Bar with Integrated Filter */}
          <div className="flex items-center gap-2 mb-4 w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder={t('searchClients')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute p-1 text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                >
                  <div className="flex items-center justify-center w-4 h-4 text-lg">×</div>
                </button>
              )}
            </div>

            {/* Filter Buttons (Separate) */}
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showHidden 
                  ? 'bg-orange-50 border-orange-200 text-orange-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={showHidden ? t('hideHidden') : t('showHidden')}
            >
              {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{showHidden ? t('hideHidden') : t('showHidden')}</span>
            </button>

            <div className="relative sort-menu-container">
              <button
                onClick={() => setShowSortMenu(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title={getSortLabel(sortOption)}
              >
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">{getSortLabel(sortOption)}</span>
              </button>

              {/* Sort Options Dropdown */}
              {showSortMenu && (
                <div className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {(['nameAZ', 'nameZA'] as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortOption(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-xs text-left transition-colors hover:bg-gray-50 ${sortOption === option ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                    >
                      {getSortLabel(option)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>



          {/* Client Form Modal (Centered on all screens) */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-50 sm:p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[95vh] p-4 sm:p-6 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${editingClient ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                      <UserPlus size={18} className={editingClient ? 'text-yellow-600' : 'text-blue-600'} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                        {editingClient ? t('editClient') : t('addNewClient')}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {editingClient ? t('editClient') : t('addNewClient')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form Content */}
                <div>
                  <ClientForm
                    initialData={editingClient}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Client List Section - Compact */}
          <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-3 lg:p-6 sm:rounded-xl">
            <div className="flex items-center gap-1.5 mb-3 sm:gap-2 sm:mb-4 lg:mb-6">
              <div className="p-1 sm:p-1.5 lg:p-2 bg-blue-100 rounded sm:rounded-md lg:rounded-lg">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 sm:text-base lg:text-xl">{t('clientList')}</h3>
                <p className="text-[9px] sm:text-[10px] lg:text-sm text-gray-500 leading-tight">
                  {clients.length} {t('clientsWord') || 'clients'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-1.5 sm:space-y-2 lg:space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : clients.length === 0 ? (
              <div className="py-6 text-center sm:py-8 lg:py-16">
                <div className="inline-flex items-center justify-center w-10 h-10 mb-2 bg-gray-100 rounded-full sm:w-12 sm:h-12 sm:mb-3 lg:w-16 lg:h-16 lg:mb-4">
                  <Users className="w-5 h-5 text-gray-400 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-gray-900 sm:text-base sm:mb-2 lg:text-lg">{t('noClientsYet')}</h3>
                <p className="mb-3 text-[10px] sm:text-xs text-gray-500 sm:mb-4 lg:text-sm lg:mb-6">{t('getStartedByAdding')}</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md"
                >
                  <UserPlus size={18} />
                  {t('addYourFirstClient')}
                </button>
              </div>
            ) : (
              <ClientList clients={filteredClients} onEdit={handleEdit} onDelete={handleDelete} onToggleHide={handleToggleHide} />
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB) - Mobile Only */}
        <button
          onClick={() => {
            setShowForm(true);
            setEditingClient(undefined);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed z-50 flex items-center justify-center transition-all shadow-lg lg:hidden bottom-6 right-4 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl hover:shadow-2xl active:scale-90 touch-manipulation"
          aria-label="Add new client"
        >
          <Plus className="text-white w-7 h-7" strokeWidth={2.5} />
        </button>

        {/* Mobile drawer replaced by unified centered modal dialog above */}
      </main>
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ClientManagement;