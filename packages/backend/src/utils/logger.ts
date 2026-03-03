/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}

/**
 * 日志器接口
 */
export interface ILogger {
  debug(message: string, context?: string, data?: any): void;
  info(message: string, context?: string, data?: any): void;
  warn(message: string, context?: string, data?: any): void;
  error(message: string, context?: string, error?: Error): void;
}

/**
 * 简单的日志器实现
 */
export class Logger implements ILogger {
  private minLevel: LogLevel;
  private logs: LogEntry[];

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
    this.logs = [];
  }

  /**
   * 添加日志
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      data,
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // 输出到控制台
    this.output(entry);
  }

  /**
   * 输出日志到控制台
   */
  private output(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';

    const logMethod = this.getLogMethod(entry.level);

    logMethod(`[${timestamp}] ${levelName} ${context} ${entry.message}`, entry.data || '');
  }

  /**
   * 获取日志方法
   */
  private getLogMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, context?: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error?.message || error);
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }
}

/**
 * 全局日志器实例
 */
export const logger = new Logger(LogLevel.INFO);

/**
 * 设置最小日志级别
 */
export function setLogLevel(level: LogLevel): void {
  logger.minLevel = level;
}

export default logger;
