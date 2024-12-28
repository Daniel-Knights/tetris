type IntervalData = {
  count: number;
  clear: () => void;
};

/**
 * `setInterval` that uses `requestAnimationFrame` to sync callback calls with the
 * monitor's frame rate.
 *
 * The only functional difference to `setInterval` is that the callback is first
 * run immediately by default. A delay can be configured using the `delay` option.
 */
export function setFrameSyncInterval(
  cb: (param: IntervalData) => void,
  interval: number,
  options?: {
    delay?: number;
    limit?: number;
  }
): IntervalData {
  // Set to interval initially, so the first call is immediate
  let elapsedAccumulator = interval - (options?.delay ?? 0);
  let animationFrameId: number | null = null;
  let prevTimestamp: number | null = null;

  const data: IntervalData = {
    count: 0,
    clear: () => {
      if (!animationFrameId) return;

      window.cancelAnimationFrame(animationFrameId);
    },
  };

  function loop(timestamp: number) {
    // If limit is reached, stop the loop
    if (options?.limit && data.count >= options.limit) {
      data.clear();

      return;
    }

    const elapsedSincePrevFrame = timestamp - (prevTimestamp ?? timestamp);

    elapsedAccumulator += elapsedSincePrevFrame;

    if (elapsedAccumulator >= interval) {
      // If the interval is less than the frame rate, this will be the number of
      // calls that should've happened since the previous frame
      const countSincePrevFrame = Math.floor(elapsedAccumulator / interval);

      for (let i = 0; i < countSincePrevFrame; i += 1) {
        data.count += 1;

        cb(data);

        elapsedAccumulator -= interval;
      }
    }

    prevTimestamp = timestamp;
    animationFrameId = window.requestAnimationFrame(loop);
  }

  animationFrameId = window.requestAnimationFrame(loop);

  return data;
}
