import { createHmac, timingSafeEqual } from 'node:crypto';

import { RequestHandler } from 'express';

import { AppConfig } from '@Config/app.config';
import { PinoLogger } from '@Lib/logger';

const appConfig = new AppConfig();

const logger = new PinoLogger(appConfig);

// https://api.slack.com/authentication/verifying-requests-from-slack
export const verifySlackMessage: RequestHandler = (req, res, next) => {
  try {
    logger.debug('Verifying inbound slack message');
    const {
      headers: {
        [appConfig.headers.slackRequestTs]: timestamp,
        [appConfig.headers.slackSignature]: slackSignature,
      },
      rawBody,
    } = req;

    if (!timestamp || !slackSignature) {
      logger.error(
        'Missing required slack signature verification headers',
        { headers: req.headers, body: req.body },
      );
      res.status(401).send('Unauthorized');
      return;
    }
    const signatureBaseString = `${appConfig.slack.signingVersion}:${timestamp}:${rawBody}`;
    const hmac = createHmac('sha256', appConfig.slack.signingSecret);

    const calculatedSignature = 
    'v0=' + hmac.update(signatureBaseString, 'utf-8').digest('hex');

    const isEqual = timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(slackSignature as string),
    );
    if (!isEqual) {
      logger.error('Request Failed Signature Validation!', { headers: req.headers, body: req.body });
      res.status(401).send('Unauthorized');
      return;
    }
    logger.debug('Successfully verified inbound slack message');
    return next();
  } catch (err) {
    logger.error('An unexpected error occurred while verifying inbound slack message', { err });
    res.status(401).send('Unauthorized');
    return;
  }
};
