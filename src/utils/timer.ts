export type IntervalData = {
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
  let intervalAccumulator = options?.delay ? interval - options.delay : interval;
  let animationFrameId: number | null = null;
  let prevTime: number | null = null;

  const data: IntervalData = {
    count: 0,
    clear: () => {
      if (!animationFrameId) return;

      window.cancelAnimationFrame(animationFrameId);

      animationFrameId = null;
    },
  };

  function loop(timestamp: number) {
    // If limit is reached, stop the loop
    if (options?.limit && data.count >= options.limit) {
      data.clear();

      return;
    }

    prevTime ??= timestamp;

    const elapsedSincePrev = timestamp - prevTime;

    prevTime = timestamp;
    intervalAccumulator += elapsedSincePrev;

    if (intervalAccumulator >= interval) {
      // If the interval is less than the frame rate, this will be the number of
      // calls that should've happened since the previous frame
      const countSincePrevFrame = Math.floor(intervalAccumulator / interval);

      for (let i = 0; i < countSincePrevFrame; i += 1) {
        data.count += 1;

        cb(data);

        intervalAccumulator -= interval;
      }

      prevTime = null;
    }

    animationFrameId = window.requestAnimationFrame(loop);
  }

  animationFrameId = window.requestAnimationFrame(loop);

  return data;
}
