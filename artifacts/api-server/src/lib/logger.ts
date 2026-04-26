export const logger = {
  info: (obj: any, msg?: string) => console.log(JSON.stringify(obj), msg || ""),
  warn: (obj: any, msg?: string) => console.warn(JSON.stringify(obj), msg || ""),
  error: (obj: any, msg?: string) => console.error(JSON.stringify(obj), msg || ""),
  debug: (obj: any, msg?: string) => console.debug(JSON.stringify(obj), msg || ""),
  fatal: (obj: any, msg?: string) => console.error(JSON.stringify(obj), msg || ""),
};
