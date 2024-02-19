import { pino } from 'pino';

import { getDbConnection } from '../db/init';

import { app } from './app';


const logger = pino();

app.listen(3000, () => {
  getDbConnection();
  logger.info(`Listening on port ${3000}`);
});

