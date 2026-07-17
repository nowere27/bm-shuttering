// Interactive editing canvas: drag fields, drag the two row guides to set row
// spacing, and drag column markers. Everything reads/writes fractions (0..1).

import React from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line } from 'react-konva';
import { BandColumn, DesignConfig, PlacedField, RowBand } from '../../utils/challanDesign/types';
import { fieldKeyLabel } from '../../utils/challanDesign/dataKeys';
import { fontStyleString, useHtmlImage } from './DesignStage';

export type Selection = { type: 'field' | 'column'; id: string } | null;

interface Props {
  backgroundUrl: string | null;
  naturalWidth: number;
  naturalHeight: number;
  config: DesignConfig;
  width: number;
  selection: Selection;
  onSelect: (sel: Selection) => void;
  onFieldMove: (id: string, x: number, y: number) => void;
  onBandChange: (patch: Partial<RowBand>) => void;
  onColumnMove: (id: string, x: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function fieldSampleText(f: PlacedField): string {
  if (f.key === 'literal') return f.staticText || 'Text';
  return fieldKeyLabel(f.key);
}

const DesignEditorCanvas: React.FC<Props> = ({
  backgroundUrl,
  naturalWidth,
  naturalHeight,
  config,
  width,
  selection,
  onSelect,
  onFieldMove,
  onBandChange,
  onColumnMove,
}) => {
  const img = useHtmlImage(backgroundUrl);
  const aspect = naturalWidth && naturalHeight ? naturalHeight / naturalWidth : 1.4142;
  const height = width * aspect;
  const band = config.band;

  const pxW = (frac: number) => frac * width;
  const pxH = (frac: number) => frac * height;

  const rowLines: number[] = [];
  if (band.enabled) {
    for (let i = 0; i < band.rowsPerPage; i++) rowLines.push(band.firstRowY + i * band.rowHeight);
  }
  const bandBottom = band.enabled ? pxH(band.firstRowY + Math.max(1, band.rowsPerPage - 1) * band.rowHeight) : 0;

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>
        {img ? (
          <KonvaImage image={img} x={0} y={0} width={width} height={height} listening={false} />
        ) : (
          <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" stroke="#cbd5e1" listening={false} />
        )}

        {/* Row band guides */}
        {band.enabled && (
          <>
            {rowLines.map((y, i) => (
              <Line
                key={`rl-${i}`}
                points={[0, pxH(y), width, pxH(y)]}
                stroke="#93c5fd"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            ))}

            {/* Column markers (draggable horizontally) */}
            {band.columns.map((col: BandColumn) => {
              const isSel = selection?.type === 'column' && selection.id === col.id;
              return (
                <React.Fragment key={col.id}>
                  <Line
                    points={[pxW(col.x), pxH(band.firstRowY), pxW(col.x), bandBottom]}
                    stroke={isSel ? '#dc2626' : '#f59e0b'}
                    strokeWidth={isSel ? 3 : 2}
                    hitStrokeWidth={14}
                    draggable
                    onMouseDown={() => onSelect({ type: 'column', id: col.id })}
                    onDragMove={(e) => {
                      // keep it vertical: only x moves
                      e.target.y(0);
                    }}
                    onDragEnd={(e) => {
                      const nx = clamp((pxW(col.x) + e.target.x()) / width, 0, 1);
                      e.target.position({ x: 0, y: 0 });
                      onColumnMove(col.id, nx);
                    }}
                  />
                  <KonvaText
                    text={col.field}
                    x={pxW(col.x) + 3}
                    y={pxH(band.firstRowY) - 16}
                    fontSize={12}
                    fill={isSel ? '#dc2626' : '#b45309'}
                    listening={false}
                  />
                </React.Fragment>
              );
            })}

            {/* Row 1 handle */}
            <Line
              points={[0, 0, width, 0]}
              y={pxH(band.firstRowY)}
              stroke="#2563eb"
              strokeWidth={3}
              hitStrokeWidth={14}
              draggable
              dragBoundFunc={(pos) => ({ x: 0, y: clamp(pos.y, 0, height) })}
              onDragEnd={(e) => onBandChange({ firstRowY: clamp(e.target.y() / height, 0, 1) })}
            />
            <KonvaText text="Row 1" x={4} y={pxH(band.firstRowY) + 2} fontSize={12} fill="#2563eb" listening={false} />

            {/* Row 2 handle -> sets rowHeight */}
            <Line
              points={[0, 0, width, 0]}
              y={pxH(band.firstRowY + band.rowHeight)}
              stroke="#16a34a"
              strokeWidth={3}
              hitStrokeWidth={14}
              draggable
              dragBoundFunc={(pos) => ({ x: 0, y: clamp(pos.y, 0, height) })}
              onDragEnd={(e) => {
                const rh = e.target.y() / height - band.firstRowY;
                onBandChange({ rowHeight: clamp(rh, 0.005, 1) });
              }}
            />
            <KonvaText
              text="Row 2 (spacing)"
              x={4}
              y={pxH(band.firstRowY + band.rowHeight) + 2}
              fontSize={12}
              fill="#16a34a"
              listening={false}
            />
          </>
        )}

        {/* Placed fields */}
        {config.fields.map((f) => {
          const isSel = selection?.type === 'field' && selection.id === f.id;
          const sample = fieldSampleText(f);
          const fontPx = pxH(f.style.fontSize);
          const boxW = f.w ? pxW(f.w) : Math.max(40, sample.length * fontPx * 0.55);
          const boxH = fontPx * 1.3;
          return (
            <React.Fragment key={f.id}>
              {isSel && (
                <Rect
                  x={pxW(f.x) - 2}
                  y={pxH(f.y) - 2}
                  width={boxW + 4}
                  height={boxH + 4}
                  stroke="#2563eb"
                  dash={[4, 3]}
                  listening={false}
                />
              )}
              <KonvaText
                text={sample}
                x={pxW(f.x)}
                y={pxH(f.y)}
                width={f.w ? boxW : undefined}
                fontSize={fontPx}
                fontFamily={f.style.fontFamily}
                fontStyle={fontStyleString(f.style)}
                fill={f.style.fill}
                align={f.style.align}
                draggable
                onMouseDown={() => onSelect({ type: 'field', id: f.id })}
                onTap={() => onSelect({ type: 'field', id: f.id })}
                onDragEnd={(e) => {
                  onFieldMove(
                    f.id,
                    clamp(e.target.x() / width, 0, 1),
                    clamp(e.target.y() / height, 0, 1),
                  );
                }}
              />
            </React.Fragment>
          );
        })}
      </Layer>
    </Stage>
  );
};

export default DesignEditorCanvas;
