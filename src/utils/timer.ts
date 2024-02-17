type IntervalData = {
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
  let intervalId: number;
  let timeoutId: number;

  function clear() {
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
  }

  const data: IntervalData = {
    count: 0,
    clear,
  };

  function commitInterval() {
    cb(data);

    data.count += 1;

    intervalId = window.setInterval(() => {
      cb(data);

      // Clear if limit is reached
      if (options?.limit && data.count >= options.limit) {
        clear();

        return;
      }

      data.count += 1;
    }, interval);
  }

  if (options?.delay) {
    timeoutId = window.setTimeout(commitInterval, options.delay);
  } else {
    commitInterval();
  }

  return data;
}
