import { useEffect, useMemo, useRef } from "react";

import { Coord } from "../classes";
import { isWeb } from "../utils";

const GAP_SIZE = 4;

export function Matrix({
  dimensions,
  bg,
  highlightedCoords = [],
  outlinedCoords = [],
}: {
  dimensions?: {
    rows: number;
    columns: number;
  };
  bg?: boolean;
  highlightedCoords?: Coord[];
  outlinedCoords?: Coord[];
}) {
  const computedBodyStyle = window.getComputedStyle(document.body);
  const colorPrimary = computedBodyStyle.getPropertyValue("--color-primary");
  const colorSecondary = computedBodyStyle.getPropertyValue("--color-secondary");
  const bgOpacity = bg ? 0.1 : 0;
  // Tailwind sm:* breakpoint is set to 500px
  const cellSize = !isWeb() || window.matchMedia("(min-width: 500px)").matches ? 20 : 15;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // If dimensions aren't passed, fit matrix to highlighted coords
  const normalisedCoords: Coord[] = useMemo(
    () => (dimensions === undefined ? [] : highlightedCoords),
    [dimensions, highlightedCoords]
  );

  let adjustedColumns = dimensions?.columns ?? -1;
  let adjustedRows = dimensions?.rows ?? -1;

  if (dimensions === undefined) {
    const hasMinusY = highlightedCoords.some((coord) => coord.y < 0);

    highlightedCoords.forEach((coord) => {
      adjustedColumns = Math.max(adjustedColumns, coord.x);
      adjustedRows = Math.max(adjustedRows, coord.y);

      if (hasMinusY) {
        normalisedCoords.push(coord.clone().add({ y: 1 }));
      } else {
        normalisedCoords.push(coord);
      }
    });

    adjustedColumns += 1;
    adjustedRows += hasMinusY ? 2 : 1;
  }

  // Paint cells
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    // Scale for retina displays
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.translate(GAP_SIZE / 2, GAP_SIZE / 2);

    for (let row = 0; row < adjustedRows; row += 1) {
      for (let col = 0; col < adjustedColumns; col += 1) {
        const x = col * (cellSize + GAP_SIZE);
        const y = row * (cellSize + GAP_SIZE);

        const coord = Coord.fromIndex(row * adjustedColumns + col, {
          rows: adjustedRows,
          columns: adjustedColumns,
        });

        ctx.globalAlpha = coord.isIn([...normalisedCoords, ...outlinedCoords])
          ? 1
          : bgOpacity;
        ctx.fillStyle = `rgb(${colorSecondary})`;
        ctx.strokeStyle = `rgb(${colorPrimary})`;
        ctx.lineWidth = 1;

        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Center square
        if (!coord.isIn(outlinedCoords) || coord.isIn(normalisedCoords)) {
          const centerSquareDimensions = cellSize / 2;

          ctx.fillStyle = `rgb(${colorPrimary})`;
          ctx.fillRect(
            x + centerSquareDimensions / 2,
            y + centerSquareDimensions / 2,
            centerSquareDimensions,
            centerSquareDimensions
          );
        }
      }
    }

    return () => {
      ctx.restore();
    };
  }, [
    adjustedColumns,
    adjustedRows,
    bgOpacity,
    cellSize,
    colorPrimary,
    colorSecondary,
    normalisedCoords,
    outlinedCoords,
  ]);

  const canvasHeight = adjustedRows * (cellSize + GAP_SIZE);
  const canvasWidth = adjustedColumns * (cellSize + GAP_SIZE);

  return (
    <canvas
      ref={canvasRef}
      // Scale for retina displays
      height={Math.floor(canvasHeight * window.devicePixelRatio)}
      width={Math.floor(canvasWidth * window.devicePixelRatio)}
      style={{
        height: `${canvasHeight}px`,
        width: `${canvasWidth}px`,
      }}
    />
  );
}
