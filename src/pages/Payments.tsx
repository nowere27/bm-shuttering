import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Download, X, ArrowUpRight, TrendingUp } from 'lucide-react';
import { supabase } from '../utils/supabase';
import Navbar from '../components/Navbar';
import BillCard, { BillRecord } from '../components/BillCard';
import { useLanguage } from '../contexts/LanguageContext';
import { generateBillJPEG } from '../utils/generateBillJPEG';
import BillInvoiceTemplate from '../components/BillInvoiceTemplate';
import toast, { Toaster } from 'react-hot-toast';
import * as periodCalculations from "../utils/billingPeriodCalculations";
import { subDays, parseISO } from "date-fns";

type Tab = 'pending' | 'cleared';

export default function Payments() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [bills, setBills] = useState<BillRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        collected: 0
    });

    // View/Download State (Copied from BillBook logic)
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const downloadTemplateRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch ALL bills to calculate totals and filter locally
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

            const allBills = data || [];

            // Calculate totals
            const totalPending = allBills.reduce((sum, bill) => sum + (bill.due_payment || 0), 0);
            const totalCollected = allBills.reduce((sum, bill) => sum + (bill.total_payment || 0), 0);

            setStats({
                pending: totalPending,
                collected: totalCollected
            });

            setBills(allBills);
        } catch (error) {
            console.error("Error loading bills:", error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredBills = bills.filter(bill => {
        if (activeTab === 'pending') return (bill.due_payment || 0) > 0;
        return (bill.due_payment || 0) <= 0;
    });

    // Handle bill actions (Reusing logic from BillBook)
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

            // FETCH PREVIOUS BILL for Pending Amount Display
            let previousBillData = undefined;
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

            // Calculate derived totals
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
                previousBill: previousBillData,
                rentalCharges: result.billingPeriods.periods.map((p: any) => ({
                    size: "All",
                    startDate: p.startDate,
                    endDate: subDays(parseISO(p.endDate), 1).toISOString(),
                    pieces: p.plateCount,
                    days: p.days,
                    rate: bill.daily_rent || 1.5,
                    amount: p.rent,
                    causeType: p.causeType,
                    txnQty: (p.txnQty !== undefined && p.txnQty !== null) ? p.txnQty : 0
                })),
                extraCosts: (extraCosts || []).map((c: any) => ({
                    id: c.id, date: c.date, description: c.note, amount: c.total_amount || (c.pieces * c.price_per_piece), pieces: c.pieces, rate: c.price_per_piece
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
                    totalUdharPlates: 0, totalJamaPlates: 0, netPlates: 0, serviceCharge: 0, advancePaid: 0
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
        const details = await fetchBillDetails(bill);
        if (details) {
            setSelectedBill(details);
            setTimeout(() => {
                generateBillJPEG(bill.bill_number);
            }, 1000);
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
                loadData(); // Reload all data to update stats
            } catch (error) {
                console.error("Error deleting bill:", error);
                toast.error("Failed to delete bill");
            }
        }
    };

    const handleEditBill = (bill: BillRecord) => {
        const encodedBillNumber = encodeURIComponent(bill.bill_number);
        navigate(`/billing/create/${bill.client_id}?edit=${encodedBillNumber}`);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-1 w-full ml-0 overflow-y-auto pt-14 sm:pt-0 lg:ml-64 h-[100dvh]">
                <div className="flex flex-col gap-3 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/bill-book')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Back to Bill Book"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Payments Dashboard</h1>
                                <p className="text-sm text-gray-500 mt-1">Overview of pending and collected payments</p>
                            </div>
                        </div>
                    </div>

                    {/* New Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Total Pending Card */}
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`group relative overflow-hidden rounded-2xl p-6 text-white transition-all transform active:scale-[0.98]
                ${activeTab === 'pending'
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-xl ring-2 ring-offset-2 ring-red-500 scale-[1.01]'
                                    : 'bg-gradient-to-br from-red-400 to-red-500 shadow-md opacity-90 hover:opacity-100 hover:shadow-lg'
                                }`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-white rounded-full opacity-10 group-hover:scale-110 transition-transform"></div>
                            <div className="relative flex justify-between items-start">
                                <div>
                                    <p className="text-red-100 font-medium mb-1">Total Pending</p>
                                    <h3 className="text-3xl font-bold">₹{stats.pending.toLocaleString('en-IN')}</h3>
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-red-100">
                                <span>View outstanding bills</span>
                                <ArrowUpRight className={`ml-2 w-4 h-4 transition-transform ${activeTab === 'pending' ? 'rotate-45' : ''}`} />
                            </div>
                        </button>

                        {/* Total Collected Card */}
                        <button
                            onClick={() => setActiveTab('cleared')}
                            className={`group relative overflow-hidden rounded-2xl p-6 text-white transition-all transform active:scale-[0.98]
                ${activeTab === 'cleared'
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-xl ring-2 ring-offset-2 ring-green-500 scale-[1.01]'
                                    : 'bg-gradient-to-br from-green-400 to-green-500 shadow-md opacity-90 hover:opacity-100 hover:shadow-lg'
                                }`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-white rounded-full opacity-10 group-hover:scale-110 transition-transform"></div>
                            <div className="relative flex justify-between items-start">
                                <div>
                                    <p className="text-green-100 font-medium mb-1">Total Collected</p>
                                    <h3 className="text-3xl font-bold">₹{stats.collected.toLocaleString('en-IN')}</h3>
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-green-100">
                                <span>View corrected history</span>
                                <ArrowUpRight className={`ml-2 w-4 h-4 transition-transform ${activeTab === 'cleared' ? 'rotate-45' : ''}`} />
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-4 mb-2">
                        <h2 className={`text-lg font-bold ${activeTab === 'pending' ? 'text-red-600' : 'text-green-600'}`}>
                            {activeTab === 'pending' ? 'Pending Bills' : 'Cleared History'}
                        </h2>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm text-gray-500">
                            {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}
                        </span>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl h-48 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl border-dashed">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                {activeTab === 'pending' ? <Clock className="w-8 h-8 text-red-400" /> : <CheckCircle className="w-8 h-8 text-green-400" />}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                No {activeTab} payments found
                            </h3>
                            <p className="text-gray-500">
                                {activeTab === 'pending'
                                    ? 'Great job! All bills are paid.'
                                    : 'No payment history found yet.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-20">
                            {filteredBills.map((bill, index) => (
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
                        <p className="text-gray-900 font-medium">Loading details...</p>
                    </div>
                </div>
            )}

            {/* View Bill Modal */}
            {showModal && selectedBill && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900 truncate pr-2">
                                View Bill: {selectedBill.billDetails.billNumber}
                            </h3>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        setTimeout(() => {
                                            generateBillJPEG(selectedBill.billDetails.billNumber);
                                        }, 500);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="text-sm font-medium hidden sm:inline">Download</span>
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

            {/* Hidden Template for Download */}
            {selectedBill && (
                <div
                    id="invoice-template"
                    ref={downloadTemplateRef}
                    style={{
                        position: 'fixed',
                        top: '-9999px',
                        left: '-9999px',
                        width: '794px',
                        backgroundColor: 'white',
                        zIndex: -1
                    }}
                >
                    <BillInvoiceTemplate {...selectedBill} />
                </div>
            )}
        </div>
    );
}
