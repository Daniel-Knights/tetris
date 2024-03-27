import { exit } from "@tauri-apps/api/process";
import { MouseEvent, useEffect, useState } from "react";

import { useTheme } from "../modules";

type MenuItem = {
  label: string;
  onClick?: () => void;
  submenu?: MenuItem[];
};

function Menu({
  onClose,
  onRestart,
}: {
  onClose: (isRestart?: boolean) => void;
  onRestart: () => void;
}) {
  const { setTheme } = useTheme();

  const menuItems = [
    {
      label: "RESUME",
      onClick: () => onClose(),
    },
    {
      label: "THEME",
      submenu: [
        {
          label: "DEFAULT",
          onClick: () => setTheme("default"),
        },
        {
          label: "HACKERMAN",
          onClick: () => setTheme("hackerman"),
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
        onClose(true);
        onRestart();
      },
    },
    {
      label: "QUIT",
      onClick: () => exit(),
    },
  ] satisfies MenuItem[];

  const [selectedSubmenu, setSelectedSubmenu] = useState<MenuItem[] | null>(null);

  function handleClick(ev: MouseEvent) {
    const evTarget = ev.target as HTMLElement;

    // Close if click outside
    if (!evTarget.closest("[data-menu-content]")) {
      onClose();
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

      onClose();
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [onClose, selectedSubmenu]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="cursor-pointer fixed inset-0 flex items-center justify-center bg-primary"
      onClick={handleClick}
    >
      <div
        className="cursor-default flex justify-center p-4 h-96 w-96 bg-secondary"
        data-menu-content
      >
        <ul className="flex flex-col justify-center items-center gap-4 text-2xl">
          {(selectedSubmenu ?? menuItems).map(({ label, onClick, submenu }) => (
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
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Menu;
