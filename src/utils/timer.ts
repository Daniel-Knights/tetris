/** Runs callback instantly as well as at intervals. */
export function setInstantInterval(cb: () => void, interval: number): number {
  cb();

  return window.setInterval(cb, interval);
}
