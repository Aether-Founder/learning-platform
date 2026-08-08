export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  userId?: string;
  route?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.format('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, error?: any, context?: LogContext) {
    const errDetails =
      error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.format('error', message, { ...context, error: errDetails }));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('debug', message, context));
    }
  }
}

export const logger = new Logger();
