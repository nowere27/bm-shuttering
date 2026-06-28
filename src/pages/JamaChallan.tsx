import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  ArrowLeft,
  UserPlus,
  FileText,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle,
  Package,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { naturalSort } from '../utils/sortingUtils';
import ClientForm from '../components/ClientForm';
import ItemsTable, { ItemsData } from '../components/ItemsTable';
import ReceiptTemplate from '../components/ReceiptTemplate';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';
import { generateJPEG } from '../utils/generateJPEG';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { fetchClientTransactions } from '../utils/challanFetching';


interface ClientFormData {
  id?: string;
  client_nic_name: string;
  client_name: string;
  site: string;
  primary_phone_number: string;
  is_hidden?: boolean;
}


type Step = 'client-selection' | 'challan-details';


interface ClientSelectionStepProps {
  clients: ClientFormData[];
  onClientSelect: (clientId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNewClick?: () => void;
  clientBalances: { [clientId: string]: number };
}


const ClientSelectionStep: React.FC<ClientSelectionStepProps> = ({
  clients,
  onClientSelect,
  searchQuery,
  onSearchChange,
  onAddNewClick,
  clientBalances,
}) => {
  const { t } = useLanguage();
  const filteredClients = clients
    .filter(client => !client.is_hidden)
    .filter(client => {
      const searchLower = searchQuery.toLowerCase().trim();

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
        (client.site || '').toLowerCase().includes(searchLower) ||
        (client.primary_phone_number || '').includes(searchQuery)
      );
    })
    .sort((a, b) => {
      const query = searchQuery.toLowerCase().trim();

      if (!query) {
        return naturalSort(a.client_nic_name || '', b.client_nic_name || '');
      }

      const aNic = (a.client_nic_name || '').toLowerCase();
      const bNic = (b.client_nic_name || '').toLowerCase();

      // Helper to extract numeric ID from start of string
      const getID = (str: string) => {
        const m = str.match(/^(\d+)/);
        return m ? m[1] : '';
      };

      const aId = getID(aNic);
      const bId = getID(bNic);

      // Priority 1: Exact ID match
      const aExactId = aId === query;
      const bExactId = bId === query;
      if (aExactId && !bExactId) return -1;
      if (bExactId && !aExactId) return 1;

      // Priority 2: Starts with search query
      const aStarts = aNic.startsWith(query);
      const bStarts = bNic.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      return naturalSort(a.client_nic_name || '', b.client_nic_name || '');
    });


  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header with Add Client Button */}
      {/* Search Bar - Compact */}

      {/* Search Bar - Compact */}
      <div className="relative">
        <Search className="absolute text-gray-400 transform -translate-y-1/2 left-2.5 sm:left-3 top-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchClients') || 'Search clients...'}
          className="w-full py-2 sm:py-2.5 lg:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
        />
      </div>


      {/* Results Count - Compact */}
      {searchQuery && (
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 border border-green-200 rounded-lg bg-green-50">
          <p className="text-[10px] sm:text-xs lg:text-sm text-green-700">
            Found <span className="font-semibold">{filteredClients.length}</span> client{filteredClients.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}


      {/* Client Grid - Mobile Optimized */}
      {filteredClients.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm sm:p-12 lg:p-16 sm:rounded-xl">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full sm:w-14 sm:h-14 sm:mb-4 lg:w-16 lg:h-16">
            <User className="w-6 h-6 text-gray-400 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
          </div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">No clients found</h3>
          <p className="mb-3 text-[10px] sm:text-xs lg:text-sm text-gray-500 sm:mb-4">
            {searchQuery ? 'Try adjusting your search' : 'No clients available'}
          </p>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-green-600 transition-colors rounded-lg hover:text-green-700 hover:bg-green-50 touch-manipulation active:scale-95"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => onClientSelect(client.id!)}
              className="p-3 text-left transition-all bg-white border border-gray-200 shadow-sm sm:p-4 lg:p-5 group rounded-lg sm:rounded-xl hover:shadow-md hover:border-green-500 touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 mb-2 sm:gap-3 sm:mb-3">
                <div className="p-1.5 sm:p-2 transition-colors bg-green-100 rounded-md sm:rounded-lg group-hover:bg-green-200">
                  <User className="w-4 h-4 text-green-600 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate transition-colors sm:text-base lg:text-lg group-hover:text-green-600">
                    {client.client_nic_name}
                  </h4>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">{client.client_name}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-[8px] sm:text-[9px] text-gray-500">કુલ બહાર</span>
                  <span className={`text-xs sm:text-sm font-semibold ${(clientBalances[client.id!] || 0) > 0 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                    {clientBalances[client.id!] || 0}
                  </span>
                </div>
                <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-400 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
              </div>
              <div className="pt-2 mt-2 border-t border-gray-100 sm:pt-3 sm:mt-3">
                {/* Mobile: Location and Phone in one line | Desktop: Stacked */}
                <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="flex-shrink-0 w-3 h-3 text-gray-400 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{client.site}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="flex-shrink-0 w-3 h-3 text-gray-400 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{client.primary_phone_number}</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}



    </div>
  );
};


interface ChallanDetailsStepProps {
  selectedClient: ClientFormData;
  onBack: () => void;
  onSave: () => void;
  challanNumber: string;
  setChallanNumber: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  driverName: string;
  setDriverName: (value: string) => void;
  previousDrivers: string[];
  previousDriversVisible: boolean;
  setPreviousDriversVisible: (value: boolean) => void;
  items: ItemsData;
  setItems: (items: ItemsData) => void;
  outstandingBalances: { [key: number]: number };
  borrowedOutstanding: { [key: number]: number };
  errors: { [key: string]: string };
  showSuccess: boolean;
  hideExtraColumns: boolean;
  setHideExtraColumns: (value: boolean) => void;
  isAllReturn: boolean;
  onAllReturn: () => void;
}


const ChallanDetailsStep: React.FC<ChallanDetailsStepProps> = ({
  selectedClient,
  onBack,
  onSave,
  challanNumber,
  setChallanNumber,
  date,
  setDate,
  driverName,
  setDriverName,
  previousDrivers,
  previousDriversVisible,
  setPreviousDriversVisible,
  items,
  setItems,
  outstandingBalances,
  borrowedOutstanding,
  errors,
  showSuccess,
  hideExtraColumns,
  setHideExtraColumns,
  isAllReturn,
  onAllReturn,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();


  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Selected Client Info - Compact Mobile with Back Button */}
      <div className="relative p-3 overflow-hidden border border-green-200 rounded-lg shadow-sm sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-emerald-50 sm:rounded-xl">
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-bl-full opacity-30 sm:w-24 sm:h-24 lg:w-32 lg:h-32"></div>
        <div className="relative">
          {/* Mobile Layout */}
          <div className="flex items-start gap-2 sm:hidden">
            <div className="p-2 bg-green-600 rounded-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-gray-900 truncate">{selectedClient.client_nic_name}</h4>
              <p className="text-xs text-gray-700 truncate">{selectedClient.client_name}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="flex-shrink-0 w-3 h-3 text-green-600" />
                  <span className="truncate">{selectedClient.site}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="flex-shrink-0 w-3 h-3 text-green-600" />
                  <span className="truncate">{selectedClient.primary_phone_number}</span>
                </span>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex-shrink-0 p-2 text-gray-600 transition-colors rounded-md hover:text-gray-900 hover:bg-gray-100 touch-manipulation active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Layout */}
          <div className="items-start hidden gap-2 sm:flex lg:gap-4">
            <button
              onClick={onBack}
              className="flex-shrink-0 p-2 text-gray-600 transition-colors rounded-md sm:p-2.5 lg:p-3 sm:rounded-lg hover:text-gray-900 hover:bg-gray-100 touch-manipulation active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
            </button>
            <div className="p-2 bg-green-600 rounded-md sm:p-2.5 lg:p-3 sm:rounded-lg">
              <User className="w-5 h-5 text-white sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate sm:text-base lg:text-lg">{selectedClient.client_nic_name}</h4>
              <p className="text-xs sm:text-xs lg:text-sm text-gray-700 truncate">{selectedClient.client_name}</p>
              <div className="grid grid-cols-1 gap-1 mt-2 sm:grid-cols-2 sm:gap-2 lg:mt-3">
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-xs lg:text-sm text-gray-600">
                  <MapPin className="flex-shrink-0 w-3 h-3 text-green-600 sm:w-3.5 sm:h-3.5" />
                  <span className="truncate">{selectedClient.site}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-xs lg:text-sm text-gray-600">
                  <Phone className="flex-shrink-0 w-3 h-3 text-green-600 sm:w-3.5 sm:h-3.5" />
                  <span className="truncate">{selectedClient.primary_phone_number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Basic Challan Details - Compact */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 lg:p-6 sm:rounded-xl">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-md sm:rounded-lg">
              <FileText className="w-4 h-4 text-green-600 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">{t('challanDetails')}</h3>
          </div>
          <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:gap-4">
            <div>
              <label className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-xs sm:text-xs lg:text-sm font-medium text-gray-700">
                <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {t('challanNumber')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  placeholder="Challan #"
                  className={`flex-1 px-2.5 py-2 sm:px-3 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-sm ${errors.challanNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <button
                  onClick={() => setHideExtraColumns(!hideExtraColumns)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-2 sm:px-3 text-xs sm:text-xs font-medium text-green-600 transition-colors rounded-md sm:rounded-lg bg-green-50 hover:bg-green-100 touch-manipulation active:scale-95 border border-green-100 whitespace-nowrap"
                >
                  {hideExtraColumns ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>
                    {t('columns2')}
                  </span>
                </button>
                <button
                  onClick={onAllReturn}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-2 sm:px-3 text-xs font-medium rounded-md sm:rounded-lg transition-colors touch-manipulation active:scale-95 border whitespace-nowrap ${
                    isAllReturn
                      ? 'bg-green-600 text-white border-green-600'
                      : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>All Return</span>
                </button>
              </div>
              {errors.challanNumber && (
                <p className="mt-1 text-xs sm:text-xs text-red-600 flex items-center gap-1">
                  <span>•</span> {errors.challanNumber}
                </p>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 lg:gap-4">
              <div className="w-1/2">
                <label className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-xs sm:text-xs lg:text-sm font-medium text-gray-700">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {t('date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-2.5 py-2 sm:px-3 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-sm ${errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.date && (
                  <p className="mt-1 text-xs sm:text-xs text-red-600 flex items-center gap-1">
                    <span>•</span> {errors.date}
                  </p>
                )}
              </div>

              <div className="w-1/2">
                <label className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-xs sm:text-xs lg:text-sm font-medium text-gray-700">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {t('driverName')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    onFocus={() => setPreviousDriversVisible(true)}
                    onBlur={() => {
                      // Use setTimeout to allow click events to fire on suggestions before hiding
                      setTimeout(() => {
                        setPreviousDriversVisible(false);
                      }, 200);
                    }}
                    placeholder={t('optional')}
                    className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  />
                  {previousDriversVisible && previousDrivers.length > 0 && (
                    <div
                      className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg driver-suggestions max-h-40"
                    >
                      {previousDrivers.map((driver, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            setDriverName(driver);
                            setPreviousDriversVisible(false);
                          }}
                          className="w-full px-3 py-2 text-xs text-left sm:text-sm hover:bg-green-50 focus:bg-green-50 focus:outline-none touch-manipulation"
                        >
                          {driver}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Items Table - Compact */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 lg:p-6 sm:rounded-xl">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-md sm:rounded-lg">
              <Package className="w-4 h-4 text-green-600 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">{t('items')}</h3>
          </div>
          {errors.items && (
            <div className="p-2 mb-3 border border-red-200 rounded-lg sm:p-3 sm:mb-4 bg-red-50">
              <p className="flex items-center gap-1.5 text-xs sm:text-xs text-red-600">
                <span>⚠</span> {errors.items}
              </p>
            </div>
          )}
          <ItemsTable
            items={items}
            onChange={setItems}
            outstandingBalances={outstandingBalances}
            borrowedOutstanding={borrowedOutstanding}
            hideColumns={hideExtraColumns}
          />
        </div>


        {/* Save or Success State - Mobile Optimized */}
        {showSuccess ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="relative p-6 overflow-hidden text-center border border-green-200 rounded-lg shadow-sm sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 sm:rounded-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full opacity-30 sm:w-32 sm:h-32"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-green-600 rounded-full sm:w-14 sm:h-14 sm:mb-4 lg:w-16 lg:h-16">
                  <CheckCircle className="w-6 h-6 text-white sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{t('challanSaved')}</h3>
                <p className="text-xs text-gray-600 sm:text-sm lg:text-base">Challan created and JPEG generated</p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-md sm:w-auto sm:px-8 sm:py-4 sm:text-base lg:text-lg hover:bg-green-700 hover:shadow-lg touch-manipulation active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
                {t('backToDashboard')}
              </button>
            </div>
          </div>
        ) : (
          <div className="sticky bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-gray-200 sm:static sm:p-0 sm:border-0 sm:bg-transparent">
            <button
              onClick={onSave}
              className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-md sm:w-auto sm:mx-auto sm:flex sm:px-8 sm:py-4 sm:text-base lg:text-lg hover:bg-green-700 hover:shadow-lg touch-manipulation active:scale-95"
            >
              <CheckCircle className="w-5 h-5 sm:w-5 sm:h-5" />
              {t('save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


const JamaChallan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();


  // Step management
  const [step, setStep] = useState<Step>('client-selection');
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<ClientFormData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientFormData | null>(null);
  const [clientBalances, setClientBalances] = useState<{ [clientId: string]: number }>({});

  // Form states
  const [challanNumber, setChallanNumber] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [driverName, setDriverName] = useState('');
  const [previousDrivers, setPreviousDrivers] = useState<string[]>([]);
  const [previousDriversVisible, setPreviousDriversVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const generateNextChallanNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("jama_challans")
        .select("jama_challan_number")
        .order('created_at', { ascending: false })
        .limit(1);


      if (error) throw error;

      let nextNumber = "1";

      if (data && data.length > 0) {
        const lastChallanNumber = data[0].jama_challan_number;
        const match = lastChallanNumber.match(/(\d+)$/);

        if (match) {
          const currentNumber = match[0];
          const prefix = lastChallanNumber.slice(0, -currentNumber.length);
          const lastNumber = parseInt(currentNumber);
          const incrementedNumber = lastNumber + 1;
          const paddedNumber = incrementedNumber.toString().padStart(currentNumber.length, '0');
          nextNumber = prefix + paddedNumber;
        } else {
          nextNumber = lastChallanNumber + "1";
        }
      }

      console.log('Generated next jama challan number:', nextNumber);
      setChallanNumber(nextNumber);

    } catch (error) {
      console.error("Error generating challan number:", error);
      const fallback = "1";
      setChallanNumber(fallback);
    }
  };
  const [hideExtraColumns, setHideExtraColumns] = useState(true);


  const [items, setItems] = useState<ItemsData>({
    size_1_qty: 0, size_2_qty: 0, size_3_qty: 0, size_4_qty: 0, size_5_qty: 0,
    size_6_qty: 0, size_7_qty: 0, size_8_qty: 0, size_9_qty: 0,
    size_1_borrowed: 0, size_2_borrowed: 0, size_3_borrowed: 0, size_4_borrowed: 0, size_5_borrowed: 0,
    size_6_borrowed: 0, size_7_borrowed: 0, size_8_borrowed: 0, size_9_borrowed: 0,
    size_1_note: '', size_2_note: '', size_3_note: '', size_4_note: '', size_5_note: '',
    size_6_note: '', size_7_note: '', size_8_note: '', size_9_note: '',
    main_note: '',
  });
  const [outstandingBalances, setOutstandingBalances] = useState<{ [key: number]: number }>({});
  const [borrowedOutstanding, setBorrowedOutstanding] = useState<{ [key: number]: number }>({});
  const [isAllReturn, setIsAllReturn] = useState(false);


  const fetchPreviousDriverNames = async () => {
    try {
      const [jamaResponse, udharResponse] = await Promise.all([
        supabase
          .from('jama_challans')
          .select('driver_name, created_at')
          .not('driver_name', 'is', null),
        supabase
          .from('udhar_challans')
          .select('driver_name, created_at')
          .not('driver_name', 'is', null)
      ]);


      if (jamaResponse.error) throw jamaResponse.error;
      if (udharResponse.error) throw udharResponse.error;


      const allDrivers = [...(jamaResponse.data || []), ...(udharResponse.data || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(row => row.driver_name?.trim().toLowerCase())
        .filter(Boolean);


      const uniqueDrivers = Array.from(new Set(allDrivers))
        .map(name => name.replace(/\b\w/g, (letter: string) => letter.toUpperCase())) // Capitalize first letter of each word
        .slice(0, 10);


      setPreviousDrivers(uniqueDrivers);
    } catch (error) {
      console.error('Error fetching previous driver names:', error);
    }
  };


  useEffect(() => {
    const init = async () => {
      await fetchClients();
      await generateNextChallanNumber();
      await fetchPreviousDriverNames();
    };
    init();
  }, []);

  useEffect(() => {
    // Check if client was preselected from navigation
    const state = location.state as { preselectedClient?: { id: string; nicName: string; fullName: string; site: string; phone: string } };
    if (state?.preselectedClient && clients.length > 0) {
      const client = clients.find(c => c.id === state.preselectedClient!.id);
      if (client) {
        handleClientSelect(client.id!);
      }
    }
  }, [location, clients]);


  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_nic_name');


    if (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
      return;
    }


    setClients(data || []);

    // Fetch balances for all clients
    if (data && data.length > 0) {
      await fetchAllClientBalances(data);
    }
  };

  const fetchAllClientBalances = async (clientsList: ClientFormData[]) => {
    const balances: { [clientId: string]: number } = {};

    // Fetch balances for each client
    await Promise.all(
      clientsList.map(async (client) => {
        try {
          const transactions = await fetchClientTransactions(client.id!);

          let grandTotal = 0;
          transactions.forEach(transaction => {
            for (let i = 1; i <= 9; i++) {
              const qty = transaction.items[`size_${i}_qty`] || 0;
              const borrowed = transaction.items[`size_${i}_borrowed`] || 0;

              if (transaction.type === 'udhar') {
                grandTotal += qty + borrowed;
              } else {
                grandTotal -= qty + borrowed;
              }
            }
          });

          balances[client.id!] = grandTotal;
        } catch (error) {
          console.error(`Error fetching balance for client ${client.id}:`, error);
          balances[client.id!] = 0;
        }
      })
    );

    setClientBalances(balances);
  };


  const handleAddNewClick = () => {
    setShowAddClient(true);
  };


  const handleClientSelect = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setStep('challan-details');


      const transactions = await fetchClientTransactions(clientId);


      const balances: { [key: number]: number } = {};
      for (let i = 1; i <= 9; i++) {
        balances[i] = 0;
      }


      const borrowedBal: { [key: number]: number } = {};
      for (let i = 1; i <= 9; i++) borrowedBal[i] = 0;


      transactions.forEach(transaction => {
        for (let i = 1; i <= 9; i++) {
          const qty = transaction.items[`size_${i}_qty`] || 0;
          const borrowed = transaction.items[`size_${i}_borrowed`] || 0;
          const totalMain = qty;


          if (transaction.type === 'udhar') {
            balances[i] += totalMain;
            borrowedBal[i] += borrowed;
          } else {
            balances[i] -= totalMain;
            borrowedBal[i] -= borrowed;
          }
        }
      });


      setOutstandingBalances(balances);
      setBorrowedOutstanding(borrowedBal);
      setIsAllReturn(false);

      // Auto-show borrowed column if there are borrowed items
      const hasBorrowedItems = Object.values(borrowedBal).some(val => val > 0);
      if (hasBorrowedItems) {
        setHideExtraColumns(false);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };


  const handleQuickAddClient = async (clientData: ClientFormData) => {
    const loadingToast = toast.loading('Creating client...');

    // Check for duplicate sort name
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('client_nic_name', clientData.client_nic_name)
      .single();

    if (existingClient) {
      toast.dismiss(loadingToast);
      toast.error('A client with this sort name already exists');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      toast.dismiss(loadingToast);

      if (error) throw error;

      toast.success('Client created successfully');
      setShowAddClient(false);
      await fetchClients();

      if (data) {
        handleClientSelect(data.id!);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error adding client:', error);
      toast.error('Failed to create client');
    }
  };


  const handleAllReturn = () => {
    setIsAllReturn(true);
    const newItems = { ...items };
    for (let i = 1; i <= 9; i++) {
      (newItems as any)[`size_${i}_qty`] = outstandingBalances[i] || 0;
      (newItems as any)[`size_${i}_borrowed`] = borrowedOutstanding[i] || 0;
    }
    setItems(newItems);
  };

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};
    let hasErrors = false;


    if (!selectedClient) {
      newErrors.client = t('requiredField');
      hasErrors = true;
    }


    if (!challanNumber) {
      newErrors.challanNumber = t('requiredField');
      hasErrors = true;
    }


    if (!date) {
      newErrors.date = t('requiredField');
      hasErrors = true;
    }

    // Validate against outstanding balances
    for (let i = 1; i <= 9; i++) {
      const qty = items[`size_${i}_qty` as keyof ItemsData] as number || 0;
      const borrowed = items[`size_${i}_borrowed` as keyof ItemsData] as number || 0;

      const currentBalance = outstandingBalances[i] || 0;
      const currentBorrowedBalance = borrowedOutstanding[i] || 0;

      if (qty > 0 && qty > currentBalance) {
        toast.error(`Cannot return more than available stock for Size ${i}. Available: ${currentBalance}`);
        return;
      }

      if (borrowed > 0 && borrowed > currentBorrowedBalance) {
        toast.error(`Cannot return more than borrowed stock for Size ${i}. Available: ${currentBorrowedBalance}`);
        return;
      }
    }


    const hasQuantities = Object.entries(items)
      .filter(([key]) => key.includes('_qty'))
      .some(([_, value]) => value > 0);

    const hasBorrowedItems = Object.entries(items)
      .filter(([key]) => key.includes('_borrowed'))
      .some(([_, value]) => value > 0);


    if (!hasQuantities && !hasBorrowedItems) {
      newErrors.items = 'At least one item quantity or borrowed quantity must be greater than 0';
      hasErrors = true;
    }


    if (hasErrors) {
      setErrors(newErrors);
      toast.error('Please fill all required fields');
      return;
    }


    const loadingToast = toast.loading('Creating challan...');


    try {
      if (!selectedClient?.id) return;


      const { data: existingChallan } = await supabase
        .from('jama_challans')
        .select('jama_challan_number')
        .eq('jama_challan_number', challanNumber)
        .maybeSingle();


      if (existingChallan) {
        toast.dismiss(loadingToast);
        toast.error(t('duplicateChallan'));
        await generateNextChallanNumber();
        return;
      }


      const { error } = await supabase.from('jama_challans').insert([
        {
          jama_challan_number: challanNumber,
          client_id: selectedClient.id,
          jama_date: date,
          driver_name: driverName,
          is_all_return: isAllReturn,
        },
      ]);


      if (error) throw error;


      const { error: itemsError } = await supabase.from('jama_items').insert([
        {
          jama_challan_number: challanNumber,
          ...items,
        },
      ]);


      if (itemsError) throw itemsError;


      toast.dismiss(loadingToast);
      toast.success('Challan created successfully');
      setShowSuccess(true);


      setTimeout(async () => {
        try {
          await generateJPEG('jama', challanNumber, date, 2440, 1697);
          toast.success('JPEG generated successfully');
          // Add a delay before refreshing to ensure user sees the success message
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error('Error generating JPEG:', error);
          toast.error('Failed to generate JPEG');
          // Refresh even if JPEG generation fails
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }, 500);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error saving challan:', error);
      toast.error('Failed to create challan');
    }
  };


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
      <main className="flex-1 w-full ml-0 overflow-auto pt-14 sm:pt-0 lg:ml-64">
        <div className="w-full px-3 py-3 pb-20 mx-auto sm:px-4 sm:py-5 lg:px-8 lg:py-12 lg:pb-12 max-w-7xl">
          {step === 'client-selection' ? (
            <>
              <div className="items-center justify-between hidden mb-6 sm:flex lg:mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl">{t('jamaChallan')}</h2>
                  <p className="mt-1 text-xs text-gray-600 lg:text-sm lg:mt-2">Create new jama challan for returned items</p>
                </div>
                {!showAddClient && (
                  <button
                    onClick={handleAddNewClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-600 transition-colors bg-green-50 rounded-lg hover:bg-green-100 touch-manipulation active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t('addNewClient')}
                  </button>
                )}
              </div>
              {showAddClient ? (
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 lg:p-6 sm:rounded-xl">
                  <ClientForm
                    onSubmit={handleQuickAddClient}
                    onCancel={() => setShowAddClient(false)}
                  />
                </div>
              ) : (
                <ClientSelectionStep
                  clients={clients}
                  onClientSelect={handleClientSelect}
                  onAddNewClick={handleAddNewClick}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  clientBalances={clientBalances}
                />
              )}
            </>
          ) : (
            selectedClient && (
              <ChallanDetailsStep
                selectedClient={selectedClient}
                onBack={() => setStep('client-selection')}
                onSave={handleSave}
                challanNumber={challanNumber}
                setChallanNumber={setChallanNumber}
                date={date}
                setDate={setDate}
                driverName={driverName}
                setDriverName={setDriverName}
                previousDrivers={previousDrivers}
                previousDriversVisible={previousDriversVisible}
                setPreviousDriversVisible={setPreviousDriversVisible}
                items={items}
                setItems={setItems}
                outstandingBalances={outstandingBalances}
                borrowedOutstanding={borrowedOutstanding}
                errors={errors}
                showSuccess={showSuccess}
                hideExtraColumns={hideExtraColumns}
                setHideExtraColumns={setHideExtraColumns}
                isAllReturn={isAllReturn}
                onAllReturn={handleAllReturn}
              />
            )
          )}


          <div style={{ position: 'absolute', left: '-9999px', width: '2450px' }}>
            {selectedClient && (
              <div
                id="receipt-template"
                style={{
                  display: 'flex',
                  gap: '40px',
                  backgroundColor: 'white',
                  padding: 0
                }}
              >
                <div style={{ position: 'relative', width: '1200px', height: '1697px' }}>
                  <ReceiptTemplate
                    challanType="jama"
                    challanNumber={challanNumber}
                    date={new Date(date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    clientName={selectedClient.client_name}
                    clientSortName={selectedClient.client_nic_name}
                    site={selectedClient.site}
                    phone={selectedClient.primary_phone_number}
                    driverName={driverName}
                    items={items}
                  />
                </div>
                <div style={{ position: 'relative', width: '1200px', height: '1697px' }}>
                  <ReceiptTemplate
                    challanType="jama"
                    challanNumber={challanNumber}
                    date={new Date(date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    clientName={selectedClient.client_name}
                    clientSortName={selectedClient.client_nic_name}
                    site={selectedClient.site}
                    phone={selectedClient.primary_phone_number}
                    driverName={driverName}
                    items={items}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};


export default JamaChallan;
