import pino from "pino";

export const logger = pino({
  level: process.env.LOG || process.env.NODE_ENV === "production" ? "warn" : "info",
});
