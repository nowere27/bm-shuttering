// Read-only Konva renderer for a single resolved page. Used both for the
// editor's live preview and for offscreen PDF export, so what you design is
// exactly what you export.

import React, { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect } from 'react-konva';
import type Konva from 'konva';
import { RenderPage, TextStyle } from '../../utils/challanDesign/types';

export function useHtmlImage(url: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = 'anonymous'; // keep the canvas untainted for toDataURL
    image.onload = () => setImg(image);
    image.src = url;
    return () => {
      image.onload = null;
    };
  }, [url]);
  return img;
}

export function fontStyleString(s: TextStyle): string {
  const parts: string[] = [];
  if (s.italic) parts.push('italic');
  if (s.bold) parts.push('bold');
  return parts.join(' ') || 'normal';
}

interface DesignStageProps {
  backgroundUrl: string | null;
  naturalWidth: number;
  naturalHeight: number;
  page: RenderPage;
  width: number; // rendered pixel width
  onReady?: () => void;
}

const DesignStage = React.forwardRef<Konva.Stage, DesignStageProps>(function DesignStage(
  { backgroundUrl, naturalWidth, naturalHeight, page, width, onReady },
  ref,
) {
  const img = useHtmlImage(backgroundUrl);
  const aspect = naturalWidth && naturalHeight ? naturalHeight / naturalWidth : 1.4142;
  const height = width * aspect;

  useEffect(() => {
    if (img && onReady) onReady();
  }, [img, onReady]);

  const px = (fracW: number) => fracW * width;
  const py = (fracH: number) => fracH * height;

  return (
    <Stage ref={ref} width={width} height={height}>
      <Layer>
        {img ? (
          <KonvaImage image={img} x={0} y={0} width={width} height={height} listening={false} />
        ) : (
          <Rect x={0} y={0} width={width} height={height} fill="#ffffff" listening={false} />
        )}

        {page.fields.map((f) => (
          <KonvaText
            key={f.id}
            text={f.text}
            x={px(f.x)}
            y={py(f.y)}
            width={px(f.w) || undefined}
            fontSize={py(f.style.fontSize)}
            fontFamily={f.style.fontFamily}
            fontStyle={fontStyleString(f.style)}
            fill={f.style.fill}
            align={f.style.align}
            listening={false}
          />
        ))}

        {page.rows.map((row, ri) =>
          row.cells.map((cell, ci) => (
            <KonvaText
              key={`${ri}-${ci}`}
              text={cell.text}
              x={px(cell.x)}
              y={py(row.y)}
              width={px(cell.w) || undefined}
              fontSize={py(cell.style.fontSize)}
              fontFamily={cell.style.fontFamily}
              fontStyle={fontStyleString(cell.style)}
              fill={cell.style.fill}
              align={cell.style.align}
              listening={false}
            />
          )),
        )}
      </Layer>
    </Stage>
  );
});

export default DesignStage;
