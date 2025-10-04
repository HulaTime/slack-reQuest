import { pino, Logger as PLogger } from 'pino';
import { inject, injectable } from 'tsyringe';

import { ILogger } from './ILogger';
import { BaseLogger } from './ABaseLogger';

import { AppConfig } from '@Config/app.config';
import { Tokens } from '@Ioc/Tokens';

@injectable()
export default class PinoLogger extends BaseLogger implements ILogger {
  logger: PLogger;

  constructor(@inject(Tokens.Get('AppConfig')) appConfig: AppConfig) {
    super();
    this.logger = pino({ level: appConfig.logger.level, name: appConfig.appName });
  }
  
  debug(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.debug({ correlationId: this.correlationId }, msg);
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.debug(logDetails, msg);
    }
  }
  
  info(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.info({ correlationId: this.correlationId }, msg);
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.info(logDetails, msg);
    }
  }

  warn(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.warn({ correlationId: this.correlationId }, msg);
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.warn(logDetails, msg);
    }
  }
  
  error(msg: string, logDetails?: Record<string, unknown> | undefined): void {
    if (!logDetails) {
      this.logger.error({ correlationId: this.correlationId }, msg);
    } else {
      logDetails.correlationId = this.correlationId;
      this.logger.error(logDetails, msg);
    }
  }
} 
