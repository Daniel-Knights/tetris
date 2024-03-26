import { exit } from "@tauri-apps/api/process";
import { MouseEvent, useEffect } from "react";

function Menu({
  onClose,
  onRestart,
}: {
  onClose: (isRestart?: boolean) => void;
  onRestart: () => void;
}) {
  const menuItems = [
    {
      label: "RESUME",
      onClick: () => onClose(),
    },
    {
      label: "THEME",
      onClick: () => {
        if (document.body.hasAttribute("data-theme")) {
          document.body.removeAttribute("data-theme");
        } else {
          document.body.setAttribute("data-theme", "hackerman");
        }
      },
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
  ];

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
      if (ev.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [onClose]);

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
          {menuItems.map(({ label, onClick }) => (
            <li key={label}>
              <button
                className="w-64 h-12 bg-primary/75 text-secondary hover:bg-primary"
                type="button"
                onClick={() => onClick()}
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
