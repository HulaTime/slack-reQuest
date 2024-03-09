import { pino } from 'pino';

import { getDbConnection } from '../src/db/init';

import { app } from './app';


const logger = pino();

app.listen(3000, async () => {
  const db = getDbConnection();
  await db.raw('select 1;');
  logger.info(`Listening on port ${3000}`);
});
