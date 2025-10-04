export interface ILogger {
  setCorrelationId(id: string): void;
  debug(msg: string, logDetails?: Record<string, unknown>): void;
  info(msg: string, logDetails?: Record<string, unknown>): void;
  warn(msg: string, logDetails?: Record<string, unknown>): void;
  error(msg: string, logDetails?: Record<string, unknown>): void;
}
