import 'reflect-metadata';
import 'dotenv/config';

import { getDbConnection } from '../database/init';

const teardown = async (): Promise<void> => {
  const db = getDbConnection();
  await db.destroy();
}; 

afterAll(async () => await teardown());

