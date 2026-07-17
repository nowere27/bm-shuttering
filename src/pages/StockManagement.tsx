import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../utils/supabase";
import { PlateSize } from "../components/ItemsTable";
import { usePlateSizes } from "../hooks/usePlateSizes";
import {
  Package,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingDown,
  ArrowUpDown,
  Plus,
  Minus,
  Users,
  X,
  Loader2,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  GripVertical,
} from "lucide-react";
import { fetchUdharChallansForClient, fetchJamaChallansForClient } from "../utils/challanFetching";
import Navbar from "../components/Navbar";
import toast, { Toaster } from "react-hot-toast";

interface StockData {
  size: number;
  plate_size?: PlateSize;
  total_stock: number;
  on_rent_stock: number;
  borrowed_stock: number;
  lost_stock: number;
  available_stock: number;
  updated_at: string;
}

type SortField =
  | "size"
  | "total_stock"
  | "available_stock"
  | "on_rent_stock"
  | "borrowed_stock"
  | "lost_stock";
type SortOrder = "asc" | "desc";

const StockManagement: React.FC = () => {
  const { sizes: plateSizes, addSize: addNewSize, updateSizesOrder, deleteSize } = usePlateSizes();
  const [newSizeName, setNewSizeName] = useState('');
  const [isAddingSize, setIsAddingSize] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [tempSizes, setTempSizes] = useState<PlateSize[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'shuttering' | 'jack' | 'cuplock' | 'other'>('shuttering');
  const [newSizeCategory, setNewSizeCategory] = useState<'shuttering' | 'jack' | 'cuplock' | 'other'>('shuttering');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const nextSizes = [...tempSizes];
    const item = nextSizes[draggedIndex];
    nextSizes.splice(draggedIndex, 1);
    nextSizes.splice(index, 0, item);
    setDraggedIndex(index);
    setTempSizes(nextSizes);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDeleteSize = async (sizeId: number, sizeName: string) => {
    const calculated = calculatedStocks.get(sizeId) || { rent: 0, borrowed: 0 };
    if (calculated.rent > 0 || calculated.borrowed > 0) {
      toast.error('આ સાઈઝના પ્લેટો ભાડા પર અથવા ઉધાર આપેલ છે. તેથી તે ડીલીટ કરી શકાશે નહિ.');
      return;
    }

    const confirmed = window.confirm(`નક્કી સાઈઝ "${sizeName}" ને કાયમ માટે ડીલીટ કરવી છે?`);
    if (!confirmed) return;

    const loadingToast = toast.loading('સાઈઝ ડીલીટ થઈ રહી છે...');
    try {
      if (deleteSize) {
        await deleteSize(sizeId);
        toast.success('સાઈઝ સફળતાપૂર્વક ડીલીટ થઈ ગઈ!');
        setTempSizes(prev => prev.filter(s => s.id !== sizeId));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  useEffect(() => {
    if (isReordering) {
      setTempSizes([...plateSizes]);
    }
  }, [isReordering, plateSizes]);

  const handleAddSize = async () => {
    if (!newSizeName.trim()) return;
    try {
      await addNewSize(newSizeName.trim(), newSizeCategory);
      setNewSizeName('');
      setNewSizeCategory('shuttering');
      setIsAddingSize(false);
      fetchStock();
    } catch (err: any) {
      toast.error("Error adding size: " + err.message);
    }
  };

  const moveSize = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= tempSizes.length) return;
    const updated = [...tempSizes];
    const [removed] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, removed);
    setTempSizes(updated);
  };

  const handleStartEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleFinishEdit = (index: number) => {
    if (!editName.trim()) return;
    setTempSizes(prev => {
      const next = [...prev];
      next[index] = { ...next[index], name: editName.trim() };
      return next;
    });
    setEditingId(null);
  };

  const handleSaveOrder = async () => {
    const loadingToast = toast.loading('સાઈઝ ક્રમ અપડેટ કરી રહ્યાં છીએ...');
    try {
      if (updateSizesOrder) {
        await updateSizesOrder(tempSizes);
        toast.success('સાઈઝ ક્રમ અપડેટ થઈ ગયો!');
        setIsReordering(false);
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('ક્રમ અપડેટ કરવામાં ભુલ આવી: ' + err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleAddMissingSize = async (sizeId: number) => {
    try {
      const { error } = await supabase
        .from('stock')
        .insert([{ size: sizeId, total_stock: 0, on_rent_stock: 0, borrowed_stock: 0, lost_stock: 0 }]);
      if (error) throw error;
      toast.success("Size added to stock successfully");
      fetchStock();
    } catch (err: any) {
      toast.error("Error adding size to stock: " + err.message);
    }
  };
  const { t } = useLanguage();
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("size");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [distributionModal, setDistributionModal] = useState<{
    isOpen: boolean;
    size: number | null;
    type: "rent" | "borrowed" | null;
    loading: boolean;
    data: {
      clientName: string;
      clientFullName?: string;
      quantity: number;
      site: string;
      notes?: string[];
    }[];
  }>({
    isOpen: false,
    size: null,
    type: null,
    loading: false,
    data: [],
  });


  const [calculatedStocks, setCalculatedStocks] = useState<Map<number, { rent: number; borrowed: number }>>(new Map());

  useEffect(() => {
    fetchStock();
    fetchCalculatedStocks();
  }, []);

  const fetchCalculatedStocks = async () => {
    try {
      const [allUdhar, allJama] = await Promise.all([
        fetchUdharChallansForClient(),
        fetchJamaChallansForClient(),
      ]);

      const calculations = new Map<number, { rent: number; borrowed: number }>();

      // Initialize for all sizes
      for (const ps of plateSizes) {
        calculations.set(ps.id, { rent: 0, borrowed: 0 });
      }

      // Process Udhar (Outgoing)
      allUdhar.forEach(challan => {
        for (const ps of plateSizes) {
          const itemData = challan.items.items?.[ps.id] || { qty: 0, borrowed: 0 };
          const qty = itemData.qty;
          const borrowed = itemData.borrowed;
          const i = ps.id;

          const current = calculations.get(i) || { rent: 0, borrowed: 0 };
          calculations.set(i, {
            rent: current.rent + qty,
            borrowed: current.borrowed + borrowed
          });
        }
      });

      // Process Jama (Incoming)
      allJama.forEach(challan => {
        for (const ps of plateSizes) {
          const itemData = challan.items.items?.[ps.id] || { qty: 0, borrowed: 0 };
          const qty = itemData.qty;
          const borrowed = itemData.borrowed;
          const i = ps.id;

          const current = calculations.get(i) || { rent: 0, borrowed: 0 };
          calculations.set(i, {
            rent: current.rent - qty,
            borrowed: current.borrowed - borrowed
          });
        }
      });

      setCalculatedStocks(calculations);
    } catch (error) {
      console.error("Error calculating stocks:", error);
    }
  };

  const fetchStock = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("stock")
      .select("*")
      .order("size");

    if (error) {
      console.error("Error fetching stock:", error);
      toast.error(t("failedToRefresh"));
    } else {
      setStocks(data || []);
      if (showRefreshToast) {
        toast.success(t("stockRefreshed"));
        fetchCalculatedStocks();
      }
    }

    setLoading(false);
    setRefreshing(false);
  };

  // State for bulk stock update
  const [bulkAction, setBulkAction] = useState<{
    isOpen: boolean;
    type: "add" | "remove";
    quantities: { [key: number]: number };
    partyName: string;
    note: string;
    amount: string;
    date: string;
  }>({
    isOpen: false,
    type: "add",
    quantities: {},
    partyName: "",
    note: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleActionClick = (type: "add" | "remove") => {
    setBulkAction({
      isOpen: true,
      type,
      quantities: {},
      partyName: "",
      note: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleQuantityChange = (size: number, value: string) => {
    const qty = parseInt(value) || 0;
    setBulkAction((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [size]: qty,
      },
    }));
  };

  const handleBulkSubmit = async () => {
    const { type, quantities, partyName, note, amount, date } = bulkAction;

    // Validation
    const hasQuantities = Object.values(quantities).some((q) => q > 0);
    if (!hasQuantities) {
      toast.error(t("enterQuantity") || "Please enter at least one quantity");
      return;
    }

    if (!partyName.trim()) {
      toast.error("Please enter Party Name or Reason");
      return;
    }

    const loadingToast = toast.loading(t("updatingStock"));

    try {
      // 1. Log to stock_history
      const { error: historyError } = await supabase
        .from("stock_history")
        .insert({
          type,
          party_name: partyName,
          note: note,
          amount: parseFloat(amount) || 0,
          items: quantities,
          date: new Date(date).toISOString(),
        });

      if (historyError) throw historyError;

      // 2. Update stock items
      const updates = Object.entries(quantities).map(async ([sizeStr, qty]) => {
        if (qty <= 0) return;
        const size = parseInt(sizeStr);

        // Fetch current stock
        const { data: currentStock, error: fetchError } = await supabase
          .from("stock")
          .select("total_stock")
          .eq("size", size)
          .single();

        if (fetchError) throw fetchError;

        const currentTotal = currentStock.total_stock;
        const newTotal = type === "add" ? currentTotal + qty : Math.max(0, currentTotal - qty);

        const { error: updateError } = await supabase
          .from("stock")
          .update({ total_stock: newTotal })
          .eq("size", size);

        if (updateError) throw updateError;
      });

      await Promise.all(updates);

      toast.success(t("stockUpdated"));
      setBulkAction((prev) => ({ ...prev, isOpen: false }));
      fetchStock();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error(t("failedToUpdate"));
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // ... (keeping existing distribution modal logic)

  // ... (keeping existing sort logic)

  // ... (keeping existing render helpers)


  const fetchDistribution = async (size: number, type: "rent" | "borrowed") => {
    setDistributionModal({
      ...distributionModal,
      isOpen: true,
      size,
      type,
      loading: true,
      data: [],
    });

    try {
      const [allUdhar, allJama] = await Promise.all([
        fetchUdharChallansForClient(),
        fetchJamaChallansForClient(),
      ]);

      const clientMap = new Map<
        string,
        {
          clientName: string;
          clientFullName?: string;
          quantity: number;
          site: string;
          notes: string[];
        }
      >();

      const processItems = (items: any, multiplier: number, client: any) => {
        const qtyKey = `size_${size}_qty`;
        const borrowedKey = `size_${size}_borrowed`;
        const noteKey = `size_${size}_note`;

        let qty = 0;
        let note = "";

        if (type === "rent") {
          qty = (items as any)[qtyKey] || 0;
        } else {
          qty = (items as any)[borrowedKey] || 0;
          note = (items as any)[noteKey] || "";
        }

        const amount = qty * multiplier;

        if (amount !== 0) {
          const current = clientMap.get(client.clientId) || {
            clientName: client.clientNicName || client.clientFullName,
            clientFullName: client.clientFullName,
            quantity: 0,
            site: client.site,
            notes: [] as string[],
          };

          current.quantity += amount;

          // Only add notes for Udhar (borrowing side) for borrowed items
          if (type === "borrowed" && note && multiplier === 1) {
            current.notes.push(note);
          }

          clientMap.set(client.clientId, current);
        }
      };

      allUdhar.forEach((challan: any) => {
        processItems(challan.items, 1, challan);
      });

      allJama.forEach((challan: any) => {
        processItems(challan.items, -1, challan);
      });

      const data = Array.from(clientMap.values())
        .filter((item) => item.quantity !== 0)
        .sort((a, b) => b.quantity - a.quantity);

      setDistributionModal((prev) => ({
        ...prev,
        loading: false,
        data,
      }));
    } catch (error) {
      console.error("Error fetching distribution:", error);
      toast.error("Failed to load distribution data");
      setDistributionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getAvailabilityBadge = (available: number) => {
    if (available === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">{t("outOfStock")}</span>
          <span className="sm:hidden">0</span>
        </span>
      );
    }
    if (available < 10) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
          <TrendingDown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">
            {t("lowStock")} ({available})
          </span>
          <span className="sm:hidden">{available}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">
          {t("inStock")} ({available})
        </span>
        <span className="sm:hidden">{available}</span>
      </span>
    );
  };

  const filteredAndSortedStocks = useMemo(() => {
    return [...stocks]
      .filter(stock => {
        const cat = plateSizes.find(p => p.id === stock.size)?.category || 'shuttering';
        return cat === selectedCategory;
      })
      .sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (sortField === "available_stock" || sortField === "on_rent_stock" || sortField === "borrowed_stock") {
          const calcA = calculatedStocks.get(a.size) || { rent: 0, borrowed: 0 };
          const calcB = calculatedStocks.get(b.size) || { rent: 0, borrowed: 0 };
          
          if (sortField === "on_rent_stock") {
            aVal = calcA.rent;
            bVal = calcB.rent;
          } else if (sortField === "borrowed_stock") {
            aVal = calcA.borrowed;
            bVal = calcB.borrowed;
          } else if (sortField === "available_stock") {
            aVal = Math.max(0, a.total_stock - calcA.rent - a.lost_stock);
            bVal = Math.max(0, b.total_stock - calcB.rent - b.lost_stock);
          }
        }

        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
  }, [stocks, sortField, sortOrder, plateSizes, selectedCategory, calculatedStocks]);



  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="w-12 h-4 mx-auto bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-4 mx-auto bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-24 h-6 mx-auto bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-12 h-4 mx-auto bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-12 h-4 mx-auto bg-gray-200 rounded"></div>
      </td>
    </tr>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
            fontSize: "13px",
            padding: "10px 14px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Navbar />
      <main className="flex-1 w-full ml-0 overflow-auto pt-14 pb-20 sm:pt-0 sm:pb-0 lg:ml-64">
        <div className="w-full h-full px-3 py-3 pb-20 mx-auto sm:px-4 sm:py-5 lg:px-8 lg:py-12 lg:pb-12 max-w-7xl">
          {/* Header - Desktop Only */}
          <div className="items-center justify-between hidden mb-6 lg:flex lg:mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                {t("stockManagement")}
              </h2>
              <p className="mt-1 text-xs text-gray-600">{t("stockOverview")}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleActionClick("add")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t("addStock")}
              </button>
              <button
                onClick={() => setIsAddingSize(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('newSize')}
              </button>
              <button
                onClick={() => setIsReordering(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <ArrowUpDown className="w-4 h-4" />
                {t('reorderSizesButton')}
              </button>
              <button
                onClick={() => handleActionClick("remove")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <Minus className="w-4 h-4" />
                {t("removeStock")}
              </button>
              <Link
                to="/stock-history"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                {t("stockHistory")}
              </Link>
              <button
                onClick={() => fetchStock(true)}
                disabled={refreshing}
                title={t("refreshStock")}
                className="p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 touch-manipulation active:scale-95"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Summary Cards */}


          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Table Header with Controls */}
            <div className="p-3 border-b border-gray-200 sm:p-4 lg:p-6 flex items-center justify-between">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSelectedCategory('shuttering')}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                    selectedCategory === 'shuttering'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t('shuttering')}
                </button>
                <button
                  onClick={() => setSelectedCategory('jack')}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                    selectedCategory === 'jack'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t('jack')}
                </button>
                <button
                  onClick={() => setSelectedCategory('cuplock')}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                    selectedCategory === 'cuplock'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  કપલોક (Cuplock)
                </button>
                <button
                  onClick={() => setSelectedCategory('other')}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                    selectedCategory === 'other'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t('other')}
                </button>
              </div>
              <div className="flex items-center justify-end"></div>
            </div>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort("size")}
                      className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase transition-colors cursor-pointer hover:bg-gray-100 group border-r border-gray-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t("size")}
                        <ArrowUpDown
                          size={14}
                          className="transition-opacity opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("total_stock")}
                      className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase transition-colors cursor-pointer hover:bg-gray-100 group border-r border-gray-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t("total_stock")}
                        <ArrowUpDown
                          size={14}
                          className="transition-opacity opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("available_stock")}
                      className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase transition-colors cursor-pointer hover:bg-gray-100 group border-r border-gray-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t("available_stock")}
                        <ArrowUpDown
                          size={14}
                          className="transition-opacity opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("on_rent_stock")}
                      className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase transition-colors cursor-pointer hover:bg-gray-100 group border-r border-gray-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t("on_rent_stock")}
                        <ArrowUpDown
                          size={14}
                          className="transition-opacity opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("borrowed_stock")}
                      className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase transition-colors cursor-pointer hover:bg-gray-100 group"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t("borrowed_stock")}
                        <ArrowUpDown
                          size={14}
                          className="transition-opacity opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : filteredAndSortedStocks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package size={48} className="text-gray-300" />
                          <p className="font-medium text-gray-500">
                            {t("outOfStock")}
                          </p>
                          <p className="text-sm text-gray-400">
                            {t("stockOverview")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedStocks.map((stock, index) => {
                      const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                      const rentStock = calculated.rent;
                      const borrowedStock = calculated.borrowed;
                      const availableStock = Math.max(0, stock.total_stock - rentStock - stock.lost_stock);

                      return (
                        <tr
                          key={stock.size}
                          className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                        >
                          <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-100 font-bold text-gray-900">
                            {(plateSizes.find(p => p.id === stock.size)?.name || `Size ${stock.size}`)}
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap border-r border-gray-100">
                            <span className="font-semibold">
                              {stock.total_stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-100">
                            {getAvailabilityBadge(availableStock)}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-100">
                            <button
                              onClick={() => fetchDistribution(stock.size, "rent")}
                              className="text-orange-600 hover:underline font-bold text-sm focus:outline-none"
                            >
                              {rentStock}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => fetchDistribution(stock.size, "borrowed")}
                              className="text-purple-600 hover:underline font-bold text-sm focus:outline-none"
                            >
                              {borrowedStock}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {!loading && filteredAndSortedStocks.length > 0 && (
                    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                      <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-200">
                        {t("total") || "Total"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-200">
                        {filteredAndSortedStocks.reduce(
                          (sum, stock) => sum + stock.total_stock,
                          0
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-green-700 border-r border-gray-200">
                        {filteredAndSortedStocks.reduce((sum, stock) => {
                          const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                          const available = Math.max(0, stock.total_stock - calculated.rent - stock.lost_stock);
                          return sum + available;
                        }, 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-orange-600 border-r border-gray-200">
                        {filteredAndSortedStocks.reduce((sum, stock) => {
                          const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                          return sum + calculated.rent;
                        }, 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-purple-600">
                        {filteredAndSortedStocks.reduce((sum, stock) => {
                          const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                          return sum + calculated.borrowed;
                        }, 0)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          {/* Mobile/Tablet Table - Horizontal Scroll */}
          <div className="overflow-x-auto lg:hidden">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="sticky left-0 z-10 px-1 py-1.5 text-xs font-bold text-center text-gray-700 bg-gray-100 border-r-2 border-gray-300 w-12 sm:px-2 sm:text-xs">
                    {t("size")}
                  </th>
                  <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[80px]">
                    {t("total_stock")}
                  </th>
                  <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[70px] sm:min-w-[90px]">
                    {t("available_stock")}
                  </th>
                  <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[80px]">
                    {t("on_rent_stock")}
                  </th>
                  <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[80px]">
                    {t("borrowed_stock")}
                  </th>
                  {/* Lost Stock Column - Commented out
                          <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[80px]">
                            {t('lost_stock')}
                          </th>
                          */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="sticky left-0 z-10 px-2 py-2 bg-white border-r-2 border-gray-300 sm:px-3">
                          <div className="w-8 h-4 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-2 py-2 border-r border-gray-200">
                          <div className="w-12 h-4 mx-auto bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-2 py-2 border-r border-gray-200">
                          <div className="w-16 h-6 mx-auto bg-gray-200 rounded-full"></div>
                        </td>
                        <td className="px-2 py-2 border-r border-gray-200">
                          <div className="w-12 h-4 mx-auto bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="w-12 h-4 mx-auto bg-gray-200 rounded"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredAndSortedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-8 text-center">
                      <Package
                        size={32}
                        className="mx-auto mb-2 text-gray-300"
                      />
                      <p className="text-xs font-medium text-gray-500">
                        {t("noStockFound")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStocks.map((stock, index) => {
                    const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                    const rentStock = calculated.rent;
                    const borrowedStock = calculated.borrowed;
                    const availableStock = Math.max(0, stock.total_stock - rentStock - stock.lost_stock);

                    return (
                      <tr
                        key={stock.size}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="sticky left-0 z-10 px-1 py-1.5 text-xs font-bold text-center text-gray-900 border-r-2 border-gray-300 sm:px-2 sm:text-base bg-inherit">
                          {(plateSizes.find(p => p.id === stock.size)?.name || `Size ${stock.size}`)}
                        </td>
                        <td className="px-1 py-1.5 text-center border-r border-gray-200">
                          <span className="text-xs font-semibold sm:text-sm">
                            {stock.total_stock}
                          </span>
                        </td>
                        <td className="px-1 py-1.5 text-center border-r border-gray-200">
                          {getAvailabilityBadge(availableStock)}
                        </td>
                        <td className="px-1 py-1.5 text-center border-r border-gray-200">
                          <button
                            onClick={() => fetchDistribution(stock.size, "rent")}
                            className="text-orange-600 hover:underline font-bold text-xs sm:text-sm focus:outline-none"
                          >
                            {rentStock}
                          </button>
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <button
                            onClick={() => fetchDistribution(stock.size, "borrowed")}
                            className="text-purple-600 hover:underline font-bold text-xs sm:text-sm focus:outline-none"
                          >
                            {borrowedStock}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {!loading && filteredAndSortedStocks.length > 0 && (
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="sticky left-0 z-10 px-1 py-2 text-xs font-bold text-center text-gray-900 border-r-2 border-gray-300 sm:px-2 sm:text-base bg-gray-100">
                      {t("total") || "Total"}
                    </td>
                    <td className="px-1 py-2 text-center border-r border-gray-200">
                      <span className="text-xs font-bold sm:text-sm">
                        {filteredAndSortedStocks.reduce(
                          (sum, stock) => sum + stock.total_stock,
                          0
                        )}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center border-r border-gray-200">
                      <span className="text-xs font-bold sm:text-sm text-green-700">
                        {filteredAndSortedStocks.reduce((sum, stock) => {
                          const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                          const available = Math.max(0, stock.total_stock - calculated.rent - stock.lost_stock);
                          return sum + available;
                        }, 0)}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center border-r border-gray-200">
                      <span className="text-xs font-bold sm:text-sm text-orange-600">
                        {filteredAndSortedStocks.reduce((sum, stock) => {
                          const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                          return sum + calculated.rent;
                        }, 0)}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center">
                      <span className="text-xs font-bold sm:text-sm text-purple-600">
                        {filteredAndSortedStocks.reduce((sum, stock) => {
                          const calculated = calculatedStocks.get(stock.size) || { rent: 0, borrowed: 0 };
                          return sum + calculated.borrowed;
                        }, 0)}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          {stocks.length > 0 && !loading && (
            <div className="px-3 py-3 border-t border-gray-200 sm:px-4 sm:py-4 lg:px-6 bg-gray-50">
              {/* Legend Container */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></div>
                    <span className="text-xs text-orange-600">ભાડે ગયેલા નંગ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                    <span className="text-xs text-purple-600">
                      બીજા ડેપો ના નંગ
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span className="text-xs text-green-600">ઉપલબ્ધ સ્ટોક</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-2 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-40 flex gap-2">
        <button
          onClick={() => handleActionClick("add")}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-green-600 rounded-xl shadow-md hover:bg-green-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t("addStock")}
        </button>
        <button
          onClick={() => setIsAddingSize(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          નવી સાઈઝ
        </button>
        <button
          onClick={() => handleActionClick("remove")}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-red-600 rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition-all"
        >
          <Minus className="w-4 h-4" />
          {t("removeStock")}
        </button>
        <Link
          to="/stock-history"
          className="inline-flex items-center justify-center p-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all"
        >
          <BookOpen className="w-5 h-5" />
        </Link>
        <button
          onClick={() => fetchStock(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center p-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Action Modal (Bulk Update) */}
      {bulkAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className={`text-lg font-bold ${bulkAction.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                {bulkAction.type === "add" ? t("addStock") : t("removeStock")}
              </h3>
              <button
                onClick={() => setBulkAction((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Details Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("date")}
                  </label>
                  <input
                    type="date"
                    value={bulkAction.date}
                    onChange={(e) => setBulkAction(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("partyOrReason")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bulkAction.partyName}
                    onChange={(e) => setBulkAction(prev => ({ ...prev, partyName: e.target.value }))}
                    placeholder="e.g. New Purchase or Damaged"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("noteOptional")}
                  </label>
                  <textarea
                    value={bulkAction.note}
                    onChange={(e) => setBulkAction(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Any additional details..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("totalAmountOptional")}
                  </label>
                  <input
                    type="number"
                    value={bulkAction.amount}
                    onChange={(e) => setBulkAction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* Sizes Grid */}
              <h4 className="text-sm font-bold text-gray-800 mb-2">{t("sizesQuantities")}</h4>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                {plateSizes.map((ps) => {
                  const sizeStr = ps.name;
                  const index = ps.id;
                  const exists = stocks.some(s => s.size === index);
                  if (!exists) {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAddMissingSize(index)}
                        className="w-full px-4 py-2 bg-yellow-50 border border-yellow-250 rounded-xl hover:bg-yellow-100 transition-all font-semibold text-xs text-yellow-800 flex items-center justify-between group"
                      >
                        <span>નવી સાઈઝ {sizeStr} સ્ટોકમાં સેટઅપ કરો (Setup Size {sizeStr})</span>
                        <Plus className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                      </button>
                    );
                  }
                  return (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-150">
                      <span className="font-bold text-gray-800 text-sm">{sizeStr}</span>
                      <input
                        type="number"
                        min="0"
                        value={bulkAction.quantities[index] || ""}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        placeholder="0"
                        className="w-24 px-3 py-1.5 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-semibold"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button
                  onClick={handleBulkSubmit}
                  className={`w-full py-2.5 px-4 text-sm font-bold text-white rounded-lg shadow-md transition-all active:scale-[0.98] ${bulkAction.type === 'add'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-200'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200'
                    }`}
                >
                  {bulkAction.type === 'add' ? t("confirmAddStock") : t("confirmRemoveStock")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Distribution Modal */}
      {distributionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {distributionModal.type === "borrowed"
                    ? t("borrowed_stock")
                    : t("on_rent_stock")}{" "}
                  ગ્રાહક પ્રમાણે
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <p>પ્લેટ: {(plateSizes.find(p => p.id === distributionModal.size!)?.name || `Size ${distributionModal.size!}`)}</p>
                  <span>•</span>
                  <p className="font-semibold text-gray-900">
                    કુલ: {distributionModal.data.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setDistributionModal({ ...distributionModal, isOpen: false })
                }
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar">
              {distributionModal.loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-8 h-8 mb-2 animate-spin text-blue-500" />
                  <p className="text-sm">{t("loadingDistribution")}</p>
                </div>
              ) : distributionModal.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Users className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm font-medium">{t("noActiveRentals")}</p>
                  <p className="text-xs text-gray-400">
                    {t("noClientsHaveThisSize")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {distributionModal.data.map((client, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {client.clientName}
                          </p>
                          {client.clientFullName && client.clientFullName !== client.clientName && (
                            <p className="text-[11px] text-gray-500 truncate max-w-[180px]">
                              {client.clientFullName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {client.site}
                          </p>
                          {client.notes && client.notes.length > 0 && (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {client.notes.map((note, idx) => (
                                <p
                                  key={idx}
                                  className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded w-fit"
                                >
                                  {note}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg">
                        {client.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
              ગ્રાહકોની સંખ્યા: {distributionModal.data.length}
            </div>
          </div>
        </div>
      )}

      {/* Add New Size Modal */}
      {isAddingSize && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {t('createNewSize')}
              </h3>
              <button
                onClick={() => setIsAddingSize(false)}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('sizeName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  placeholder="e.g. 10x2 or 11"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="newSizeCategory"
                      value="shuttering"
                      checked={newSizeCategory === 'shuttering'}
                      onChange={() => setNewSizeCategory('shuttering')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {t('shuttering')}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="newSizeCategory"
                      value="jack"
                      checked={newSizeCategory === 'jack'}
                      onChange={() => setNewSizeCategory('jack')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {t('jack')}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="newSizeCategory"
                      value="cuplock"
                      checked={newSizeCategory === 'cuplock'}
                      onChange={() => setNewSizeCategory('cuplock')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    કપલોક (Cuplock)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="newSizeCategory"
                      value="other"
                      checked={newSizeCategory === 'other'}
                      onChange={() => setNewSizeCategory('other')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {t('other')}
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleAddSize}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  {t('confirmAddSize')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Sizes Modal */}
      {isReordering && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {t('reorderSizesTitle')}
              </h3>
              <button
                onClick={() => setIsReordering(false)}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-500">
                સાઈઝનો જે ક્રમ અહીં રાખશો, તે જ ક્રમ આખા એપ્લીકેશનમાં (ચલણ બુક, સ્ટોક લિસ્ટ, વગેરે) બતાવશે.
              </p>
              
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {tempSizes.map((size, index) => (
                  <div 
                    key={size.id} 
                    draggable={editingId !== size.id}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                      draggedIndex === index
                        ? "border-dashed border-2 border-indigo-400 bg-indigo-50/50 opacity-60"
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100/70"
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-2 mr-2 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      {editingId === size.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleFinishEdit(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishEdit(index);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="px-2 py-1 text-sm border border-blue-500 rounded outline-none w-24 focus:ring-1 focus:ring-blue-500 bg-white flex-shrink-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          onClick={() => handleStartEdit(size.id, size.name)}
                          className="flex items-center gap-1 cursor-pointer group hover:text-blue-600 truncate min-w-[70px]"
                          title="Click to rename"
                        >
                          <span className="font-bold text-gray-800 group-hover:underline truncate">{size.name}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      )}

                      <select
                        value={size.category || 'shuttering'}
                        onChange={(e) => {
                          const newCategory = e.target.value as 'shuttering' | 'jack' | 'cuplock' | 'other';
                          setTempSizes(prev => prev.map((s, i) => i === index ? { ...s, category: newCategory } : s));
                        }}
                        className="px-1.5 py-0.5 text-[11px] font-medium border border-gray-300 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-gray-700 flex-shrink-0 ml-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="shuttering">Shuttering</option>
                        <option value="jack">Jack</option>
                        <option value="cuplock">Cuplock</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveSize(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => moveSize(index, 'down')}
                        disabled={index === tempSizes.length - 1}
                        className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSize(size.id, size.name)}
                        className="p-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors ml-1"
                        title="ડીલીટ સાઈઝ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setIsReordering(false)}
                  className="flex-1 py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  {t('cancelText')}
                </button>
                <button
                  onClick={handleSaveOrder}
                  className="flex-1 py-2 px-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                >
                  {t('saveText')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;

