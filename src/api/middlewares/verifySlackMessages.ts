import { createHmac, timingSafeEqual } from 'node:crypto';

import { RequestHandler } from 'express';
import { pino } from 'pino';

import { LOG_LEVEL, SLACK_SIGNING_SECRET } from '@Config/app.config';
import { X_SLACK_REQUEST_TS, X_SLACK_SIGNATURE } from '@Constants/slack';
import { APP_NAME, SLACK_SIGNING_VERSION } from '@Constants/app';

const logger = pino({
  name: APP_NAME,
  level: LOG_LEVEL,
});

// https://api.slack.com/authentication/verifying-requests-from-slack
export const verifySlackMessage: RequestHandler = (req, res, next) => {
  try {
    logger.debug('Verifying inbound slack message');
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

    const isEqual = timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(slackSignature as string));
    if (!isEqual) {
      logger.error('Request Failed Signature Validation!', { headers: req.headers, body: req.body });
      return next(new Error());
    }
    logger.debug('Successfully verified inbound slack message');
    return next();
  } catch (err) {
    logger.error('An unexpected error occurred while verifying inbound slack message');
    return next(err);
  }
};
