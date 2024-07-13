import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import express, {
  RequestHandler, Router, json, urlencoded, Request, Response,
} from 'express';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';

import Command from './Command';

import { APP_NAME, SLACK_SIGNING_VERSION, X_REQUEST_ID } from '@Constants/app';
import { LOG_LEVEL, SLACK_SIGNING_SECRET } from '@Config/app.config';
import { X_SLACK_REQUEST_TS, X_SLACK_SIGNATURE } from '@Constants/slack';
import { getDbConnection } from '@DB/init';

export default class App {
  private app = express();

  private readonly commandHandlers: RequestHandler[] = [];

  private readonly interactionHandlers: RequestHandler[] = [];

  private router = Router();

  private parseConfig = {
    verify: (req: Request, _: Response, buff: Buffer): void => {
      req.rawBody = buff.toString();
    },
  };

  constructor(private readonly port?: number) {
    this.app.use(
      json(this.parseConfig),
      urlencoded(this.parseConfig),
      this.verifySlackMessage,
      pinoHttp({
        name: APP_NAME,
        useLevel: LOG_LEVEL,
        genReqId: (req, res) => {
          const requestId = req.headers[X_REQUEST_ID] ?? randomUUID();
          res.setHeader(X_REQUEST_ID, requestId);
          return requestId;
        },
      }),
    );
    this.router.post('/commands', this.commandHandlers);
    this.router.post('/interactions', this.interactionHandlers);
  }

  addCommand(command: Command): this {
    this.commandHandlers.push(command.requestHandler);
    return this;
  }

  start(): void {
    const logger = pino({
      level: LOG_LEVEL,
      name: APP_NAME,
    });
    this.app.listen(this.port, async () => {
      const db = getDbConnection();
      await db.raw('select 1;');
      logger.info(`Listening on port ${3000}`);
    });
  }

  // https://api.slack.com/authentication/verifying-requests-from-slack
  private verifySlackMessage: RequestHandler = (req, _, next) => {
    try {
      req.log.debug('Verifying inbound slack message');
      const {
        headers: {
          [X_SLACK_REQUEST_TS]: timestamp,
          [X_SLACK_SIGNATURE]: slackSignature,
        },
        rawBody,
      } = req;

      const signatureBaseString = `${SLACK_SIGNING_VERSION}:${timestamp}:${rawBody}`;
      const hmac = createHmac('sha256', SLACK_SIGNING_SECRET);

      const calculatedSignature = 'v0=' + hmac.update(signatureBaseString, 'utf-8').digest('hex');

      const isEqual = timingSafeEqual(
        Buffer.from(calculatedSignature), Buffer.from(slackSignature as string),
      );
      if (!isEqual) {
        req.log.error('Request Failed Signature Validation!', { headers: req.headers, body: req.body });
        return next(new Error());
      }
      req.log.debug('Successfully verified inbound slack message');
      return next();
    } catch (err) {
      req.log.error('An unexpected error occurred while verifying inbound slack message');
      return next(err);
    }
  };
}

