import * as env from 'env-var';
import { LevelWithSilent } from 'pino';

export const LOG_LEVEL: LevelWithSilent = env.get('LOG_LEVEL')
  .default('info')
  .asString() as LevelWithSilent;
