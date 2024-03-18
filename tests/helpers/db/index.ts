import { Queue } from '../../../src/datamappers/QueueDatamapper';
import { getDbConnection } from '../../../src/db/init';

export const getQueueFromDb = async (name: string): Promise<Queue> => {
  const db = getDbConnection();
  return db.select('*').from('queues')
    .where('name', name)
    .first();
};
