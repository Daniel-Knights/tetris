import { exit } from "@tauri-apps/plugin-process";
import { MouseEvent, useEffect, useState } from "react";

import { useTheme } from "../hooks";
import { isDesktop } from "../utils/env";

type MenuItem = {
  label: string;
  onClick?: () => void;
  submenu?: MenuItem[];
};

export function PauseMenu({
  onResume,
  onRestart,
}: {
  onResume: () => void;
  onRestart: () => void;
}) {
  const { setTheme } = useTheme();

  const [selectedSubmenu, setSelectedSubmenu] = useState<MenuItem[] | null>(null);

  const backItem = {
    label: "BACK",
    onClick: () => setSelectedSubmenu(null),
  } satisfies MenuItem;

  const menuItems = [
    {
      label: "RESUME",
      onClick: () => onResume(),
    },
    {
      label: "THEME",
      submenu: [
        {
          label: "HACKERMAN",
          onClick: () => setTheme("hackerman"),
        },
        {
          label: "HANDHELD",
          onClick: () => setTheme("handheld"),
        },
        {
          label: "FLASHBANG",
          onClick: () => setTheme("flashbang"),
        },
      ],
    },
    {
      label: "RESTART",
      onClick: () => {
        onRestart();
      },
    },
  ] satisfies MenuItem[];

  if (isDesktop()) {
    menuItems.push({
      label: "QUIT",
      onClick: () => exit(),
    });
  }

  function handleClick(ev: MouseEvent) {
    const evTarget = ev.target as HTMLElement;

    // Close if click outside
    if (!evTarget.closest("[data-menu-content]")) {
      onResume();
    }
  }

  // Close on escape
  useEffect(() => {
    function handleKeyup(ev: KeyboardEvent) {
      if (ev.key !== "Escape") return;

      // If submenu open, go back instead of closing
      if (selectedSubmenu) {
        setSelectedSubmenu(null);

        return;
      }

      onResume();
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [onResume, selectedSubmenu]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="cursor-pointer fixed inset-0 flex items-center justify-center bg-primary"
      onClick={handleClick}
    >
      <div
        className="cursor-default flex justify-center p-4 h-96 w-96 max-w-[95vw] bg-secondary"
        data-menu-content
      >
        <ul className="flex flex-col justify-center items-center gap-4 text-2xl">
          {(selectedSubmenu ? selectedSubmenu.concat(backItem) : menuItems).map(
            ({ label, onClick, submenu }) => (
              <li key={label}>
                <button
                  className="w-64 h-12 bg-primary/75 text-secondary hover:bg-primary"
                  type="button"
                  onClick={() => {
                    if (onClick) {
                      onClick();
                    } else if (submenu) {
                      setSelectedSubmenu(submenu);
                    }
                  }}
                >
                  {label}
                </button>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
