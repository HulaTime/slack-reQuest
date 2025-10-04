import * as env from 'env-var';
import { Level } from 'pino';
import { singleton } from 'tsyringe';

@singleton()
export class AppConfig {
  readonly appName: string = 'reQuest';

  readonly headers = {
    requestId: 'x-request-id',
    slackSignature: 'x-slack-signature',
    slackRequestTs: 'x-slack-request-timestamp',
  };

  readonly appCorrelationIdHeaderName: string = 'x-request-id';

  readonly queueMaxCharLength: number = 250;

  readonly slack = {
    signingVersion: 'v0',
    botUserToken: env.get('SLACK_BOT_USER_TOKEN')
      .required()
      .asString(),
    signingSecret: env.get('SLACK_SIGNING_SECRET')
      .required()
      .asString(),
    clientSecret: env.get('SLACK_CLIENT_SECRET')
      .required()
      .asString(),
    clientId: env.get('SLACK_CLIENT_ID')
      .required()
      .asString(),
  };

  readonly logger = {
    level: env.get('LOG_LEVEL')
      .default('info')
      .asString() as Level,
  };
}
