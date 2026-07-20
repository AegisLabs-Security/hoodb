const isDebug = process.env.GMGN_DEBUG === "true";

export const gmgnLogger = {
  debug: (...args: unknown[]) => {
    if (isDebug) {
      console.log("[GMGN DEBUG]", ...args);
    }
  },
  info: (...args: unknown[]) => {
    console.log("[GMGN INFO]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[GMGN ERROR]", ...args);
  },
};
