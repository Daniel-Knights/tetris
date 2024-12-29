import { useEffect, useState } from "react";

export type Theme = "hackerman" | "handheld" | "flashbang";

function getTheme(): Theme {
  return (localStorage.getItem("theme") as Theme | null) ?? "hackerman";
}

document.body.setAttribute("data-theme", getTheme());

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme());

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
