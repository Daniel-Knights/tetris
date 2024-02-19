function Matrix({
  rows,
  columns,
  highlightedIndices = [],
  outlinedIndices = [],
}: {
  rows: number;
  columns: number;
  highlightedIndices: number[];
  outlinedIndices: number[];
}): JSX.Element {
  return (
    <div
      className="grid gap-1 py-4 border-y border-primary"
      style={{
        gridTemplateRows: `repeat(${rows},20px)`,
        gridTemplateColumns: `repeat(${columns},20px)`,
      }}
    >
      {Array(rows * columns)
        .fill(null)
        .map((_, i) => (
          <span
            key={window.crypto.randomUUID()}
            className={`inline-flex justify-center items-center border border-primary before:h-[10px] before:w-[10px] ${
              outlinedIndices.includes(i) && !highlightedIndices.includes(i)
                ? ""
                : "before:bg-primary"
            } ${
              [...highlightedIndices, ...outlinedIndices].includes(i) ? "" : "opacity-20"
            }`}
          />
        ))}
    </div>
  );
}

export default Matrix;
