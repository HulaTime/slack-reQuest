import { Logger } from 'pino';

import { IRepository } from './IRepositroy';

import { getDbConnection } from '@DB/init';
import { IQueue, QueueModel } from 'src/models/Queue';
import { QUEUES_TABLE_NAME } from '@Constants/app';

export default class QueueRepository implements IRepository <QueueModel> {
  private readonly dbConnection = getDbConnection();

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async create(queue: QueueModel): Promise<void> {
    try {
      const [result] = await this.dbConnection<IQueue>(QUEUES_TABLE_NAME)
        .insert(queue)
        .returning('*');

      this.logger.info({ result }, 'Successfully created a new queue');
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new queue record');
      throw err;
    }
  }

  async list(where?: Partial<IQueue>): Promise<QueueModel[]> {
    const results = await this.dbConnection
      .select('*')
      .from<IQueue>(QUEUES_TABLE_NAME)
      .modify((queryBuilder) => {
        if (where) {
          queryBuilder.where(where);
        }
      });

    this.logger.info({ count: results.length }, 'Successfully retrieved records in KnexQueryBuilder');

    return results.map((result: IQueue) => new QueueModel(result));
  }

  async delete(queueId: string): Promise<void> {
    try {
      this.logger.debug({ queueId }, 'Attempting to delete a queue in KnexQueryBuilder');
      await this.dbConnection(QUEUES_TABLE_NAME)
        .del()
        .where('id', queueId);

      this.logger.info({ queueId }, 'Successfully deleted a queue in KnexQueryBuilder');

      return;
    } catch (err) {
      this.logger.error({ err, queueId }, 'There was an error while trying t odelete a queue in KnexQueryBuilder');
      throw err;
    }
  }

  async update(queueId: string, data: Partial<IQueue>): Promise<QueueModel> {
    try {
      const [result] = await this.dbConnection<IQueue>(QUEUES_TABLE_NAME)
        .update(data)
        .where({ id: queueId })
        .returning('*');

      this.logger.info({ result }, 'Successfully updated a queue');
      return new QueueModel(result);
    } catch (err) {
      this.logger.error({ err, queueId }, 'Failed to update a queue record');
      throw err;
    }
  }
}
