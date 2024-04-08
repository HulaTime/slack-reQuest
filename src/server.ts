import { pino } from 'pino';

import { getDbConnection } from '../src/db/init';
import { LOG_LEVEL } from '../config/app.config';
import { APP_NAME } from '../constants/app';

import { app } from './app';

const logger = pino({
  level: LOG_LEVEL,
  name: APP_NAME,
});

app.listen(3000, async () => {
  const db = getDbConnection();
  await db.raw('select 1;');
  logger.info(`Listening on port ${3000}`);
});
