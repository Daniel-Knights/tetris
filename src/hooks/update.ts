import * as dialog from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, Update } from "@tauri-apps/plugin-updater";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { isDesktop } from "../utils";

export function useUpdate(pause: () => void) {
  const [updateIsDownloading, setUpdateIsDownloading] = useState(false);

  const isCheckingUpdate = useRef(false);

  useEffect(() => {
    if (isCheckingUpdate.current || !isDesktop()) return;

    isCheckingUpdate.current = true;

    (async () => {
      const update = await check();
      if (!update) return;

      const newVersion = update.version;

      // Check if the user has already been notified
      const seenVersion = localStorage.getItem("updateSeen");
      if (seenVersion === newVersion) return;

      pause();

      const shouldInstall = await dialog.ask(
        "A new version of Tetris is available.\nDo you want to update now?",
        `Update available: v${newVersion}`
      );

      if (shouldInstall) {
        await updateAndRelaunch(update, setUpdateIsDownloading);
      } else {
        localStorage.setItem("updateSeen", newVersion);
      }
    })().finally(() => {
      isCheckingUpdate.current = false;
    });
  }, [isCheckingUpdate, pause]);

  return { updateIsDownloading };
}

async function updateAndRelaunch(
  update: Update,
  setUpdateIsDownloading: Dispatch<SetStateAction<boolean>>
) {
  setUpdateIsDownloading(true);

  try {
    await update.downloadAndInstall();
    await relaunch();
  } catch (error) {
    console.error(error);

    const shouldRetry = await dialog.ask("Try again?", {
      title: "Unable to install update",
      kind: "error",
    });

    if (shouldRetry) {
      await updateAndRelaunch(update, setUpdateIsDownloading);
    } else {
      setUpdateIsDownloading(false);
    }
  }
}
