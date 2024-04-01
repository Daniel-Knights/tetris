export type IntervalData = {
  count: number;
  clear: () => void;
};

/**
 * `setInterval` with more options, the only difference being that the callback is first
 * run immediately by default. A delay can be configured using the `delay` option.
 */
export function setCustomInterval(
  cb: (data: IntervalData) => void,
  interval: number,
  options?: {
    delay?: number;
    limit?: number;
  }
): IntervalData {
  const data: IntervalData = {
    count: 0,
    clear,
  };

  let timeoutId: number | undefined;
  let prevTime: number | undefined;

  function clear() {
    window.clearTimeout(timeoutId);
  }

  function commitInterval() {
    data.count += 1;

    cb(data);

    if (options?.limit && data.count >= options.limit) {
      return;
    }

    // Adjust interval to account for timer imprecision
    const now = Date.now();
    const delta = prevTime ? now - prevTime : interval;
    const adjustedInterval = interval + (interval - delta);

    prevTime = now;
    timeoutId = window.setTimeout(commitInterval, adjustedInterval);
  }

  if (options?.delay) {
    timeoutId = window.setTimeout(commitInterval, options.delay);
  } else {
    commitInterval();
  }

  return data;
}
