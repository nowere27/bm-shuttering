import React, { memo } from 'react';
import { formatLocalDate, safeParseLocalDate } from '../utils/dateUtils';
import './BillInvoice.css';
import { formatIndianCurrency } from '../utils/currencyFormat';

interface BillInvoiceProps {
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    gst?: string;
  };
  billDetails: {
    billNumber: string;
    billDate: string;
    fromDate: string;
    toDate: string;
    dailyRent: number;
  };
  clientDetails: {
    name: string;
    nicName: string;
    site: string;
    phone: string;
  };
  rentalCharges: {
    size: string;
    pieces: number;
    days: number;
    rate: number;
    amount: number;
    startDate?: string;
    endDate?: string;
    causeType?: 'udhar' | 'jama';
    txnQty?: number;
    udharQty?: number;
    jamaQty?: number;
    udharDetails?: { challanNumber: string; qty: number }[];
    jamaDetails?: { challanNumber: string; qty: number }[];
  }[];
  extraCosts: {
    id: string;
    date: string;
    description: string;
    amount: number;
    pieces?: number;
    rate?: number;
  }[];
  discounts: {
    id: string;
    date: string;
    description: string;
    amount: number;
  }[];
  payments: {
    id: string;
    date: string;
    method: string;
    note: string;
    amount: number;
  }[];
  summary: {
    totalRent: number;
    totalUdharPlates: number;
    totalJamaPlates: number;
    netPlates: number;
    serviceCharge: number;
    totalExtraCosts: number;
    discounts: number;
    grandTotal: number;
    totalPaid: number;
    advancePaid: number;
    duePayment: number;
  };
  mainNote?: string;
  previousBill?: {
    billNumber: string;
    amount: number;
  };
}

type RentalCharge = BillInvoiceProps['rentalCharges'][number];

// ── Static style objects (created once, never on every render) ─────────────
const BASE_CELL: React.CSSProperties = {
  border: '1px solid #d1d5db',
  padding: '7px 10px',
  fontSize: '13px',
};

