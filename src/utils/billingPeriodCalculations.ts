import { addDays, parseISO, differenceInDays, format } from 'date-fns';

// Returns sort priority based on the selected method.
// Standard: Udhar first (1), Jama second (2)
// Jama First: Jama first (1), Udhar second (2) — lower rent on same-day events
const getSortPriority = (type: 'udhar' | 'jama', jamaFirst: boolean): number => {
  if (jamaFirst) return type === 'jama' ? 1 : 2;
  return type === 'udhar' ? 1 : 2;
};

/**
 * BILLING PERIOD CALCULATION SYSTEM
 * -------------------------------
 * Updated to include transactionAmount
 * 
 * EDGE CASES HANDLED:
 * 
 * 1. Same-Day Events
 *    Problem: Udhar and Jama on same day
 *    Solution: sortPriority (Udhar=1, Jama=2)
 *    Example:
 *    ┌─ Jan 10: Udhar 100 (priority 1)
 *    └─ Jan 10: Jama 50  (priority 2)
 *    Result: Balance = 50 plates (100 - 50)
 * 
 * 2. Bill Date Inclusion
 *    Problem: Last period must include bill date
 *    Solution: +1 day for final period
 *    Example:
 *    Jan 20 Udhar → Jan 31 Bill
 *    Days = 12 (Jan 20-31 inclusive)
 * 
 * 3. Zero/Invalid Cases
 *    Problems:
 *    - Zero days between events
 *    - Zero/negative plate balance
 *    - Invalid date ranges
 *    Solution: Multiple validation checks
 *    ┌─ if (currentBalance > 0)     // Valid plate count
 *    ├─ if (daysToCharge > 0)       // Valid period length
 *    └─ parseISO() validation       // Valid dates
 * 
 * KEY FORMULAS AND RULES:
 * 
 * 1. Day Calculations:
 *    - Between dates: differenceInDays(endDate, startDate)
 *    - For Jama periods: Add +1 to include return date
 *    - For final period: Add +1 to include bill date
 * 
 * 2. Rent Calculations:
 *    - Per period: plates × days × daily_rate
 *    - Total rent: Sum of all period rents
 * 
 * 3. Date Handling:
 *    - Udhar effective_date = issue_date (immediate)
 *    - Jama effective_date = return_date + 1 day
 *    - Period end = next_event_date - 1 (unless Jama)
 * 
 * EXAMPLE TIMELINE:
 * Jan 1 (Udhar 100) → Jan 10 (Jama 50) → Jan 20 (Udhar 30) → Jan 31 (Bill)
 * 
 * Period 1: Jan 1-10 (10 days, 100 plates)
 * ├─ Start: Jan 1 (Udhar date)
 * └─ End: Jan 10 (Include Jama date)
 * 
 * Period 2: Jan 11-19 (9 days, 50 plates)
 * ├─ Start: Jan 11 (Day after Jama)
 * └─ End: Jan 19 (Before next Udhar)
 * 
 * Period 3: Jan 20-31 (12 days, 80 plates)
 * ├─ Start: Jan 20 (Udhar date)
 * └─ End: Jan 31 (Include bill date)
 * 
 * WHY THIS WORKS:
 * ✓ No gaps: Every day has a plate balance
 * ✓ No overlaps: Clear period boundaries
 * ✓ Fair billing: Charge for actual possession days
 * ✓ Accurate transitions: Clean handoffs between periods
 */

interface ChallanEntry {
  date: string;
  effectiveDate: string;
  type: 'udhar' | 'jama';
  plateCount: number;
  challanNumber: string;
  sortPriority: number;
}

interface LedgerEntry {
  transactionDate: string;
  effectiveDate: string;
  balanceBefore: number;
  udharAmount?: number;
  jamaAmount?: number;
  balanceAfter: number;
  entryType: 'udhar' | 'jama';
  challanNumber: string;
  sortPriority: number;
}

interface ChallanDetail {
  challanNumber: string;
  qty: number;
}

