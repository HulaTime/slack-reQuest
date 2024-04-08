import * as env from 'env-var';
import { LevelWithSilent } from 'pino';

export const LOG_LEVEL: LevelWithSilent = env.get('LOG_LEVEL')
  .default('info')
  .asString() as LevelWithSilent;

export const SLACK_CLIENT_ID: string = env.get('SLACK_CLIENT_ID')
  .required()
  .asString();

export const SLACK_CLIENT_SECRET: string = env.get('SLACK_CLIENT_SECRET')
  .required()
  .asString();

export const SLACK_SIGNING_SECRET: string = env.get('SLACK_SIGNING_SECRET')
  .required()
  .asString();

export const SLACK_BOT_USER_TOKEN: string = env.get('SLACK_BOT_USER_TOKEN')
  .required()
  .asString();