const C = {
  base: BASE_CELL,
  prevBillLabel: { ...BASE_CELL, fontWeight: 'bold', color: '#b91c1c', fontSize: '13px' } as React.CSSProperties,
  prevBillAmt: { ...BASE_CELL, textAlign: 'center', fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' } as React.CSSProperties,
  dateRange: { ...BASE_CELL, textAlign: 'center', fontWeight: '600' } as React.CSSProperties,
  udharJama: { ...BASE_CELL, textAlign: 'center', lineHeight: 1.5 } as React.CSSProperties,
  rateDays: { ...BASE_CELL, textAlign: 'center', fontWeight: '600', color: '#4b5563' } as React.CSSProperties,
  amount: { ...BASE_CELL, textAlign: 'center', fontWeight: '700', fontSize: '14px' } as React.CSSProperties,
  extraDesc: { ...BASE_CELL, fontWeight: '600' } as React.CSSProperties,
} as const;

// Pieces cell varies based on isZero — build on each row but reuse base
function piecesCell(isZero: boolean): React.CSSProperties {
  return {
    ...BASE_CELL,
    textAlign: 'center',
    fontWeight: isZero ? '900' : '700',
    fontSize: '14px',
    color: isZero ? '#dc2626' : '#111',
  };
}

// ── Pure function: computes udharQty / jamaQty for a rental row ────────────
function computeRentalRow(
  charge: RentalCharge,
  index: number,
  allCharges: RentalCharge[],
  fromDate: string,
  toDate: string,
): { udharQty: number; jamaQty: number; skip: boolean } {
  if (charge.udharQty !== undefined || charge.jamaQty !== undefined) {
    return { udharQty: charge.udharQty ?? 0, jamaQty: charge.jamaQty ?? 0, skip: false };
  }

  const isJama = charge.causeType === 'jama';
  const prevPieces = index > 0 ? allCharges[index - 1].pieces : 0;
  const currentQty = charge.txnQty || Math.abs(charge.pieces - prevPieces) || charge.pieces;
  const chargeStart = charge.startDate ?? fromDate;
  const chargeEnd = charge.endDate ?? toDate;

  // Single findIndex replaces the previous find + findIndex pair
  const matchingIdx = allCharges.findIndex((c, i) => {
    if (i === index) return false;
    return (c.startDate ?? fromDate) === chargeStart
      && (c.endDate ?? toDate) === chargeEnd
      && c.causeType !== charge.causeType;
  });

  if (isJama && matchingIdx !== -1) return { udharQty: 0, jamaQty: 0, skip: true };

  const matchingCharge = matchingIdx !== -1 ? allCharges[matchingIdx] : null;
  const matchingQty = matchingCharge
    ? (matchingCharge.txnQty ?? Math.abs(matchingCharge.pieces - (matchingIdx > 0 ? allCharges[matchingIdx - 1].pieces : 0)))
    : 0;

  return {
    udharQty: isJama ? matchingQty : currentQty,
    jamaQty: isJama ? currentQty : matchingQty,
    skip: false,
  };
}

// ── Component ──────────────────────────────────────────────────────────────
const BillInvoiceTemplate: React.FC<BillInvoiceProps> = ({
  billDetails,
  clientDetails,
  rentalCharges,
  extraCosts,
  payments,
  summary,
  mainNote,
  previousBill,
}) => {
  return (
    <div style={{
      width: '794px',
      backgroundColor: '#fff',
      fontFamily: '"Noto Sans Gujarati", Arial, sans-serif',
      color: '#111',
      padding: '18px',
      boxSizing: 'border-box',
    }}>
      {/* ── Outer border ── */}
      <div style={{ border: '2.5px solid #111' }}>

        {/* ══════════ HEADER ══════════ */}
        <div style={{ borderBottom: '2px solid #111' }}>

          {/* Top row: partner | religious | phones */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 16px 3px',
            borderBottom: '1px solid #d1d5db',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: 1.4 }}>
              પરષોત્તમભાઈ પોલરા<br />
              <span style={{ fontWeight: '500', fontSize: '9px' }}>(રૂપાવટીવાળા)</span>
            </div>

            <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
              <div style={{ fontWeight: '900', fontSize: '11px', letterSpacing: '1px' }}>
                ॥ શ્રી ૧ ॥
              </div>
              <div style={{ fontWeight: '700', fontSize: '10px', color: '#4b5563' }}>
                શ્રી ગણેશાય નમઃ
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '9.5px', lineHeight: 1.5 }}>
              <div><b>માર્ગેશ પોલારા</b> - 88664 71567</div>
              <div><b>માર્ગેશ પોલારા</b> - 88664 71567</div>
            </div>
          </div>

          {/* Company name — full-width double-rule banner */}
          <div style={{
            padding: '24px 16px',
            borderBottom: '1px solid #d1d5db',
            textAlign: 'center',
            borderTop: '3px double #111',
          }}>
            <div style={{
              borderTop: '1px solid #111',
              borderBottom: '1px solid #111',
              padding: '32px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
            }}>
              <span style={{
                fontSize: '44px',
                fontWeight: '500',
                letterSpacing: '6px',
                lineHeight: 1,
                display: 'block',
              }}>
                &nbsp;ખાતા કેન્દ્ર&nbsp;
              </span>
            </div>
          </div>

          {/* Address + Bill number */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
          }}>
            <div style={{ fontWeight: '600', fontSize: '13px' }}>
              ૧, રામનગર સોસાયટી, સીમાડા ગામ, સુરત.
            </div>
            <div style={{
              border: '2px solid #111',
              borderRadius: '20px',
              padding: '3px 18px',
              fontWeight: 'bold',
              fontSize: '14px',
              backgroundColor: '#f8fafc',
              letterSpacing: '0.3px',
            }}>
              બિલ નં. {billDetails.billNumber}
            </div>
          </div>
        </div>

        {/* ══════════ CLIENT DETAILS ══════════ */}
        <div style={{ padding: '8px 14px' }}>
          <div style={{
            border: '1.5px solid #374151',
            borderRadius: '14px',
            padding: '10px 16px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '6px 24px' }}>
              {/* Row 1 */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>નામ:</span>
                <span style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px dotted #6b7280', flex: 1, paddingLeft: '4px' }}>
                  {clientDetails.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>ID:</span>
                <span style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px dotted #6b7280', flex: 1, paddingLeft: '4px', textAlign: 'center' }}>
                  {clientDetails.nicName}
                </span>
              </div>
              {/* Row 2 */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>સાઈટ:</span>
                <span style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px dotted #6b7280', flex: 1, paddingLeft: '4px' }}>
                  {clientDetails.site}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>તારીખ:</span>
                <span style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px dotted #6b7280', flex: 1, paddingLeft: '4px', textAlign: 'center' }}>
                  {formatLocalDate(billDetails.billDate, 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN TABLE ══════════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#111', color: '#fff' }}>
              {[
                { label: 'આ. તારીખ થી જમા તારીખ', w: '32%' },
                { label: 'જમા / ઉધાર', w: '15%' },
                { label: 'ચાલુ નંગ', w: '14%' },
                { label: 'ભાવ', w: '11%' },
                { label: 'દિવસ', w: '10%' },
                { label: 'રકમ', w: '18%' },
              ].map(({ label, w }) => (
                <th key={label} style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  border: '1px solid #374151',
                  width: w,
                  letterSpacing: '0.2px',
                }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>

            {/* Previous bill row */}
            {previousBill && previousBill.amount > 0 && (
              <tr style={{ backgroundColor: '#fff5f5' }}>
                <td colSpan={5} style={C.prevBillLabel}>
                  ⚠ અગાઉનું બિલ #{previousBill.billNumber} બાકી
                </td>
                <td style={C.prevBillAmt}>
                  {formatIndianCurrency(previousBill.amount)}
                </td>
              </tr>
            )}

            {/* Rental rows */}
            {(() => {
              // Pre-calculate subtotals for each size group (shuttering vs jack size)
              const groupSubtotals: Record<string, number> = {};
              const groupIsJack: Record<string, boolean> = {};
              const groupSizeLabel: Record<string, string> = {};

              // Find all visible charges and populate subtotal mapping
              const visibleCharges = rentalCharges.filter((charge, idx) => {
                const { skip } = computeRentalRow(
                  charge, idx, rentalCharges, billDetails.fromDate, billDetails.toDate
                );
                return !skip;
              });

              visibleCharges.forEach(charge => {
                const hasSize = charge.size && charge.size !== 'All';
                const isJack = hasSize;

                // Group key is 'shuttering' or the specific jack sizeId
                const key = isJack ? String(charge.sizeId || charge.size) : 'shuttering';
                
                groupSubtotals[key] = (groupSubtotals[key] || 0) + (charge.amount || 0);
                groupIsJack[key] = isJack;
                if (hasSize) {
                  groupSizeLabel[key] = charge.size;
                }
              });

              // Now map and render the visible charges
              const renderedRows: React.ReactNode[] = [];

              visibleCharges.forEach((charge, idx) => {
                const { udharQty, jamaQty } = computeRentalRow(
                  charge, rentalCharges.indexOf(charge), rentalCharges, billDetails.fromDate, billDetails.toDate
                );

                const rowStartDate = charge.startDate ? safeParseLocalDate(charge.startDate) : safeParseLocalDate(billDetails.fromDate);
                const rowEndDate = charge.endDate ? safeParseLocalDate(charge.endDate) : safeParseLocalDate(billDetails.toDate);
                const displayEndDate = charge.days === 0 
                  ? rowEndDate 
                  : new Date(rowEndDate.getFullYear(), rowEndDate.getMonth(), rowEndDate.getDate() - 1);
                const isZero = charge.pieces === 0 && charge.days === 0;

                const hasSize = charge.size && charge.size !== 'All';
                const effectiveRate = charge.rate || billDetails.dailyRent;
                const isJackRow = hasSize;

                const key = isJackRow ? String(charge.sizeId || charge.size) : 'shuttering';
                
                // Color configuration
                const bg = isJackRow
                  ? (idx % 2 === 0 ? '#faf5ff' : '#f3e8ff')
                  : (idx % 2 === 0 ? '#fff' : '#f9fafb');

                const topBorder = '1px solid #d1d5db';

                const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
                  ...BASE_CELL,
                  borderTop: topBorder,
                  ...extra,
                });

                renderedRows.push(
                  <tr key={`rent-${idx}`} style={{ backgroundColor: bg }}>
                    <td style={cellStyle({ fontWeight: '600', textAlign: 'center' })}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div>
                          {charge.days === 0
                            ? formatLocalDate(displayEndDate, 'dd/MM/yyyy')
                            : <>{formatLocalDate(rowStartDate, 'dd/MM/yyyy')} થી {formatLocalDate(displayEndDate, 'dd/MM/yyyy')}</>
                          }
                        </div>
                        {hasSize && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                            <span style={{
                              backgroundColor: isJackRow ? '#7c3aed' : '#374151',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              padding: '1px 6px',
                              borderRadius: '999px',
                            }}>
                              {isJackRow ? '⚙ ' : ''}{charge.size}
                            </span>
                            {isJackRow && (
                              <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: '600' }}>(જેક)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={cellStyle({ textAlign: 'center', lineHeight: 1.5 })}>
                      {(charge.udharDetails && charge.udharDetails.length > 1)
                        ? charge.udharDetails.map((d, i) => <div key={i} style={{ color: '#dc2626', fontWeight: 'bold' }}>+{d.qty}</div>)
                        : udharQty > 0 && <div style={{ color: '#dc2626', fontWeight: 'bold' }}>+{udharQty}</div>
                      }
                      {(charge.jamaDetails && charge.jamaDetails.length > 1)
                        ? charge.jamaDetails.map((d, i) => <div key={i} style={{ color: '#16a34a', fontWeight: 'bold' }}>-{d.qty}</div>)
                        : jamaQty > 0 && <div style={{ color: '#16a34a', fontWeight: 'bold' }}>-{jamaQty}</div>
                      }
                      {udharQty === 0 && jamaQty === 0
                        && !(charge.udharDetails?.length) && !(charge.jamaDetails?.length)
                        && <span style={{ color: '#9ca3af' }}>—</span>
                      }
                    </td>
                    <td style={cellStyle({
                      textAlign: 'center',
                      fontWeight: isZero ? '900' : '700',
                      fontSize: '14px',
                      color: isZero ? '#dc2626' : '#111',
                    })}>
                      {charge.pieces}
                    </td>
                    <td style={cellStyle({
                      textAlign: 'center',
                      fontWeight: '600',
                      color: isJackRow && !isZero ? '#7c3aed' : '#4b5563',
                      background: isJackRow && !isZero ? 'rgba(124,58,237,0.07)' : undefined,
                    })}>
                      {isZero ? '—' : effectiveRate}
                    </td>
                    <td style={cellStyle({ textAlign: 'center', fontWeight: '600', color: '#4b5563' })}>
                      {isZero ? '—' : charge.days}
                    </td>
                    <td style={cellStyle({
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: isJackRow && !isZero ? '#7c3aed' : '#111',
                    })}>
                      {isZero ? '—' : formatIndianCurrency(Math.round(charge.amount))}
                    </td>
                  </tr>
                );

                // Detect group change or end of list to inject the subtotal row
                const nextCharge = idx < visibleCharges.length - 1 ? visibleCharges[idx + 1] : null;
                const nextHasSize = nextCharge?.size && nextCharge.size !== 'All';
                const nextRate = nextCharge ? (nextCharge.rate || billDetails.dailyRent) : billDetails.dailyRent;
                const nextIsJack = nextHasSize && nextRate !== billDetails.dailyRent;
                const nextKey = nextCharge ? (nextIsJack ? String(nextCharge.sizeId || nextCharge.size) : 'shuttering') : null;

                if (!nextKey || nextKey !== key) {
                  // End of the group!
                  const subtotalValue = groupSubtotals[key] || 0;
                  const isLastGroup = !nextKey;
                  const subtotalBg = isJackRow ? '#faf5ff' : '#ffffff';

                  renderedRows.push(
                    <tr key={`subtotal-${key}`} style={{ backgroundColor: subtotalBg, fontWeight: 'bold' }}>
                      <td colSpan={5} style={{
                        ...BASE_CELL,
                        borderTop: '1.5px solid #111',
                        borderBottom: isLastGroup ? '1.5px solid #111' : '3px solid #111',
                        padding: '9px 12px',
                        textAlign: 'right',
                        fontSize: '13.5px',
                        color: isJackRow ? '#7c3aed' : '#1f2937',
                      }}>
                        {isJackRow
                          ? `કુલ જેક ભાડું (સાઈઝ: ${groupSizeLabel[key] || ''}):`
                          : 'કુલ શટરિંગ ભાડું (કમ્બાઈન):'
                        }
                      </td>
                      <td style={{
                        ...BASE_CELL,
                        borderTop: '1.5px solid #111',
                        borderBottom: isLastGroup ? '1.5px solid #111' : '3px solid #111',
                        padding: '9px 12px',
                        textAlign: 'center',
                        fontWeight: '800',
                        fontSize: '15px',
                        color: isJackRow ? '#7c3aed' : '#111',
                      }}>
                        {formatIndianCurrency(Math.round(subtotalValue))}
                      </td>
                    </tr>
                  );
                }
              });

              return renderedRows;
            })()}

            {/* Extra costs rows */}
            {extraCosts.map((cost, index) => (
              <tr key={`extra-${index}`} style={{ backgroundColor: '#fffbeb' }}>
                <td colSpan={5} style={C.extraDesc}>
                  {cost.description}
                  {(cost.description === 'સર્વિસ ચાર્જ' || cost.description === 'Service Charge') && cost.pieces && cost.rate && (
                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                      ({cost.pieces} × {cost.rate})
                    </span>
                  )}
                </td>
                <td style={C.amount}>
                  {formatIndianCurrency(cost.amount)}
                </td>
              </tr>
            ))}

          </tbody>
        </table>

        {/* ══════════ PAYMENTS ══════════ */}
        {payments.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginBottom: '6px', borderBottom: '1.5px solid #374151', paddingBottom: '4px' }}>
              ✓ ચુકવણી વિગત
            </div>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding: '3px 0', width: '22%', color: '#4b5563' }}>
                      {formatLocalDate(p.date, 'dd/MM/yyyy')}
                    </td>
                    <td style={{ padding: '3px 0', color: '#374151' }}>
                      {p.method}{p.note ? ` (${p.note})` : ''}
                    </td>
                    <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold', color: '#15803d', fontSize: '14px' }}>
                      {formatIndianCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Main note */}
        {mainNote && (
          <div style={{ padding: '6px 16px 8px', fontSize: '13px', color: '#4b5563', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontWeight: 'bold', color: '#111' }}>નોંધ: </span>{mainNote}
          </div>
        )}

        {/* ══════════ FOOTER ══════════ */}
        <div style={{ borderTop: '2px solid #111', display: 'flex' }}>

          {/* Left: note + signatures */}
          <div style={{ flex: '0 0 62%', padding: '12px 16px', borderRight: '2px solid #111', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#b91c1c' }}>
              ⚠ નોંધ: આ બીલ મળ્યા પછી તરત જ બીલ ચુકવવાનું રહેશે.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              {['લેનારની સહી', 'આપનારની સહી'].map(label => (
                <div key={label} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>
                  <div style={{ borderTop: '1px solid #374151', paddingTop: '4px', width: '140px' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: totals */}
          <div style={{ flex: '0 0 38%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '13.5px' }}>
                    કુલ ભાડું:
                  </td>
                  <td style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', fontSize: '14.5px' }}>
                    {formatIndianCurrency(Math.round(summary.totalRent))}
                  </td>
                </tr>
                {summary.serviceCharge > 0 && (
                  <tr>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '13.5px' }}>
                      સર્વિસ ચાર્જ:
                    </td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', fontSize: '14.5px' }}>
                      {formatIndianCurrency(Math.round(summary.serviceCharge))}
                    </td>
                  </tr>
                )}
                {summary.totalExtraCosts > 0 && (
                  <tr>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '13.5px' }}>
                      વધારાનો ખર્ચ:
                    </td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', fontSize: '14.5px' }}>
                      {formatIndianCurrency(Math.round(summary.totalExtraCosts))}
                    </td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1.5px solid #111', fontWeight: '700', fontSize: '14px' }}>
                    કુલ રકમ:
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1.5px solid #111', textAlign: 'right', fontWeight: '800', fontSize: '15.5px' }}>
                    {formatIndianCurrency(Math.round(summary.grandTotal))}
                  </td>
                </tr>
                {summary.totalPaid > 0 && (
                  <tr>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '14px', color: '#15803d' }}>
                      ચુકવેલ:
                    </td>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#15803d' }}>
                      -{formatIndianCurrency(Math.round(summary.totalPaid))}
                    </td>
                  </tr>
                )}
                {summary.discounts > 0 && (
                  <tr>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '14px' }}>
                      કસર:
                    </td>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#b45309' }}>
                      -{formatIndianCurrency(Math.round(summary.discounts))}
                    </td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#fee2e2' }}>
                  <td style={{ padding: '13px 14px', borderTop: '2.5px solid #111', fontWeight: '900', fontSize: '18px', color: '#b91c1c' }}>
                    બાકી:
                  </td>
                  <td style={{ padding: '13px 14px', borderTop: '2.5px solid #111', textAlign: 'right', fontWeight: '900', fontSize: '21px', color: '#b91c1c' }}>
                    {formatIndianCurrency(Math.round(summary.duePayment))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Promo line */}
      <div style={{ textAlign: 'center', marginTop: '3px', fontSize: '11px', color: '#9ca3af' }}>
        Custom billing software → 8866471567
      </div>
    </div>
  );
};

export default memo(BillInvoiceTemplate);