interface BillingPeriod {
  startDate: string;
  endDate: string;
  plateCount: number;
  days: number;
  rent: number;
  causeType: 'udhar' | 'jama';
  challanNumber: string;
  txnQty: number;
  udharQty?: number;  // Total udhar quantity on this date
  jamaQty?: number;   // Total jama quantity on this date
  udharDetails?: ChallanDetail[];  // Individual udhar challans on same day
  jamaDetails?: ChallanDetail[];   // Individual jama challans on same day
}

export interface BillingPeriodResult {
  entries: ChallanEntry[];
  ledger: LedgerEntry[];
  periods: BillingPeriod[];
  totalRent: number;
}

export function getChallanTotalPlates(challan: any): number {
  if (!challan) return 0;
  const raw = challan.items;
  const row = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});

  if (row.items && Array.isArray(row.items)) {
    return row.items.reduce((sum: number, item: any) => sum + (item.qty || 0) + (item.borrowed || 0), 0);
  } else {
    let total = 0;
    for (let i = 1; i <= 50; i++) {
      total += (row[`size_${i}_qty`] || 0) + (row[`size_${i}_borrowed`] || 0);
    }
    return total;
  }
}

export function createCombinedEntryList(
  udharChallans: Array<{
    udhar_date: string;
    udhar_challan_number: string;
    items: any;
  }>,
  jamaReturns: Array<{
    jama_date: string;
    jama_challan_number: string;
    items: any;
  }>,
  jamaFirst: boolean = false
): ChallanEntry[] {
  const entries: ChallanEntry[] = [];

  udharChallans.forEach(challan => {
    const totalPlates = getChallanTotalPlates(challan);
    entries.push({
      date: challan.udhar_date,
      effectiveDate: challan.udhar_date,
      type: 'udhar',
      plateCount: totalPlates,
      challanNumber: challan.udhar_challan_number,
      sortPriority: getSortPriority('udhar', jamaFirst)
    });
  });

  jamaReturns.forEach(jama => {
    const totalPlates = getChallanTotalPlates(jama);

    // JAMA FIRST: Plates leave the balance on the SAME DAY they are returned.
    //   → Client is NOT charged for the return day itself. Lower rent.
    //
    // STANDARD:   Plates leave the balance the DAY AFTER return.
    //   → Client IS charged for the return day. Standard practice.
    const effectiveDate = jamaFirst
      ? jama.jama_date
      : format(addDays(parseISO(jama.jama_date), 1), 'yyyy-MM-dd');

    console.log(`[createCombinedEntryList] Jama ${jama.jama_challan_number}: jamaFirst=${jamaFirst}, date=${jama.jama_date}, effectiveDate=${effectiveDate}`);

    entries.push({
      date: jama.jama_date,
      effectiveDate,
      type: 'jama',
      plateCount: totalPlates,
      challanNumber: jama.jama_challan_number,
      sortPriority: getSortPriority('jama', jamaFirst)
    });
  });

  return entries.sort((a, b) => {
    const dateCompare = a.effectiveDate.localeCompare(b.effectiveDate);
    if (dateCompare !== 0) return dateCompare;
    return a.sortPriority - b.sortPriority;
  });
}

export function buildTransactionLedger(entries: ChallanEntry[]): LedgerEntry[] {
  let currentBalance = 0;
  const ledger: LedgerEntry[] = [];

  // Sort entries by actual transaction date (not effective date)
  // This ensures the ledger shows events in chronological order
  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dateCompare === 0 ? a.sortPriority - b.sortPriority : dateCompare;
  });

  sortedEntries.forEach(entry => {
    const balanceBefore = currentBalance;

    // For display purposes:
    // - Udhar reduces balance immediately
    // - Jama keeps same balance on return date (changes next day)
    if (entry.type === 'udhar') {
      currentBalance += entry.plateCount;
    } else {
      // For Jama, the balance changes on effective date (next day)
      currentBalance -= entry.plateCount;
    }

    ledger.push({
      transactionDate: entry.date,         // Actual event date (for display)
      effectiveDate: entry.effectiveDate,  // When balance actually changes
      balanceBefore,
      [entry.type === 'udhar' ? 'udharAmount' : 'jamaAmount']: entry.plateCount,
      balanceAfter: currentBalance,
      entryType: entry.type,
      challanNumber: entry.challanNumber,
      sortPriority: entry.sortPriority
    });
  });

  return ledger;
}

