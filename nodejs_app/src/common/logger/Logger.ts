import { pino, Logger as PLogger } from 'pino';
import { injectable } from 'tsyringe';

import { ILogger } from './ILogger';
import { BaseLogger } from './ABaseLogger';

@injectable()
export default class PinoLogger extends BaseLogger implements ILogger {
  logger: PLogger;

  constructor() {
    super();
    this.logger = pino();
  }
  
  debug(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.debug(msg, { correlationId: this.correlationId });
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.debug(logDetails, msg);
    }
  }
  
  info(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.info(msg,{ correlationId: this.correlationId });
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.info(logDetails, msg);
    }
  }

  warn(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.warn(msg, { correlationId: this.correlationId });
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.warn(logDetails, msg);
    }
  }
  
  error(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.error(msg, { correlationId: this.correlationId });
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.error(logDetails, msg);
    }
  }
} 
