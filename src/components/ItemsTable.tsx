import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { usePlateSizes } from "../hooks/usePlateSizes";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface PlateSize {
  id: number;
  name: string;
  sort_order: number;
  category?: 'shuttering' | 'jack' | 'cuplock' | 'other';
}

export interface ItemDetail {
  size_id: number;
  qty: number;
  borrowed: number;
  note: string;
}

export interface ItemsData {
  items: {
    [key: number]: {
      qty: number;
      borrowed: number;
      note: string;
    };
  };
  main_note: string;
}




interface StockData {
  size: number;
  total_stock: number;
  on_rent_stock: number;
  borrowed_stock: number;
  lost_stock: number;
  available_stock: number;
  updated_at: string;
}

interface ItemsTableProps {
  plateSizes?: PlateSize[];
  items: ItemsData;
  onChange: (items: ItemsData) => void;
  outstandingBalances?: { [key: number]: number };
  borrowedOutstanding?: { [key: number]: number };
  hideColumns?: boolean;
  stockData?: StockData[];
  showAvailable?: boolean;
}

const ItemsTable: React.FC<ItemsTableProps> = ({
  plateSizes: propPlateSizes,
  items,
  onChange,
  outstandingBalances,
  borrowedOutstanding,
  hideColumns = false,
  stockData = [],
  showAvailable = false,
}) => {
  const { t } = useLanguage();
  const { sizes: hookPlateSizes } = usePlateSizes();
  const plateSizes = propPlateSizes || hookPlateSizes || [];

  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({
    shuttering: false,
    jack: false,
    cuplock: false,
    other: false,
  });

  // Find which category currently has items with qty > 0 or borrowed > 0
  const activeCategory = React.useMemo(() => {
    for (const ps of plateSizes) {
      const item = items.items[ps.id];
      if (item && ((item.qty || 0) > 0 || (item.borrowed || 0) > 0)) {
        return ps.category || 'shuttering';
      }
    }
    return null;
  }, [items, plateSizes]);

  React.useEffect(() => {
    if (outstandingBalances || borrowedOutstanding) {
      const categoriesWithOutstanding = new Set<string>();

      plateSizes.forEach(size => {
        const rentOut = outstandingBalances ? outstandingBalances[size.id] || 0 : 0;
        const borrowOut = borrowedOutstanding ? borrowedOutstanding[size.id] || 0 : 0;
        if (rentOut > 0 || borrowOut > 0) {
          categoriesWithOutstanding.add(size.category || 'shuttering');
        }
      });

      setCollapsedSections({
        shuttering: !categoriesWithOutstanding.has('shuttering'),
        jack: !categoriesWithOutstanding.has('jack'),
        cuplock: !categoriesWithOutstanding.has('cuplock'),
        other: !categoriesWithOutstanding.has('other'),
      });
    }
  }, [outstandingBalances, borrowedOutstanding, plateSizes]);

  React.useEffect(() => {
    if (activeCategory) {
      setCollapsedSections(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(cat => {
          if (cat !== activeCategory) {
            next[cat] = true; // Force collapsed
          }
        });
        return next;
      });
    }
  }, [activeCategory]);

  const toggleSection = (section: string) => {
    if (activeCategory && activeCategory !== section) {
      return;
    }
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const handleChange = (sizeId: number, field: 'qty' | 'borrowed' | 'note', value: number | string) => {
    const currentItem = items.items[sizeId] || { qty: 0, borrowed: 0, note: '' };

    let newValue = value;
    if (field !== 'note') {
      newValue = (typeof value === 'string' && value === '') ? 0 : parseInt(value as string) || 0;
    }

    onChange({
      ...items,
      items: {
        ...items.items,
        [sizeId]: { ...currentItem, [field]: newValue }
      }
    });
  };

  const handleMainNoteChange = (value: string) => {
    onChange({ ...items, main_note: value });
  };


  const renderDesktopRow = (ps: PlateSize) => (
    <tr key={ps.id}>
      <td className="px-4 py-4 text-sm font-bold text-center text-gray-900 whitespace-nowrap">
        {ps.name}
      </td>
      {outstandingBalances && (
        <td className="px-4 py-4 text-center whitespace-nowrap">
          <div
            className={`px-3 py-2 text-sm font-semibold rounded-lg inline-block ${outstandingBalances[ps.id] > 0
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
              }`}
          >
            {outstandingBalances[ps.id] || 0}
          </div>
        </td>
      )}
      {showAvailable && (
        <td className="px-4 py-4 text-center whitespace-nowrap">
          <div
            className={`px-3 py-2 text-sm font-semibold rounded-lg inline-block ${stockData.find((s) => s.size === ps.id)
              ?.available_stock === 0
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
              }`}
          >
            {stockData.find((s) => s.size === ps.id)
              ?.available_stock || 0}
          </div>
        </td>
      )}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <input
          type="number"
          min="0"
          value={
            items.items[ps.id]?.qty || ""
          }
          onChange={(e) => handleChange(ps.id, 'qty', e.target.value)}
          className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </td>
      {outstandingBalances && !hideColumns && (
        <td className="px-4 py-4 text-center whitespace-nowrap">
          <div
            className={`px-3 py-2 text-sm font-semibold rounded-lg inline-block ${borrowedOutstanding &&
              borrowedOutstanding[ps.id] > 0
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-100 text-gray-700"
              }`}
          >
            {borrowedOutstanding
              ? borrowedOutstanding[ps.id] || 0
              : 0}
          </div>
        </td>
      )}
      {!hideColumns && (
        <>
          <td className="px-4 py-4 text-center whitespace-nowrap">
            <input
              type="number"
              min="0"
              value={
                items.items[ps.id]?.borrowed || ""
              }
              onChange={(e) => handleChange(ps.id, 'borrowed', e.target.value)}
              className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </td>
          <td className="px-4 py-4">
            <input
              type="text"
              value={
                items.items[ps.id]?.note || ""
              }
              onChange={(e) => handleChange(ps.id, 'note', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </td>
        </>
      )}
    </tr>
  );

  const renderMobileRow = (ps: PlateSize, index: number) => (
    <tr
      key={ps.id}
      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
    >
      <td className={`sticky left-0 z-10 px-1 py-1.5 text-[10px] font-bold text-center text-gray-900 border-r-2 border-gray-300 w-12 min-w-[48px] sm:w-16 sm:min-w-[64px] sm:px-2 sm:text-sm ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
        {ps.name}
      </td>
      {outstandingBalances && (
        <td className="px-1 py-1.5 text-center border-r border-gray-200">
          <div
            className={`px-1.5 py-1 text-xs sm:text-sm font-semibold rounded whitespace-nowrap ${outstandingBalances[ps.id] > 0
              ? "bg-red-100 text-red-700"
              : "bg-gray-200 text-gray-600"
              }`}
          >
            {outstandingBalances[ps.id] || 0}
          </div>
        </td>
      )}
      {showAvailable && (
        <td className="px-1 py-1.5 text-center border-r border-gray-200">
          <div
            className={`px-1.5 py-1 text-xs sm:text-sm font-semibold rounded whitespace-nowrap ${stockData.find((s) => s.size === ps.id)
              ?.available_stock === 0
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
              }`}
          >
            {stockData.find((s) => s.size === ps.id)
              ?.available_stock || 0}
          </div>
        </td>
      )}
      <td className="px-1 py-1.5 border-r border-gray-200">
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={
            items.items[ps.id]?.qty || ""
          }
          onChange={(e) =>
            handleChange(ps.id, 'qty', e.target.value)
          }
          className="w-full px-2 py-2 text-[13px] sm:text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] touch-manipulation active:scale-[0.97]"
        />
      </td>
      {outstandingBalances && !hideColumns && (
        <td className="px-1 py-1.5 text-center border-r border-gray-200">
          <div
            className={`px-1.5 py-1 text-xs sm:text-sm font-semibold rounded whitespace-nowrap ${borrowedOutstanding &&
              borrowedOutstanding[ps.id] > 0
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-200 text-gray-600"
              }`}
          >
            {borrowedOutstanding
              ? borrowedOutstanding[ps.id] || 0
              : 0}
          </div>
        </td>
      )}
      {!hideColumns && (
        <>
          <td className="px-1 py-1.5 border-r border-gray-200">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={
                items.items[ps.id]?.borrowed || ""
              }
              onChange={(e) =>
                handleChange(ps.id, 'borrowed', e.target.value)
              }
              className="w-full px-2 py-2 text-[13px] sm:text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] touch-manipulation active:scale-[0.97]"
            />
          </td>
          <td className="px-1 py-1.5">
            <input
              type="text"
              value={
                items.items[ps.id]?.note || ""
              }
              onChange={(e) => handleChange(ps.id, 'note', e.target.value)}
              className="w-full px-2 py-2 text-[13px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] touch-manipulation active:scale-[0.97]"
              placeholder={t("optionalNote")}
            />
          </td>
        </>
      )}
    </tr>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                {t("size")}
              </th>
              {outstandingBalances && (
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  {t("outstanding")}
                </th>
              )}
              {showAvailable && (
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  {t("available")}
                </th>
              )}
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                {t("quantity")}
              </th>
              {outstandingBalances && !hideColumns && (
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  {t("borrowedOutstanding")}
                </th>
              )}
              {!hideColumns && (
                <>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    {t("borrowed")}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    {t("notes")}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Shuttering Plates Section */}
            <tr 
              onClick={() => toggleSection('shuttering')}
              className={`font-semibold border-y select-none transition-colors ${
                activeCategory && activeCategory !== 'shuttering'
                  ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                  : "bg-blue-50/70 text-blue-800 hover:bg-blue-100/70 border-blue-100 cursor-pointer"
              }`}
            >
              <td colSpan={10} className="px-4 py-2 text-xs sm:text-sm font-bold text-left">
                <div className="flex items-center gap-2">
                  {activeCategory && activeCategory !== 'shuttering' ? (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">{t('locked')}</span>
                  ) : collapsedSections.shuttering ? (
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                  <span>શટરિંગ પ્લેટો (Shuttering Plates)</span>
                </div>
              </td>
            </tr>
            {!collapsedSections.shuttering && plateSizes.filter(ps => (ps.category || 'shuttering') === 'shuttering').map(renderDesktopRow)}

            {/* Jacks Section */}
            <tr 
              onClick={() => toggleSection('jack')}
              className={`font-semibold border-y select-none transition-colors ${
                activeCategory && activeCategory !== 'jack'
                  ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                  : "bg-purple-50/70 text-purple-800 hover:bg-purple-100/70 border-purple-100 cursor-pointer"
              }`}
            >
              <td colSpan={10} className="px-4 py-2 text-xs sm:text-sm font-bold text-left">
                <div className="flex items-center gap-2">
                  {activeCategory && activeCategory !== 'jack' ? (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">{t('locked')}</span>
                  ) : collapsedSections.jack ? (
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-purple-600" />
                  )}
                  <span>લોખંડના જેક (Iron Jacks)</span>
                </div>
              </td>
            </tr>
            {!collapsedSections.jack && plateSizes.filter(ps => ps.category === 'jack').map(renderDesktopRow)}

            {/* Cuplock Section */}
            {plateSizes.some(ps => ps.category === 'cuplock') && (
              <>
                <tr 
                  onClick={() => toggleSection('cuplock')}
                  className={`font-semibold border-y select-none transition-colors ${
                    activeCategory && activeCategory !== 'cuplock'
                      ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                      : "bg-orange-50/70 text-orange-800 hover:bg-orange-100/70 border-orange-100 cursor-pointer"
                  }`}
                >
                  <td colSpan={10} className="px-4 py-2 text-xs sm:text-sm font-bold text-left">
                    <div className="flex items-center gap-2">
                      {activeCategory && activeCategory !== 'cuplock' ? (
                        <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">{t('locked')}</span>
                      ) : collapsedSections.cuplock ? (
                        <ChevronRight className="w-4 h-4 text-orange-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-orange-600" />
                      )}
                      <span>કપલોક આઈટમ્સ (Cuplock Items)</span>
                    </div>
                  </td>
                </tr>
                {!collapsedSections.cuplock && plateSizes.filter(ps => ps.category === 'cuplock').map(renderDesktopRow)}
              </>
            )}

            {/* Other Section */}
            {plateSizes.some(ps => ps.category === 'other') && (
              <>
                <tr 
                  onClick={() => toggleSection('other')}
                  className={`font-semibold border-y select-none transition-colors ${
                    activeCategory && activeCategory !== 'other'
                      ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                      : "bg-green-50/70 text-green-800 hover:bg-green-100/70 border-green-100 cursor-pointer"
                  }`}
                >
                  <td colSpan={10} className="px-4 py-2 text-xs sm:text-sm font-bold text-left">
                    <div className="flex items-center gap-2">
                      {activeCategory && activeCategory !== 'other' ? (
                        <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">{t('locked')}</span>
                      ) : collapsedSections.other ? (
                        <ChevronRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-green-600" />
                      )}
                      <span>અન્ય આઈટમ્સ (Other Items)</span>
                    </div>
                  </td>
                </tr>
                {!collapsedSections.other && plateSizes.filter(ps => ps.category === 'other').map(renderDesktopRow)}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Table-Like Form - Horizontal Scroll with Fixed Size Column */}
      <div className="lg:hidden">
        <div className="-mx-3 overflow-x-auto sm:-mx-4">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="sticky left-0 z-10 px-1 py-1.5 text-[10px] font-bold text-center text-gray-700 bg-gray-100 border-r-2 border-gray-300 w-12 min-w-[48px] sm:w-16 sm:min-w-[64px] sm:px-2 sm:text-xs">
                      {t("size")}
                    </th>
                    {outstandingBalances && (
                      <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[70px] sm:min-w-[80px]">
                        {t("outstanding")}
                      </th>
                    )}
                    {showAvailable && (
                      <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[70px] sm:min-w-[90px]">
                        {t("available")}
                      </th>
                    )}
                    <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[70px] sm:min-w-[80px]">
                      {t("quantity")}
                    </th>
                    {outstandingBalances && !hideColumns && (
                      <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[70px] sm:min-w-[80px]">
                        {t("borrowedOutstanding")}
                      </th>
                    )}
                    {!hideColumns && (
                      <>
                        <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[70px] sm:min-w-[80px]">
                          {t("borrowed")}
                        </th>
                        <th className="px-1 py-1.5 text-xs sm:text-sm font-semibold text-center text-gray-700 min-w-[120px] sm:min-w-[150px]">
                          {t("notes")}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Shuttering Plates Section */}
                  <tr 
                    onClick={() => toggleSection('shuttering')}
                    className={`font-semibold border-y select-none transition-colors ${
                      activeCategory && activeCategory !== 'shuttering'
                        ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                        : "bg-blue-50/70 text-blue-800 border-blue-100 cursor-pointer"
                    }`}
                  >
                    <td colSpan={10} className={`px-2 py-1 text-[11px] sm:text-xs font-bold sticky left-0 z-10 text-left transition-colors ${
                      activeCategory && activeCategory !== 'shuttering' ? "bg-gray-100/60" : "bg-blue-50/70"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {activeCategory && activeCategory !== 'shuttering' ? (
                          <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">{t('locked')}</span>
                        ) : collapsedSections.shuttering ? (
                          <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>શટરિંગ પ્લેટો (Shuttering Plates)</span>
                      </div>
                    </td>
                  </tr>
                  {!collapsedSections.shuttering && plateSizes.filter(ps => (ps.category || 'shuttering') === 'shuttering').map((ps, idx) => renderMobileRow(ps, idx))}

                  {/* Jacks Section */}
                  <tr 
                    onClick={() => toggleSection('jack')}
                    className={`font-semibold border-y select-none transition-colors ${
                      activeCategory && activeCategory !== 'jack'
                        ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                        : "bg-purple-50/70 text-purple-800 border-purple-100 cursor-pointer"
                    }`}
                  >
                    <td colSpan={10} className={`px-2 py-1 text-[11px] sm:text-xs font-bold sticky left-0 z-10 text-left transition-colors ${
                      activeCategory && activeCategory !== 'jack' ? "bg-gray-100/60" : "bg-purple-50/70"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {activeCategory && activeCategory !== 'jack' ? (
                          <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">{t('locked')}</span>
                        ) : collapsedSections.jack ? (
                          <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
                        )}
                        <span>લોખંડના જેક (Iron Jacks)</span>
                      </div>
                    </td>
                  </tr>
                  {!collapsedSections.jack && plateSizes.filter(ps => ps.category === 'jack').map((ps, idx) => renderMobileRow(ps, idx))}

                  {/* Cuplock Section */}
                  {plateSizes.some(ps => ps.category === 'cuplock') && (
                    <>
                      <tr 
                        onClick={() => toggleSection('cuplock')}
                        className={`font-semibold border-y select-none transition-colors ${
                          activeCategory && activeCategory !== 'cuplock'
                            ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                            : "bg-orange-50/70 text-orange-800 border-orange-100 cursor-pointer"
                        }`}
                      >
                        <td colSpan={10} className={`px-2 py-1 text-[11px] sm:text-xs font-bold sticky left-0 z-10 text-left transition-colors ${
                          activeCategory && activeCategory !== 'cuplock' ? "bg-gray-100/60" : "bg-orange-50/70"
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {activeCategory && activeCategory !== 'cuplock' ? (
                              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">{t('locked')}</span>
                            ) : collapsedSections.cuplock ? (
                              <ChevronRight className="w-3.5 h-3.5 text-orange-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-orange-600" />
                            )}
                            <span>કપલોક આઈટમ્સ (Cuplock Items)</span>
                          </div>
                        </td>
                      </tr>
                      {!collapsedSections.cuplock && plateSizes.filter(ps => ps.category === 'cuplock').map((ps, idx) => renderMobileRow(ps, idx))}
                    </>
                  )}

                  {/* Other Section */}
                  {plateSizes.some(ps => ps.category === 'other') && (
                    <>
                      <tr 
                        onClick={() => toggleSection('other')}
                        className={`font-semibold border-y select-none transition-colors ${
                          activeCategory && activeCategory !== 'other'
                            ? "bg-gray-100/60 text-gray-400 cursor-not-allowed opacity-60 border-gray-200"
                            : "bg-green-50/70 text-green-800 border-green-100 cursor-pointer"
                        }`}
                      >
                        <td colSpan={10} className={`px-2 py-1 text-[11px] sm:text-xs font-bold sticky left-0 z-10 text-left transition-colors ${
                          activeCategory && activeCategory !== 'other' ? "bg-gray-100/60" : "bg-green-50/70"
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {activeCategory && activeCategory !== 'other' ? (
                              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">{t('locked')}</span>
                            ) : collapsedSections.other ? (
                              <ChevronRight className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-green-600" />
                            )}
                            <span>અન્ય આઈટમ્સ (Other Items)</span>
                          </div>
                        </td>
                      </tr>
                      {!collapsedSections.other && plateSizes.filter(ps => ps.category === 'other').map((ps, idx) => renderMobileRow(ps, idx))}
                    </>
                  )}
                  {/* Totals Summary Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="sticky left-0 z-10 px-1 py-3 text-xs font-bold text-center text-gray-900 border-r-2 border-gray-300 w-12 min-w-[48px] sm:w-16 sm:min-w-[64px] sm:text-sm bg-gray-100">
                      કુલ
                    </td>
                    {outstandingBalances && (
                      <td className="px-1 py-3 text-center border-r border-gray-200">
                        -
                      </td>
                    )}
                    {showAvailable && (
                      <td className="px-1 py-3 text-center border-r border-gray-200">
                        -
                      </td>
                    )}
                    <td className="px-1 py-3 text-xs font-bold text-center border-r border-gray-200 sm:text-sm">
                      <div className="px-3 py-1.5 bg-blue-100 rounded-lg text-blue-800">
                        {Object.values(items.items || {}).reduce((sum, item) => sum + (item.qty || 0) + (item.borrowed || 0), 0)} કુલ
                      </div>
                    </td>
                    {outstandingBalances && !hideColumns && (
                      <td className="px-1 py-3 text-center border-r border-gray-200">
                        -
                      </td>
                    )}
                    {!hideColumns && (
                      <>
                        <td className="px-1 py-3 text-xs font-bold text-center border-r border-gray-200 sm:text-sm">
                          <div className="px-2 py-1 rounded-lg bg-orange-50">
                            {Object.values(items.items || {}).reduce((sum, item) => sum + (item.borrowed || 0), 0)} માર્કો
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Main Note - Mobile Optimized */}
      <div>
        <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">
          {t("mainNote")}
        </label>
        <textarea
          value={items.main_note}
          onChange={(e) => handleMainNoteChange(e.target.value)}
          rows={3}
          placeholder={t("optionalGeneralNotes")}
          className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default ItemsTable;
