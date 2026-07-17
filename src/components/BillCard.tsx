import React from "react";
import { FileText, User, MapPin, Pencil, Eye, Download, Trash2 } from "lucide-react";
import { formatLocalDate } from "../utils/dateUtils";

export interface BillRecord {
    id?: string;
    client_id: string;
    bill_number: string;
    billdate?: string; // Correct column name in DB
    billing_date?: string; // Legacy/Alias support
    bill_date?: string; // Legacy/Alias support
    created_at: string;
    total_amount?: number;
    grand_total?: number;
    total_payment?: number;
    due_payment?: number;
    total_rent_amount?: number;
    total_extra_cost?: number;
    total_discount?: number;
    from_date?: string;
    to_date?: string;
    daily_rent?: number;
    status: string;
    client: {
        client_name: string;
        client_nic_name: string;
        site: string;
        primary_phone_number?: string;
    };
}

export interface BillCardProps {
    bill: BillRecord;
    t: any;
    onView: (bill: BillRecord) => void;
    onDownload: (bill: BillRecord) => void;
    onDelete: (bill: BillRecord) => void;
    onEdit: (bill: BillRecord) => void;
    onShare: (bill: BillRecord) => void;
}

const BillCard: React.FC<BillCardProps> = ({ bill, t, onView, onDownload, onDelete, onEdit, onShare }) => {
    const amount = bill.grand_total || bill.total_amount || 0;
    // Fallback chain for date
    const date = bill.billdate || bill.billing_date || bill.bill_date || bill.created_at;

    return (
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">
                                #{bill.bill_number}
                            </h4>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${bill.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {bill.status || 'Generated'}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        {amount > 0 && (
                            <div className="text-base font-bold text-blue-600">
                                ₹{amount.toLocaleString("en-IN")}
                            </div>
                        )}
                        {(bill.due_payment || 0) > 0 && (
                            <div className="text-xs font-bold text-red-600">
                                {t('due') || 'Due'}: ₹{(bill.due_payment || 0).toLocaleString("en-IN")}
                            </div>
                        )}
                        <div className="text-[10px] text-gray-500">
                            {date ? formatLocalDate(date, "dd MMM yy") : t('noDate')}
                        </div>
                    </div>
                </div>

                <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{bill.client?.client_nic_name || t('unknownClient')}</span>
                        <span className="text-gray-300">|</span>
                        <span className="truncate">{bill.client?.client_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{bill.client?.site || 'No Site'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <button
                        onClick={() => onEdit(bill)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        {t('edit')}
                    </button>
                    <button
                        onClick={() => onView(bill)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        {t('view')}
                    </button>
                    <button
                        onClick={() => onDownload(bill)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {t('download')}
                    </button>
                    <button
                        onClick={() => onShare(bill)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                        title="Share on WhatsApp"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.536 0 10.038-4.502 10.04-10.04.002-2.684-1.038-5.207-2.93-7.101C16.43 1.57 13.918.531 11.238.531 5.707.531 1.206 5.033 1.204 10.564c-.001 1.507.412 2.977 1.196 4.275L1.44 20.248l5.207-1.365-.001.271z" />
                        </svg>
                        {t('share')}
                    </button>
                    <button
                        onClick={() => onDelete(bill)}
                        className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Delete Bill"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillCard;
