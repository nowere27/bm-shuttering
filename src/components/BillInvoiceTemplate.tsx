import React from 'react';
import { format } from 'date-fns';
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

const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  border: '1px solid #d1d5db',
  padding: '7px 10px',
  fontSize: '13px',
  ...extra,
});

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
      fontFamily: '"Arya", "Noto Sans Gujarati", Arial, sans-serif',
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
            alignItems: 'flex-start',
            padding: '10px 16px 8px',
            borderBottom: '1px solid #d1d5db',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', lineHeight: 1.6 }}>
              પરષોત્તમભાઈ પોલરા<br />
              <span style={{ fontWeight: '500', fontSize: '12px' }}>(રૂપાવટીવાળા)</span>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', lineHeight: 1.7 }}>
              ॥ શ્રી ૧ ॥<br />
              શ્રી ગણેશાય નમઃ
            </div>

            <div style={{ textAlign: 'right', fontSize: '12.5px', lineHeight: 1.8 }}>
              <div><b>માર્ગેશ પોલારા</b> - 88664 71567</div>
              <div><b>માર્ગેશ પોલારા</b> - 88664 71567</div>
            </div>
          </div>

          {/* Company name capsule */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 20px 8px',
            borderBottom: '1px solid #d1d5db',
          }}>
            <div style={{
              border: '2.5px solid #111',
              borderRadius: '50px',
              padding: '5px 70px',
            }}>
              <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '3px' }}>
                ખાતા કેન્દ્ર
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
                  {format(new Date(billDetails.billDate), 'dd/MM/yyyy')}
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
                <td colSpan={5} style={{ ...cell(), fontWeight: 'bold', color: '#b91c1c', fontSize: '13px' }}>
                  ⚠ અગાઉનું બિલ #{previousBill.billNumber} બાકી
                </td>
                <td style={{ ...cell({ textAlign: 'center', fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' }) }}>
                  {formatIndianCurrency(previousBill.amount)}
                </td>
              </tr>
            )}

            {/* Rental rows */}
            {rentalCharges.map((charge, index) => {
              const rowStartDate = charge.startDate ? new Date(charge.startDate) : new Date(billDetails.fromDate);
              const rowEndDate = charge.endDate ? new Date(charge.endDate) : new Date(billDetails.toDate);

              let udharQty = 0;
              let jamaQty = 0;

              if (charge.udharQty !== undefined || charge.jamaQty !== undefined) {
                udharQty = charge.udharQty || 0;
                jamaQty = charge.jamaQty || 0;
              } else {
                const isJama = charge.causeType === 'jama';
                const prevPieces = index > 0 ? rentalCharges[index - 1].pieces : 0;
                const stockChange = Math.abs(charge.pieces - prevPieces);
                const currentQty = charge.txnQty || stockChange || charge.pieces;
                const chargeStart = charge.startDate || billDetails.fromDate;
                const chargeEnd = charge.endDate || billDetails.toDate;

                const matchingCharge = rentalCharges.find((c, i) => {
                  if (i === index) return false;
                  const cStart = c.startDate || billDetails.fromDate;
                  const cEnd = c.endDate || billDetails.toDate;
                  return cStart === chargeStart && cEnd === chargeEnd && c.causeType !== charge.causeType;
                });

                if (isJama && matchingCharge) return null;

                const matchingIdx = matchingCharge ? rentalCharges.findIndex(c => c === matchingCharge) : -1;
                const matchingQty = matchingCharge
                  ? (matchingCharge.txnQty || Math.abs(matchingCharge.pieces - (matchingIdx > 0 ? rentalCharges[matchingIdx - 1].pieces : 0)))
                  : 0;

                udharQty = isJama ? matchingQty : currentQty;
                jamaQty = isJama ? currentQty : matchingQty;
              }

              const isZero = charge.pieces === 0 && charge.days === 0;
              const bg = index % 2 === 0 ? '#fff' : '#f9fafb';

              return (
                <tr key={`rent-${index}`} style={{ backgroundColor: bg }}>
                  <td style={{ ...cell({ textAlign: 'center', fontWeight: '600' }) }}>
                    {charge.days === 0
                      ? format(rowEndDate, 'dd/MM/yyyy')
                      : <>{format(rowStartDate, 'dd/MM/yyyy')} થી {format(rowEndDate, 'dd/MM/yyyy')}</>
                    }
                  </td>
                  <td style={{ ...cell({ textAlign: 'center', lineHeight: 1.5 }) }}>
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
                  <td style={{ ...cell({ textAlign: 'center', fontWeight: isZero ? '900' : '700', fontSize: '14px', color: isZero ? '#dc2626' : '#111' }) }}>
                    {charge.pieces}
                  </td>
                  <td style={{ ...cell({ textAlign: 'center', fontWeight: '600', color: '#4b5563' }) }}>
                    {isZero ? '—' : (charge.rate || billDetails.dailyRent)}
                  </td>
                  <td style={{ ...cell({ textAlign: 'center', fontWeight: '600', color: '#4b5563' }) }}>
                    {isZero ? '—' : charge.days}
                  </td>
                  <td style={{ ...cell({ textAlign: 'center', fontWeight: '700', fontSize: '14px' }) }}>
                    {isZero ? '—' : formatIndianCurrency(Math.round(charge.amount))}
                  </td>
                </tr>
              );
            }).filter(Boolean)}

            {/* Extra costs rows */}
            {extraCosts.map((cost, index) => (
              <tr key={`extra-${index}`} style={{ backgroundColor: '#fffbeb' }}>
                <td colSpan={5} style={{ ...cell({ fontWeight: '600' }) }}>
                  {cost.description}
                  {(cost.description === 'સર્વિસ ચાર્જ' || cost.description === 'Service Charge') && cost.pieces && cost.rate && (
                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                      ({cost.pieces} × {cost.rate})
                    </span>
                  )}
                </td>
                <td style={{ ...cell({ textAlign: 'center', fontWeight: '700', fontSize: '14px' }) }}>
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
                      {format(new Date(p.date), 'dd/MM/yyyy')}
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
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '14px' }}>
                    કુલ રકમ:
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', fontSize: '15px' }}>
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

export default BillInvoiceTemplate;
