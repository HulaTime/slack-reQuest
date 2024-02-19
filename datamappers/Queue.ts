import { Logger } from 'pino';

import { getDbConnection } from '../db/init';

export interface Queue {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

type QueueInsert = {
  id: string;
  name: string;
}

export default class QueueDataMapper {
  private readonly dbConnection = getDbConnection();

  constructor(private readonly logger: Logger) { }

  async create(queue: QueueInsert): Promise<void> {
    try {
      const result = await this.dbConnection<Queue>('queues').insert(queue);
      this.logger.info({ result }, 'Successfully created a new queue');
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new queue record');
      throw err;
    }
  }
}
