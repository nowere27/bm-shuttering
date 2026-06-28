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

const BillInvoiceTemplate: React.FC<BillInvoiceProps> = ({
  companyDetails, // Now used
  billDetails,
  clientDetails,
  rentalCharges,
  extraCosts, // Now used
  discounts, // Now used
  payments, // Now used
  summary,
  mainNote, // Now used
  previousBill, // New prop
}) => {
  return (
    <div className="invoice-container" style={{
      padding: '30px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '"Arya", "Noto Sans Gujarati", sans-serif',
      backgroundColor: '#fff',
      color: '#000'
    }}>
      <div style={{ border: '2px solid #000', padding: '0', position: 'relative', minHeight: '900px', display: 'flex', flexDirection: 'column' }}>

        {/* ... (Header and Client details remain same) ... */}

        {/* Header Section */}
        <div style={{ borderBottom: '2px solid #000', padding: '15px' }}>
          {/* Top Row: Contact Info & Religious Text */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            {/* Left */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              પરષોત્તમભાઈ પોલરા<br />
              (રૂપાવટીવાળા)
            </div>

            {/* Center */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              શ્રી ૧ા<br />
              શ્રી ગણેશાય નમઃ
            </div>

            {/* Right */}
            <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
              સુરેશભાઈ પોલરા - ૯૩૨૮૭ ૨૮૨૨૮<br />
              હરેશભાઈ ઠુંમર - ૯૭૩૭૯ ૧૨૫૧૬<br />
              હરેશભાઈ પોલરા - ૯૦૯૯૨ ૬૪૪૩૬
            </div>
          </div>

          {/* Main Title Row - Single Capsule Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '10px auto',
            width: '100%'
          }}>
            <div style={{
              border: '2px solid #000',
              borderRadius: '50px',
              padding: '10px 40px',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '700px',
              backgroundColor: '#fff'
            }}>
              <span style={{ fontSize: '44px', fontWeight: 'bold' }}>ખાતા કેન્દ્ર</span>
            </div>
          </div>

          {/* Bottom Address/Info Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', marginTop: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              ૧૦, અજમલધામ સોસાયટી, સીમાડા ગામ, સુરત.
            </div>
            <div style={{ border: '2px solid #000', borderRadius: '15px', padding: '2px 15px', fontWeight: 'bold', fontSize: '14px' }}>
              બિલ નંબર : {billDetails.billNumber}
            </div>
          </div>
        </div>

        {/* Client Details Section */}
        <div style={{ padding: '5px 15px' }}>
          <div style={{ border: '2px solid #000', padding: '8px', borderRadius: '20px' }}>
            {/* Row 1: Name & ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', width: '70%', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}>નામ:</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, marginLeft: '5px', fontWeight: 'bold', fontSize: '16px', paddingLeft: '5px' }}>
                  {clientDetails.name}
                </span>
              </div>
              <div style={{ display: 'flex', width: '25%', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}>ID:</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, marginLeft: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                  {clientDetails.nicName}
                </span>
              </div>
            </div>

            {/* Row 2: Site & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '70%', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}>સાઈટ:</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, marginLeft: '5px', fontWeight: 'bold', fontSize: '16px', paddingLeft: '5px' }}>
                  {clientDetails.site}
                </span>
              </div>
              <div style={{ display: 'flex', width: '25%', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}>તારીખ:</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, marginLeft: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                  {format(new Date(billDetails.billDate), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="rental-section" style={{ padding: '0', flex: 1 }}>
          <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#000', color: '#fff' }}>
                <th style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>આ. તારીખ થી જમા તારીખ</th>
                <th style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>જમા/ઉધાર</th>
                <th style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>ચાલુ નંગ</th>
                <th style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>ભાવ</th>
                <th style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>દિવસ</th>
                <th style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>રકમ</th>
              </tr>
            </thead>
            <tbody>
              {/* Previous Bill Row */}
              {previousBill && previousBill.amount > 0 && (
                <tr style={{ backgroundColor: '#fff' }}>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>
                    અગાઉનું બિલ #{previousBill.billNumber} બાકી
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>-</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>-</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>-</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>-</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>
                    {formatIndianCurrency(previousBill.amount)}
                  </td>
                </tr>
              )}

              {/* Rental Charges */}
              {rentalCharges.map((charge, index) => {
                const rowStartDate = charge.startDate ? new Date(charge.startDate) : new Date(billDetails.fromDate);
                const rowEndDate = charge.endDate ? new Date(charge.endDate) : new Date(billDetails.toDate);

                // Use provided udharQty/jamaQty if available (from billing calculation)
                let udharQty = 0;
                let jamaQty = 0;

                if (charge.udharQty !== undefined || charge.jamaQty !== undefined) {
                  // Direct use of individual quantities from billing calculation
                  udharQty = charge.udharQty || 0;
                  jamaQty = charge.jamaQty || 0;
                } else {
                  // Fallback: calculate from transaction type and matching
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

                  if (isJama && matchingCharge) {
                    return null;
                  }

                  const matchingQty = matchingCharge ? (matchingCharge.txnQty || Math.abs(matchingCharge.pieces - (rentalCharges.findIndex(c => c === matchingCharge) > 0 ? rentalCharges[rentalCharges.findIndex(c => c === matchingCharge) - 1].pieces : 0))) : 0;

                  udharQty = isJama ? matchingQty : currentQty;
                  jamaQty = isJama ? currentQty : matchingQty;
                }

                const isZeroBalance = charge.pieces === 0 && charge.days === 0;

                return (
                  <tr key={`rent-${index}`}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                      {charge.days === 0
                        ? format(rowEndDate, 'dd/MM/yyyy')
                        : <>{format(rowStartDate, 'dd/MM/yyyy')} થી {format(rowEndDate, 'dd/MM/yyyy')}</>
                      }
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                      {/* Multiple udhar challans on same day → one line per challan */}
                      {(charge.udharDetails && charge.udharDetails.length > 1)
                        ? charge.udharDetails.map((d, i) => (
                          <div key={`ud-${i}`} style={{ color: '#dc2626' }}>+{d.qty}</div>
                        ))
                        : udharQty > 0 && <div style={{ color: '#dc2626' }}>+{udharQty}</div>
                      }
                      {/* Multiple jama challans on same day → one line per challan */}
                      {(charge.jamaDetails && charge.jamaDetails.length > 1)
                        ? charge.jamaDetails.map((d, i) => (
                          <div key={`jd-${i}`} style={{ color: '#16a34a' }}>-{d.qty}</div>
                        ))
                        : jamaQty > 0 && <div style={{ color: '#16a34a' }}>-{jamaQty}</div>
                      }
                      {udharQty === 0 && jamaQty === 0
                        && !(charge.udharDetails?.length) && !(charge.jamaDetails?.length)
                        && <span style={{ color: '#6b7280' }}>-</span>
                      }
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: isZeroBalance ? '800' : '600', color: isZeroBalance ? '#dc2626' : undefined }}>
                      {charge.pieces}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                      {isZeroBalance ? '-' : (charge.rate || billDetails.dailyRent)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                      {isZeroBalance ? '-' : charge.days}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                      {isZeroBalance ? '-' : formatIndianCurrency(Math.round(charge.amount))}
                    </td>
                  </tr>
                );
              }).filter(Boolean)}

              {/* Extra Costs */}
              {extraCosts.length > 0 && (
                <>

                  {extraCosts.map((cost, index) => (
                    <tr key={`extra-${index}`}>
                      <td colSpan={5} style={{ border: '1px solid #000', padding: '8px 12px' }}>
                        <span style={{ fontWeight: '600' }}>{cost.description}</span>
                        {/* Hide date for Service Charge */}
                        {/* Date removed as per request */}
                        {/* Show Qty X Rate for Service Charge */}
                        {(cost.description === "સર્વિસ ચાર્જ" || cost.description === "Service Charge") && cost.pieces && cost.rate && (
                          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '10px' }}>({cost.pieces} X {cost.rate})</span>
                        )}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: '600' }}>{formatIndianCurrency(cost.amount)}</td>
                    </tr>
                  ))}
                </>
              )}


            </tbody>
          </table>

          {/* Payments List (Displayed separately or in table? Let's verify standard practice. Usually payments are separate deduction list or just total. But user requested to REFLECT payment add it. So explicit list is good.) */}
          {payments.length > 0 && (
            <div style={{ marginTop: '20px', padding: '0 15px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '5px' }}>ચુકવણી વિગત</div>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={`pay-${index}`}>
                      <td style={{ padding: '4px 0' }}>{format(new Date(payment.date), 'dd/MM/yyyy')}</td>
                      <td style={{ padding: '4px 0' }}>{payment.method} {payment.note ? `(${payment.note})` : ''}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{formatIndianCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Main Note */}
          {mainNote && (
            <div style={{ marginTop: '20px', padding: '10px 15px', fontStyle: 'italic', color: '#4b5563' }}>
              <span style={{ fontWeight: 'bold' }}>નોંધ:</span> {mainNote}
            </div>
          )}

        </div>

        {/* Footer / Summary Area */}
        <div style={{ borderTop: '2px solid #000', display: 'flex', marginTop: 'auto' }}>
          {/* Left Side: Terms / Signature */}
          <div style={{ width: '65%', padding: '10px', borderRight: '2px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>
              નોંધ : આ બીલ મળ્યા પછી તરત જ બીલ ચુકવવાનું રહેશે.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                લેનારની સહી .....................
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                આપનારની સહી .....................
              </div>
            </div>

          </div>

          {/* Right Side: Totals */}
          <div style={{ width: '35%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>કુલ રકમ:</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '600', fontSize: '16px' }}>{formatIndianCurrency(Math.round(summary.grandTotal))}</td>
                </tr>

                {/* Add extra costs total if multiple? */}


                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#16a34a' }}>ચુકવેલ:</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '700', color: '#16a34a', fontSize: '16px' }}>{formatIndianCurrency(Math.round(summary.totalPaid))}</td>
                </tr>
                {summary.discounts > 0 && (
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>કસર:</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>-{formatIndianCurrency(Math.round(summary.discounts))}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#fee2e2' }}>
                  <td style={{ padding: '15px 12px', borderTop: '2px solid #000', fontWeight: '800', fontSize: '18px', color: '#dc2626' }}>બાકી રકમ:</td>
                  <td style={{ padding: '15px 12px', borderTop: '2px solid #000', textAlign: 'right', fontWeight: '800', fontSize: '20px', color: '#dc2626' }}>{formatIndianCurrency(Math.round(summary.duePayment))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>




      </div>

      {/* Promotional Footer - Outside the bill border */}
      <div style={{
        textAlign: 'center',
        padding: '4px 0',
        marginTop: '2px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#dc2626',
        letterSpacing: '0.5px',
        opacity: 0.6
      }}>
        કસ્ટમ બિલિંગ સોફ્ટવેર બનાવા સંપર્ક કરો - 8866471567
      </div>
    </div>
  );
};

export default BillInvoiceTemplate;