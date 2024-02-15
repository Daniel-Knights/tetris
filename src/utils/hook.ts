import { useRef } from "react";

export function useInitRef<T>(valueCb: () => T): React.MutableRefObject<T> {
  const ref = useRef<T>(null as T);

  if (ref.current === null) {
    ref.current = valueCb();
  }

  return ref;
}
