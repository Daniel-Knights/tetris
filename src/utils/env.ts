export function isWeb() {
  return process.env.APP_ENV === "web";
}

export function isDesktop() {
  return process.env.APP_ENV === "desktop";
}
