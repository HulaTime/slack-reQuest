import { RequestHandler } from 'express';

import { AppConfig } from '@Config/app.config';
import { ILogger, PinoLogger } from '@Lib/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  module Express {
    interface Request {
      log: ILogger;
    }
  }
}

export const attachLogger: RequestHandler = (req, res, next) => {
  const logger = new PinoLogger(new AppConfig());
  req.log = logger;
  next();
};
