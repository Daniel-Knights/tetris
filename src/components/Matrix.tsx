import { Coord } from "../modules";

function Matrix({
  rows,
  columns,
  bg,
  highlightedCoords = [],
  outlinedCoords = [],
}: {
  rows: number;
  columns: number;
  bg?: boolean;
  highlightedCoords?: Coord[];
  outlinedCoords?: Coord[];
}): JSX.Element {
  const bgOpacity = bg ? "opacity-20" : "opacity-0";

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateRows: `repeat(${rows},20px)`,
        gridTemplateColumns: `repeat(${columns},20px)`,
      }}
    >
      {Array.from({ length: rows * columns }, (_, i) => {
        const coord = Coord.fromIndex(i, { rows, columns });

        return (
          <span
            key={window.crypto.randomUUID()}
            className={`inline-flex justify-center items-center border border-primary before:h-[10px] before:w-[10px] ${
              coord.isIn(outlinedCoords) && !coord.isIn(highlightedCoords)
                ? ""
                : "before:bg-primary"
            } ${coord.isIn([...highlightedCoords, ...outlinedCoords]) ? "" : bgOpacity}`}
          />
        );
      })}
    </div>
  );
}

export default Matrix;
