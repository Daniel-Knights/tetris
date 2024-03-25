export type IntervalData = {
  count: number;
  clear: () => void;
};

/**
 * `setInterval` with more options, the only difference being that the callback is first
 * run immediately by default. A delay can be configured using the `delay` option.
 */
export function setCustomInterval(
  cb: (param: IntervalData) => void,
  interval: number,
  options?: {
    /** Delay before first run in ms. */
    delay?: number;
    /** Call limit. Once hit, calls `clear` internally. */
    limit?: number;
  }
): IntervalData {
  const data: IntervalData = {
    count: 0,
    clear,
  };

  let intervalId: number | undefined;
  let timeoutId: number | undefined;

  function clear() {
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
  }

  function commitInterval() {
    data.count += 1;

    cb(data);

    intervalId = window.setInterval(() => {
      // Clear if limit is reached
      if (options?.limit && data.count >= options.limit) {
        clear();

        return;
      }

      data.count += 1;

      cb(data);
    }, interval);
  }

  if (options?.delay) {
    timeoutId = window.setTimeout(commitInterval, options.delay);
  } else {
    commitInterval();
  }

  return data;
}
