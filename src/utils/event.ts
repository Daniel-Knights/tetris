import type { GameStatus } from "../classes";

type CustomEventMap = {
  gamestatuschange: { curr: GameStatus; prev: GameStatus };
};

export function dispatchCustomEvent<K extends keyof CustomEventMap>(
  type: K,
  detail: CustomEventMap[K]
) {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

export function addCustomEventListener<K extends keyof CustomEventMap>(
  type: K,
  listener: (ev: CustomEvent<CustomEventMap[K]>, remove: () => void) => void
) {
  function wrappedListener(ev: Event) {
    listener(ev as CustomEvent, () => {
      document.removeEventListener(type, wrappedListener);
    });
  }

  document.addEventListener(type, wrappedListener);

  return () => {
    document.removeEventListener(type, wrappedListener);
  };
}
