import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { getDbConnection } from '../db/init';
import Obj from '../lib/utils/Obj';

export interface Queue {
  id: string;
  name: string;
  userId: string;
  type: 'user' | 'channel';
  channelId?: string;
  createdAt: Date;
}

export type QueueInsert = {
  name: string;
  userId: string;
  type: 'user' | 'channel';
  channelId?: string;
}

type DbQueue = Omit<Queue, 'userId' | 'createdAt' | 'channelId'> & {
  user_id: string;
  channel_id: string;
  created_at?: Date; 
}
type CompleteDbQueue = Required<DbQueue>

export default class QueueDataMapper {
  private readonly dbConnection = getDbConnection();

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async create(queue: QueueInsert): Promise<Queue> {
    try {
      const [result] = await this.dbConnection<CompleteDbQueue>('queues')
        .insert({
          id: randomUUID(),
          name: queue.name,
          user_id: queue.userId,
          type: queue.type,
          channel_id: queue.channelId,
        })
        .returning('*');

      this.logger.info({ result }, 'Successfully created a new queue');
      const queueObj = new Obj(result);
      return queueObj.convertToCamel();
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new queue record');
      throw err;
    }
  }

  async list(where?: Partial<Queue>): Promise<Queue[]> {
    const results = await this.dbConnection
      .select('*')
      .from<CompleteDbQueue>('queues')
      .modify((queryBuilder) => {
        if (where) {
          const whereClause = new Obj(where);
          queryBuilder.where(whereClause.convertToSnake());
        }
      });


    this.logger.info({ count: results.length }, 'Successfully retrieved records in KnexQueryBuilder');

    return results.map((result: CompleteDbQueue) => {
      const queue = new Obj(result);
      return queue.convertToCamel();
    });
  }

  async delete(queueId: string): Promise<void> {
    try {
      this.logger.debug({ queueId }, 'Attempting to delete a queue in KnexQueryBuilder');
      await this.dbConnection('queues')
        .del()
        .where('id', queueId);

      this.logger.info({ queueId }, 'Successfully deleted a queue in KnexQueryBuilder');

      return;
    } catch (err) {
      this.logger.error({ err, queueId }, 'There was an error while trying t odelete a queue in KnexQueryBuilder');
      throw err;
    }
  }
}
