import { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, Filter, Download, X, Wallet, FileText } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../utils/supabase";
import Navbar from "../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { subDays, parseISO } from "date-fns";
import * as periodCalculations from "../utils/billingPeriodCalculations";
import { generateBillJPEG } from "../utils/generateBillJPEG";
import BillInvoiceTemplate from "../components/BillInvoiceTemplate";
import { useNavigate } from "react-router-dom";
import BillCard, { BillRecord } from "../components/BillCard";

type SortOption = 'dateNewOld' | 'dateOldNew' | 'amountHighLow' | 'amountLowHigh';



export default function BillBook() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>('dateNewOld');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // View/Download State
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load Bills
  const loadBills = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bills")
        .select(`
          *,
          client:clients (
            client_name,
            client_nic_name,
            site,
            primary_phone_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBills(data || []);
      if (showRefreshToast) toast.success('Bills refreshed');
    } catch (error) {
      console.error("Error loading bills:", error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBills();


  }, []);

  // Filter & Sort
  const filteredAndSortedBills = useMemo(() => {
    let result = bills.filter((bill) =>
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.client?.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.client?.client_nic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.client?.site?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return result.sort((a, b) => {
      // Priority based on search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();

        // Check Bill Number matches
        const aBill = a.bill_number.toLowerCase();
        const bBill = b.bill_number.toLowerCase();

        // Exact bill number match
        if (aBill === query && bBill !== query) return -1;
        if (bBill === query && aBill !== query) return 1;

        // Check Client Nic Name (ID) matches
        const aNic = (a.client?.client_nic_name || '').toLowerCase();
        const bNic = (b.client?.client_nic_name || '').toLowerCase();

        const getID = (str: string) => {
          const m = str.match(/^(\d+)/);
          return m ? m[1] : '';
        };

        const aId = getID(aNic);
        const bId = getID(bNic);

        // Exact ID matches
        const aExactId = aId === query;
        const bExactId = bId === query;

        if (aExactId && !bExactId) return -1;
        if (bExactId && !aExactId) return 1;

        // Starts with search query
        const aStarts = aBill.startsWith(query) || aNic.startsWith(query);
        const bStarts = bBill.startsWith(query) || bNic.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
      }

      const dateA = new Date(a.billdate || a.billing_date || a.bill_date || a.created_at).getTime();
      const dateB = new Date(b.billdate || b.billing_date || b.bill_date || b.created_at).getTime();
      const amountA = a.grand_total || a.total_amount || 0;
      const amountB = b.grand_total || b.total_amount || 0;

      switch (sortOption) {
        case 'dateNewOld': return dateB - dateA;
        case 'dateOldNew': return dateA - dateB;
        case 'amountHighLow': return amountB - amountA;
        case 'amountLowHigh': return amountA - amountB;
        default: return 0;
      }
    });
  }, [bills, searchQuery, sortOption]);

  const getSortLabel = (option: SortOption) => {
    return t(option) || option;
  };

  // Fetch Full Bill Details
  const fetchBillDetails = async (bill: any) => {
    setLoadingDetails(true);
    try {
      // 1. Fetch Related Data (Extra Costs, Discounts, Payments)
      const { data: extraCosts } = await supabase
        .from('bill_extra_costs').select('*').eq('bill_number', bill.bill_number);

      const { data: discounts } = await supabase
        .from('bill_discounts').select('*').eq('bill_number', bill.bill_number);

      const { data: payments } = await supabase
        .from('bill_payments').select('*').eq('bill_number', bill.bill_number);

      // 2. Fetch Client Challans for Re-calculation
      const { data: udharChallans } = await supabase
        .from('udhar_challans')
        .select(`*, items:udhar_items(*)`)
        .eq('client_id', bill.client_id)
        .order('udhar_date', { ascending: true });

      const { data: jamaChallans } = await supabase
        .from('jama_challans')
        .select(`*, items:jama_items(*)`)
        .eq('client_id', bill.client_id)
        .order('jama_date', { ascending: true });

      // resolve main date
      const billDateStr = bill.billdate || bill.billing_date || bill.bill_date || bill.created_at;

      // 3. Re-calculate Bill
      // ... (existing calc code) ...
      const calcExtra = (extraCosts || []).map((c: any) => ({ amount: (c.total_amount || (c.pieces * c.price_per_piece)) }));
      const calcDisc = (discounts || []).map((d: any) => ({ amount: (d.total_amount || (d.pieces * d.discount_per_piece)) }));
      const calcPay = (payments || []).map((p: any) => ({ amount: p.amount }));

      const result = periodCalculations.calculateBill(
        udharChallans || [],
        jamaChallans || [],
        bill.to_date || billDateStr, // End date fallback
        bill.daily_rent || 1.5,
        calcExtra,
        calcDisc,
        calcPay,
        10, // serviceRate
        bill.from_date // Important: Use bill's from_date for correct period calculation
      );

      console.log('Calculated Periods:', result.billingPeriods.periods); // DEBUG LOG

      // FETCH PREVIOUS BILL for Pending Amount Display
      let previousBillData = undefined;
      // We look for the bill that ends just before this one starts, or the immediately preceding bill
      const { data: prevBills } = await supabase
        .from('bills')
        .select('bill_number, due_payment, to_date')
        .eq('client_id', bill.client_id)
        .lt('to_date', bill.from_date || billDateStr) // Bills ending before this one starts
        .order('to_date', { ascending: false })
        .limit(1);

      if (prevBills && prevBills.length > 0) {
        const prev = prevBills[0];
        if ((prev.due_payment || 0) > 0) {
          previousBillData = {
            billNumber: prev.bill_number,
            amount: prev.due_payment
          };
        }
      }

      // Calculate derived totals to ensure display even if DB columns are 0
      const calculatedTotalRent = bill.total_rent_amount || result.billingPeriods.totalRent || 0;
      const calculatedExtra = bill.total_extra_cost || (extraCosts || []).reduce((sum: any, c: any) => sum + (c.total_amount || (c.pieces * c.price_per_piece)), 0);
      const calculatedDiscount = bill.total_discount || (discounts || []).reduce((sum: any, d: any) => sum + (d.total_amount || (d.pieces * d.discount_per_piece)), 0);
      const calculatedPaid = bill.total_payment || (payments || []).reduce((sum: any, p: any) => sum + p.amount, 0);
      const pending = previousBillData?.amount || 0;

      const derivedGrandTotal = calculatedTotalRent + calculatedExtra + pending;
      const derivedDue = derivedGrandTotal - calculatedDiscount - calculatedPaid;

      // 4. Construct Full Bill Object
      const fullBillData = {
        companyDetails: {
          name: "ખાતા કેન્દ્ર",
          address: "10, Ajmaldham Society, Simada Gam, Surat.",
          phone: "93287 28228",
        },
        billDetails: {
          billNumber: bill.bill_number,
          billDate: billDateStr,
          fromDate: bill.from_date || (udharChallans && udharChallans[0]?.udhar_date) || billDateStr,
          toDate: bill.to_date || billDateStr,
          dailyRent: bill.daily_rent,
        },
        clientDetails: {
          name: bill.client?.client_name,
          nicName: bill.client?.client_nic_name,
          site: bill.client?.site,
          phone: bill.client?.primary_phone_number,
        },
        previousBill: previousBillData, // Pass the previous bill data here
        rentalCharges: result.billingPeriods.periods.map((p: any) => ({
          size: "All",
          startDate: p.startDate,
          endDate: subDays(parseISO(p.endDate), 1).toISOString(),
          pieces: p.plateCount,
          days: p.days,
          rate: bill.daily_rent || 1.5,
          amount: p.rent,
          causeType: p.causeType,
          txnQty: (p.txnQty !== undefined && p.txnQty !== null) ? p.txnQty : 0,
          udharQty: p.udharQty,
          jamaQty: p.jamaQty,
          udharDetails: p.udharDetails,
          jamaDetails: p.jamaDetails,
        })),
        extraCosts: (extraCosts || []).map((c: any) => ({
          id: c.id,
          date: c.date,
          description: c.note,
          amount: c.total_amount || (c.pieces * c.price_per_piece),
          pieces: c.pieces,
          rate: c.price_per_piece
        })),
        discounts: (discounts || []).map((d: any) => ({
          id: d.id, date: d.date, description: d.note, amount: d.total_amount || (d.pieces * d.discount_per_piece)
        })),
        payments: (payments || []).map((p: any) => ({
          id: p.id, date: p.date, method: p.payment_method, note: p.note, amount: p.amount
        })),
        summary: {
          grandTotal: bill.grand_total || bill.total_amount || derivedGrandTotal,
          totalPaid: calculatedPaid,
          duePayment: bill.due_payment !== undefined ? bill.due_payment : derivedDue,
          totalRent: calculatedTotalRent,
          totalExtraCosts: calculatedExtra,
          discounts: calculatedDiscount,
          // placeholders for template required fields
          totalUdharPlates: 0,
          totalJamaPlates: 0,
          netPlates: 0,
          serviceCharge: 0,
          advancePaid: 0
        },
        mainNote: ""
      };

      return fullBillData;

    } catch (error) {
      console.error('Error details:', error);
      toast.error('Failed to load bill details');
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewBill = async (bill: BillRecord) => {
    const details = await fetchBillDetails(bill);
    if (details) {
      setSelectedBill(details);
      setShowModal(true);
    }
  };

  const handleDownloadBill = async (bill: BillRecord) => {
    const toastId = toast.loading(t("loadingDetails"));
    try {
      const details = await fetchBillDetails(bill);
      if (details) {
        await generateBillJPEG(bill.bill_number, details);
        toast.success(t("challanDownloadSuccess"), { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.error(t("challanDownloadError"), { id: toastId });
    }
  };

  const handleDeleteBill = async (bill: BillRecord) => {
    if (window.confirm(`Are you sure you want to delete Bill #${bill.bill_number}? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('bills')
          .delete()
          .eq('bill_number', bill.bill_number);

        if (error) throw error;

        toast.success("Bill deleted successfully");
        loadBills(); // Refresh list
      } catch (error) {
        console.error("Error deleting bill:", error);
        toast.error("Failed to delete bill");
      }
    }
  };


  const handleEditBill = (bill: BillRecord) => {
    // Navigate to CreateBill page with edit param
    const encodedBillNumber = encodeURIComponent(bill.bill_number);
    navigate(`/billing/create/${bill.client_id}?edit=${encodedBillNumber}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 w-full ml-0 overflow-y-auto pt-14 sm:pt-0 lg:ml-64 h-[100dvh]">
        <div className="flex flex-col gap-3 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

          {/* Header */}
          <div className="hidden sm:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("billBook")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("manageViewBills")}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/payments')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                {t("payments")}
              </button>

              <button
                onClick={() => loadBills(true)}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchBills') || "Search bills..."}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative sort-menu-container sm:w-48">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="w-full flex items-center justify-between px-2 sm:px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                title={t('sortBy')}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 truncate hidden sm:block">
                    {getSortLabel(sortOption)}
                  </span>
                </div>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 z-10 w-48 sm:w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 py-1">
                  {(['dateNewOld', 'dateOldNew', 'amountHighLow', 'amountLowHigh'] as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortOption(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2
                        ${sortOption === option ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {getSortLabel(option)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-500 px-1">
            <span className="hidden sm:inline">{t('showing')} {filteredAndSortedBills.length} {t('bills')}</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 font-medium hover:underline"
              >
                {t('clearSearch')}
              </button>
            )}
          </div>

          {/* Content */}
          {loading && !refreshing ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl h-48 animate-pulse" />
              ))}
            </div>
          ) : filteredAndSortedBills.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('noBillsFound')}</h3>
              <p className="text-gray-500">
                {searchQuery ? t('tryAdjustingSearch') : t('noBillsCreated')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-20">
              {filteredAndSortedBills.map((bill, index) => (
                <BillCard
                  key={bill.bill_number || `bill-${index}`}
                  bill={bill}
                  t={t}
                  onView={handleViewBill}
                  onDownload={handleDownloadBill}
                  onDelete={handleDeleteBill}
                  onEdit={handleEditBill}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Toaster />

      {/* Loading Overlay */}
      {loadingDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-900 font-medium">{t("loadingDetails")}</p>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900 truncate pr-2">
                {t("viewBill")}: {selectedBill.billDetails.billNumber}
              </h3>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={async () => {
                    const toastId = toast.loading(t("loadingDetails"));
                    try {
                      await generateBillJPEG(selectedBill.billDetails.billNumber, selectedBill);
                      toast.success(t("challanDownloadSuccess"), { id: toastId });
                    } catch {
                      toast.error(t("challanDownloadError"), { id: toastId });
                    }
                  }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm font-medium hidden sm:inline">{t("download")}</span>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-100">
              <div className="overflow-x-auto">
                <div className="min-w-[794px] bg-white shadow-sm sm:shadow-none mx-auto">
                  <BillInvoiceTemplate {...selectedBill} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}