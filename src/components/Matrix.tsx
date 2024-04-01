import { useEffect, useMemo, useRef } from "react";

import { Coord } from "../modules";

const CELL_SIZE = 20;
const GAP_SIZE = 4;

function Matrix({
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
}): JSX.Element {
  const computedBodyStyle = window.getComputedStyle(document.body);
  const colorPrimary = computedBodyStyle.getPropertyValue("--color-primary");
  const colorSecondary = computedBodyStyle.getPropertyValue("--color-secondary");
  const bgOpacity = bg ? 0.1 : 0;

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
        const x = col * (CELL_SIZE + GAP_SIZE);
        const y = row * (CELL_SIZE + GAP_SIZE);

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

        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        // Center square
        if (!coord.isIn(outlinedCoords) || coord.isIn(normalisedCoords)) {
          const centerSquareDimensions = CELL_SIZE / 2;

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
    colorPrimary,
    colorSecondary,
    normalisedCoords,
    outlinedCoords,
  ]);

  const canvasHeight = adjustedRows * (CELL_SIZE + GAP_SIZE);
  const canvasWidth = adjustedColumns * (CELL_SIZE + GAP_SIZE);

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

export default Matrix;
