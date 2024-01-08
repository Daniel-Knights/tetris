import GameBoard from "./components/GameBoard";
import StatBoard from "./components/StatBoard";

function App(): JSX.Element {
  return (
    <div className="grid grid-cols-[2fr_1fr] items-center justify-items-center h-full w-full bg-[#acb8a2] text-[#1e2424]">
      <GameBoard />
      <StatBoard />
    </div>
  );
}

export default App;