export function calculateBillingPeriodsFIFO(
  entries: ChallanEntry[],
  billDate: string,
  dailyRate: number
): BillingPeriodResult {
  const periods: BillingPeriod[] = [];
  let totalRent = 0;

  // Filter entries to strictly exclude anything after the bill date
  const filteredEntries = entries.filter(entry => entry.date <= billDate);

  // Group into deliveries (udhar) and returns (jama)
  const udhars = filteredEntries
    .filter(e => e.type === 'udhar')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const jamas = filteredEntries
    .filter(e => e.type === 'jama')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Outstanding deliveries queue
  const outstandingDeliveries = udhars.map(u => ({
    date: u.date,
    remainingQty: u.plateCount,
    challanNumber: u.challanNumber
  }));

  // Match returns (jamas)
  jamas.forEach(jama => {
    let returnQty = jama.plateCount;
    const jamaDate = jama.date;

    for (let i = 0; i < outstandingDeliveries.length; i++) {
      const delivery = outstandingDeliveries[i];
      if (delivery.remainingQty <= 0) continue;
      if (new Date(delivery.date).getTime() > new Date(jamaDate).getTime()) {
        // Cannot match returns to deliveries that happen in the future
        break;
      }

      const matchQty = Math.min(returnQty, delivery.remainingQty);
      if (matchQty > 0) {
        const startDate = delivery.date;
        const endDate = jamaDate;

        // Calculate days inclusive (Standard/Inclusive)
        const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

        // Rent calculation
        const rateInPaise = Math.round(dailyRate * 100);
        const rentInPaise = matchQty * days * rateInPaise;
        const rent = Math.round(rentInPaise) / 100;

        periods.push({
          startDate,
          endDate,
          plateCount: matchQty,
          days,
          rent,
          causeType: 'jama',
          challanNumber: jama.challanNumber,
          txnQty: matchQty,
          jamaQty: matchQty,
          jamaDetails: [{ challanNumber: jama.challanNumber, qty: matchQty }]
        });

        totalRent += rent;
        returnQty -= matchQty;
        delivery.remainingQty -= matchQty;

        if (returnQty === 0) break;
      }
    }
  });

  // Remaining outstanding deliveries at the end of the bill period
  outstandingDeliveries.forEach(delivery => {
    if (delivery.remainingQty > 0) {
      const startDate = delivery.date;
      const endDate = billDate;

      // Calculate days inclusive
      const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

      // Rent calculation
      const rateInPaise = Math.round(dailyRate * 100);
      const rentInPaise = delivery.remainingQty * days * rateInPaise;
      const rent = Math.round(rentInPaise) / 100;

      periods.push({
        startDate,
        endDate,
        plateCount: delivery.remainingQty,
        days,
        rent,
        causeType: 'udhar',
        challanNumber: delivery.challanNumber,
        txnQty: delivery.remainingQty,
        udharQty: delivery.remainingQty,
        udharDetails: [{ challanNumber: delivery.challanNumber, qty: delivery.remainingQty }]
      });

      totalRent += rent;
    }
  });

  // Sort periods by endDate ascending
  periods.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  return {
    entries: filteredEntries,
    ledger: [],
    periods,
    totalRent: Math.round(totalRent * 100) / 100
  };
}

