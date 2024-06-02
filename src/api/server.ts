import { pino } from 'pino';

import { app } from './app';

import { LOG_LEVEL } from '@Config/app.config';
import { APP_NAME } from '@Constants/app';
import { getDbConnection } from '@DB/init';

const logger = pino({
  level: LOG_LEVEL,
  name: APP_NAME,
});

app.listen(3000, async () => {
  const db = getDbConnection();
  await db.raw('select 1;');
  logger.info(`Listening on port ${3000}`);
});
