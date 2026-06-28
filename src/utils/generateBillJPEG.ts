import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import BillInvoiceTemplate from '../components/BillInvoiceTemplate';

type BillInvoiceProps = React.ComponentProps<typeof BillInvoiceTemplate>;

export const generateBillJPEG = async (
  billNumber: string,
  billData: BillInvoiceProps
): Promise<void> => {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '-9999',
    width: '794px',
    backgroundColor: '#ffffff',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const root = createRoot(container);

  // flushSync forces React to render synchronously — no setTimeout needed
  flushSync(() => {
    root.render(React.createElement(BillInvoiceTemplate, billData));
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: container.scrollHeight,
      logging: false,
      windowWidth: 794,
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `Bill_${billNumber}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