export function calculateBillingPeriods(
  entries: ChallanEntry[],
  billDate: string,
  dailyRate: number
): BillingPeriodResult {
  let currentBalance = 0;
  const periods: BillingPeriod[] = [];
  let totalRent = 0;

  // First sort entries by date and priority
  // This ensures when Udhar and Jama happen on the same date:
  // 1. Process Udhar first (priority 1) - Add plates to balance
  // 2. Then process Jama (priority 2) - Remove plates from balance
  entries.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dateCompare === 0 ? (a.sortPriority - b.sortPriority) : dateCompare;
  });

  const ledger = buildTransactionLedger(entries);

  // Filter entries to strictly exclude anything after the bill date
  // This ensures the bill stops exactly at the "To Date"
  const filteredEntries = entries.filter(entry => entry.date <= billDate);

  // Group changes by effective date (when balance actually changes)
  // For billing calculations:
  // - Udhar: Use issue date (balance changes immediately)
  // - Jama: Use next day (balance changes day after return)
  const balanceChanges = filteredEntries.reduce((acc, entry) => {
    // Use effectiveDate for balance changes:
    // Udhar: Same as transaction date
    // Jama: Next day after return
    const date = entry.effectiveDate;

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ChallanEntry[]>);

  // Process each date's changes in sequence
  const dates = Object.keys(balanceChanges).sort();

  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    const nextDate = i < dates.length - 1 ? dates[i + 1] : billDate;

    // Apply all changes for this date
    const sortedChanges = [...balanceChanges[currentDate]].sort((a, b) => a.sortPriority - b.sortPriority);

    sortedChanges.forEach(change => {
      // Validate plate count
      if (change.plateCount <= 0) {
        console.warn(`Invalid plate count in ${change.type} challan ${change.challanNumber}`);
        return;
      }

      if (change.type === 'udhar') {
        currentBalance += change.plateCount;  // Add plates from Udhar
      } else {
        // Prevent negative balance from Jama
        if (currentBalance < change.plateCount) {
          console.warn(`Warning: Jama ${change.plateCount} plates exceeds current balance of ${currentBalance}`);
          currentBalance = 0;  // Set to zero instead of negative
        } else {
          currentBalance -= change.plateCount;  // Remove plates from Jama
        }
      }
    });

    // Calculate rent if there are plates; also record a zero-balance row when all plates returned
    if (currentBalance >= 0) {
      // Collect challan details for this date (needed for both > 0 and = 0 cases)
      const changesOnDate = balanceChanges[currentDate];
      const udharEntries = changesOnDate.filter(c => c.type === 'udhar');
      const jamaEntries = changesOnDate.filter(c => c.type === 'jama');

      const udharQty = udharEntries.length > 0
        ? udharEntries.reduce((s, c) => s + c.plateCount, 0)
        : undefined;
      const jamaQty = jamaEntries.length > 0
        ? jamaEntries.reduce((s, c) => s + c.plateCount, 0)
        : undefined;

      const udharDetails: ChallanDetail[] = udharEntries.map(c => ({ challanNumber: c.challanNumber, qty: c.plateCount }));
      const jamaDetails: ChallanDetail[] = jamaEntries.map(c => ({ challanNumber: c.challanNumber, qty: c.plateCount }));
      const txnQty = changesOnDate[0].plateCount || 0;

      if (currentBalance === 0) {
        // Zero-balance display row — all plates returned, no rent charged
        periods.push({
          startDate: currentDate,
          endDate: currentDate,
          plateCount: 0,
          days: 0,
          rent: 0,
          causeType: balanceChanges[currentDate][0].type,
          challanNumber: balanceChanges[currentDate][0].challanNumber,
          txnQty,
          udharQty,
          jamaQty,
          udharDetails: udharDetails.length > 0 ? udharDetails : undefined,
          jamaDetails: jamaDetails.length > 0 ? jamaDetails : undefined,
        });
      } else {
        /**
         * PERIOD CALCULATION BLOCK
         * -----------------------
         * Calculate period details including:
         * 1. Start and end dates
         * 2. Number of days to charge
         * 3. Validation and error handling
         */

        // Initialize period data
        let periodData: { days: number; endDate: string; } | null = null;

        try {
          // Start date is simply the effective date of the change
          const effectiveStartDate = parseISO(currentDate);

          if (isNaN(effectiveStartDate.getTime())) {
            throw new Error(`Invalid start date: ${currentDate}`);
          }

          if (i < dates.length - 1) {
            // Regular period with next event
            const endDateObj = parseISO(nextDate);
            if (isNaN(endDateObj.getTime())) {
              throw new Error(`Invalid end date: ${nextDate}`);
            }

            // Use the start date directly
            periodData = {
              days: differenceInDays(endDateObj, effectiveStartDate),
              endDate: nextDate
            };
          } else {
            // Last period - include bill date
            const billDateObj = parseISO(billDate);
            if (isNaN(billDateObj.getTime())) {
              throw new Error(`Invalid bill date: ${billDate}`);
            }

            periodData = {
              days: differenceInDays(billDateObj, effectiveStartDate) + 1,
              endDate: format(addDays(billDateObj, 1), 'yyyy-MM-dd')
            };
          }
        } catch (error) {
          console.error('Date processing error:', error);
          continue;  // Skip invalid periods
        }

        // Create period if we have valid data with positive days
        if (periodData && periodData.days > 0) {
          // Final days calculation
          let finalDays = periodData.days;

          // Recalculate rent with corrected days
          const rateInPaise = Math.round(dailyRate * 100);
          const rentInPaise = currentBalance * finalDays * rateInPaise;
          const rent = Math.round(rentInPaise) / 100;

          console.log('Period txnQty:', txnQty, 'udharQty:', udharQty, 'jamaQty:', jamaQty, 'from date:', currentDate);

          // Add the billing period with full details
          periods.push({
            startDate: currentDate,
            endDate: periodData.endDate,
            plateCount: currentBalance,
            days: finalDays,
            rent,
            causeType: balanceChanges[currentDate][0].type,
            challanNumber: balanceChanges[currentDate][0].challanNumber,
            txnQty,
            udharQty,
            jamaQty,
            udharDetails: udharDetails.length > 0 ? udharDetails : undefined,
            jamaDetails: jamaDetails.length > 0 ? jamaDetails : undefined,
          });

          // Update total rent
          totalRent += rent;
        }
      }
    }
  }

  return {
    entries,
    ledger,
    periods,
    totalRent: Math.round(totalRent * 100) / 100
  };
}

