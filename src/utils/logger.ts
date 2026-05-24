type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDev = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const writer = console[level] ?? console.log;

    if (this.isDev) {
      writer(`${prefix} ${message}`, data);
      return;
    }

    console.log(`${prefix} ${message}`, data);
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown) {
    this.log("error", message, data);
  }
}

export const logger = new Logger();
