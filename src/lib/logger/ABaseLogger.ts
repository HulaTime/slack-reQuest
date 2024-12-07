import { randomUUID } from 'crypto';

import { ILogger } from './ILogger';

export abstract class BaseLogger implements ILogger {
  protected correlationId: string = randomUUID();

  setCorrelationId(id: string): void {
    this.correlationId = id; 
  }

  debug(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    console.log({
      level: 'debug', msg, ...logDetails, correlationId: this.correlationId, 
    }); 
  }

  info(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    console.log({
      level: 'info', msg, ...logDetails, correlationId: this.correlationId, 
    }); 
  }

  warn(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    console.log({
      level: 'warn', msg, ...logDetails, correlationId: this.correlationId, 
    }); 
  }

  error(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    console.log({
      level: 'error', msg, ...logDetails, correlationId: this.correlationId, 
    }); 
  }
}