export function getQtyForSize(challan: any, sizeId: number): { qty: number, borrowed: number, note: string | null } {
  const raw = challan.items;
  const row = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});

  if (row.items && Array.isArray(row.items)) {
    const matchedItem = row.items.find((i: any) => i.size_id === sizeId);
    return {
      qty: matchedItem?.qty || 0,
      borrowed: matchedItem?.borrowed || 0,
      note: matchedItem?.note || null
    };
  } else {
    return {
      qty: row[`size_${sizeId}_qty`] || 0,
      borrowed: row[`size_${sizeId}_borrowed`] || 0,
      note: row[`size_${sizeId}_note`] || null
    };
  }
}

export function calculateBill(
  udharChallans: any[],
  jamaReturns: any[],
  billDate: string,
  dailyRate: number,
  extraCharges: Array<{ amount: number }> = [],
  discounts: Array<{ amount: number }> = [],
  payments: Array<{ amount: number }> = [],
  serviceRate: number = 10,
  fromDate?: string,
  plateSizes: any[] = [],
  jackRents: Record<number, number> = {},
  jamaFirst: boolean = false
): {
  billingPeriods: BillingPeriodResult;
  extraChargesTotal: number;
  discountsTotal: number;
  paymentsTotal: number;
  serviceChargeTotal: number;
  grandTotal: number;
  dueAmount: number;
} {
  console.log('[calculateBill] jamaFirst =', jamaFirst, '| dateSortingMethod from localStorage =', localStorage.getItem('dateSortingMethod'));
  const entries = createCombinedEntryList(udharChallans, jamaReturns, jamaFirst);

  // Helper: build ChallanEntry list for a specific set of sizeIds
  function buildSizeEntries(sizeId: number): ChallanEntry[] {
    const sizeEntries: ChallanEntry[] = [];
    udharChallans.forEach(ch => {
      const details = getQtyForSize(ch, sizeId);
      const qty = details.qty + details.borrowed;
      if (qty > 0) {
        sizeEntries.push({
          date: ch.udhar_date,
          effectiveDate: ch.udhar_date,
          type: 'udhar',
          plateCount: qty,
          challanNumber: ch.udhar_challan_number,
          sortPriority: getSortPriority('udhar', jamaFirst)
        });
      }
    });
    jamaReturns.forEach(ch => {
      const details = getQtyForSize(ch, sizeId);
      const qty = details.qty + details.borrowed;
      if (qty > 0) {
        const effectiveDate = jamaFirst
          ? ch.jama_date
          : format(addDays(parseISO(ch.jama_date), 1), 'yyyy-MM-dd');
        sizeEntries.push({
          date: ch.jama_date,
          effectiveDate,
          type: 'jama',
          plateCount: qty,
          challanNumber: ch.jama_challan_number,
          sortPriority: getSortPriority('jama', jamaFirst)
        });
      }
    });
    sizeEntries.sort((a, b) => {
      const d = new Date(a.date).getTime() - new Date(b.date).getTime();
      return d === 0 ? a.sortPriority - b.sortPriority : d;
    });
    return sizeEntries;
  }

  let periods: any[] = [];

  if (plateSizes && plateSizes.length > 0) {
    // Separate sizes with custom rents from default rate sizes
    const jackCustomSizes = plateSizes.filter(ps =>
      jackRents &&
      typeof jackRents[ps.id] === 'number'
    );
    const shutteringSizes = plateSizes.filter(ps =>
      !(jackRents && typeof jackRents[ps.id] === 'number')
    );

    // ── SHUTTERING: combined global calculation across all shuttering+same-rate sizes ──
    // Build combined entries only from shuttering sizes (exclude jack-custom sizes)
    const shuttEntries: ChallanEntry[] = [];
    if (shutteringSizes.length > 0) {
      udharChallans.forEach(ch => {
        let qty = 0;
        shutteringSizes.forEach(ps => {
          const d = getQtyForSize(ch, ps.id);
          qty += d.qty + d.borrowed;
        });
        if (qty > 0) {
          shuttEntries.push({
            date: ch.udhar_date,
            effectiveDate: ch.udhar_date,
            type: 'udhar',
            plateCount: qty,
            challanNumber: ch.udhar_challan_number,
            sortPriority: getSortPriority('udhar', jamaFirst)
          });
        }
      });
      jamaReturns.forEach(ch => {
        let qty = 0;
        shutteringSizes.forEach(ps => {
          const d = getQtyForSize(ch, ps.id);
          qty += d.qty + d.borrowed;
        });
        if (qty > 0) {
          const effectiveDate = jamaFirst
            ? ch.jama_date
            : format(addDays(parseISO(ch.jama_date), 1), 'yyyy-MM-dd');
          shuttEntries.push({
            date: ch.jama_date,
            effectiveDate,
            type: 'jama',
            plateCount: qty,
            challanNumber: ch.jama_challan_number,
            sortPriority: getSortPriority('jama', jamaFirst)
          });
        }
      });
      shuttEntries.sort((a, b) => {
        const d = new Date(a.date).getTime() - new Date(b.date).getTime();
        return d === 0 ? a.sortPriority - b.sortPriority : d;
      });

      if (shuttEntries.length > 0) {
        const shuttResult = jamaFirst
          ? calculateBillingPeriodsFIFO(shuttEntries, billDate, dailyRate)
          : calculateBillingPeriods(shuttEntries, billDate, dailyRate);
        shuttResult.periods.forEach(p => {
          periods.push({ ...p, rate: dailyRate });
          // No sizeId/sizeName — these are combined shuttering
        });
      }
    }

    // ── JACK (custom rent): separate per-size calculation ──
    jackCustomSizes.forEach(ps => {
      const rate = jackRents[ps.id] as number;
      const sizeEntries = buildSizeEntries(ps.id);
      if (sizeEntries.length > 0) {
        const sizeResult = jamaFirst
          ? calculateBillingPeriodsFIFO(sizeEntries, billDate, rate)
          : calculateBillingPeriods(sizeEntries, billDate, rate);
        sizeResult.periods.forEach(p => {
          periods.push({
            ...p,
            sizeId: ps.id,
            sizeName: ps.name,
            rate
          });
        });
      }
    });
  } else {
    // No plateSizes info — fall back to fully combined global calc
    const globalBillingPeriods = jamaFirst
      ? calculateBillingPeriodsFIFO(entries, billDate, dailyRate)
      : calculateBillingPeriods(entries, billDate, dailyRate);
    periods = globalBillingPeriods.periods.map(p => ({ ...p, rate: dailyRate }));
  }

  // Sort all periods: shuttering (no sizeId) first, then jack by sizeId, then by startDate/endDate
  periods.sort((a, b) => {
    const aIsJack = a.sizeId !== undefined ? 1 : 0;
    const bIsJack = b.sizeId !== undefined ? 1 : 0;
    if (aIsJack !== bIsJack) return aIsJack - bIsJack;
    if (a.sizeId !== b.sizeId) return (a.sizeId || 0) - (b.sizeId || 0);

    if (jamaFirst) {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    } else {
      return a.startDate.localeCompare(b.startDate);
    }
  });

  // If fromDate is provided, filter and clamp periods
  if (fromDate) {
    const clampedPeriods: any[] = [];
    let clampedTotalRent = 0;

    periods.forEach(period => {
      if (period.endDate < fromDate) {
        return;
      }

      if (period.startDate >= fromDate) {
        clampedPeriods.push(period);
        clampedTotalRent += period.rent;
        return;
      }

      const newStartDate = fromDate;
      const rateInPaise = Math.round((period.rate || dailyRate) * 100);

      const rawDiff = differenceInDays(parseISO(period.endDate), parseISO(period.startDate));
      const isInclusiveEnd = period.days > rawDiff;

      const newDiff = differenceInDays(parseISO(period.endDate), parseISO(newStartDate));
      const newDays = isInclusiveEnd ? newDiff + 1 : newDiff;

      if (newDays > 0) {
        const rentInPaise = period.plateCount * newDays * rateInPaise;
        const newRent = Math.round(rentInPaise) / 100;

        clampedPeriods.push({
          ...period,
          startDate: newStartDate,
          days: newDays,
          rent: newRent
        });
        clampedTotalRent += newRent;
      }
    });

    periods = clampedPeriods;
  }

  const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const discountsTotal = discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const serviceChargeTotal = periods.reduce((sum, period) => {
    return sum + (period.plateCount * serviceRate);
  }, 0);

  const totalRentInPaise = periods.reduce((sum, period) => {
    const rentInPaise = Math.round(period.rent * 100);
    return sum + rentInPaise;
  }, 0);
  const totalRent = Math.round(totalRentInPaise) / 100;

  const grandTotalInPaise = Math.round((totalRent * 100) + (extraChargesTotal * 100) + (serviceChargeTotal * 100) - (discountsTotal * 100));
  const grandTotal = Math.round(grandTotalInPaise) / 100;
  const dueAmount = grandTotal - paymentsTotal;

  // Rebuild ledger from the full combined entries for display purposes
  const ledger = buildTransactionLedger(entries);

  return {
    billingPeriods: {
      entries,
      ledger,
      periods,
      totalRent
    },
    extraChargesTotal,
    discountsTotal,
    paymentsTotal,
    serviceChargeTotal,
    grandTotal,
    dueAmount
  };
}