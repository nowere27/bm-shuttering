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
    // Position off-screen to the left so it never flashes on mobile,
    // and is not affected by the page's scroll position.
    position: 'absolute',
    top: '0',
    left: '-9999px',
    zIndex: '-1',
    width: '794px',
    backgroundColor: '#ffffff',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const root = createRoot(container);

  flushSync(() => {
    root.render(React.createElement(BillInvoiceTemplate, billData));
  });

  // Wait for all fonts (Noto Sans Gujarati etc.) to fully load before
  // capturing — without this, html2canvas may render with a fallback font
  // that has different metrics, causing text to shift inside cells.
  await document.fonts.ready;

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
      // Scroll offset must be 0/0 for an absolutely-positioned off-screen
      // element so html2canvas reads it at its true document position.
      scrollX: 9999,   // cancel the -9999px left offset
      scrollY: 0,
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
