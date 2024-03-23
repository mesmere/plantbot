import winston from "winston";
import process from "node:process";
import { Temporal } from "temporal-polyfill";

export default winston.createLogger({
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    // winston.format.errors({ stack: true, cause: true }), // https://github.com/winstonjs/winston/issues/2381
    winston.format.timestamp(),
    winston.format(info => {
      info.timestamp = Temporal.Instant.from(info.timestamp).toString({
        smallestUnit: "second",
      });
      return info;
    })(),
    winston.format.padLevels(),
    winston.format(info => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    winston.format.printf(info => {
      if (info.error instanceof Error && info.error.stack && info.error.cause) {
        return `${info.timestamp} ${info.level} ${info.error.stack}\nCaused by: ${info.error.cause.stack}`;
      } else if (info.error instanceof Error && info.error.stack) {
        return `${info.timestamp} ${info.level} ${info.error.stack}`;
      } else {
        return `${info.timestamp} ${info.level} ${info.message}`;
      }
    }),
    winston.format.colorize({ all: true })
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});
