import { Coord } from "../modules";

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
  const bgOpacity = bg ? "opacity-10" : "opacity-0";

  // If dimensions aren't passed, fit matrix to highlighted coords
  const normalisedCoords: Coord[] = dimensions === undefined ? [] : highlightedCoords;

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

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateRows: `repeat(${adjustedRows},20px)`,
        gridTemplateColumns: `repeat(${adjustedColumns},20px)`,
      }}
    >
      {Array.from({ length: adjustedRows * adjustedColumns }, (_, i) => {
        const coord = Coord.fromIndex(i, {
          rows: adjustedRows,
          columns: adjustedColumns,
        });

        return (
          <svg
            key={window.crypto.randomUUID()}
            className={
              coord.isIn([...normalisedCoords, ...outlinedCoords]) ? "" : bgOpacity
            }
            viewBox="0 0 20 20"
            height="20"
            width="20"
          >
            <path
              stroke="rgb(var(--color-primary))"
              fill="rgb(var(--color-secondary))"
              d="M.701.701H19.3V19.3H.7z"
            />
            {(!coord.isIn(outlinedCoords) || coord.isIn(normalisedCoords)) && (
              <path fill="rgb(var(--color-primary))" d="M5.35 5.35h9.3v9.3h-9.3z" />
            )}
          </svg>
        );
      })}
    </div>
  );
}

export default Matrix;
