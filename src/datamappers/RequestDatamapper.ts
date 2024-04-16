import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { getDbConnection } from '../db/init';
import Obj from '../lib/utils/Obj';

export interface Request {
  id: string;
  description: string;
  queueId: string;
  type: string;
  userId: string;
  channelId: string;
  createdById: string;
  createdByName: string;
  createdAt: Date;
}

export type RequestInsert = {
  description: string;
  queueId: string;
  type: string;
  userId: string;
  channelId?: string;
  createdById: string;
  createdByName: string;
}

type DbRequest = Omit<Request, 'queueId' | 'userId' | 'channelId' | 'createdById' | 'createdByName' | 'createdAt'> & {
  queue_id: string;
  user_id: string;
  channel_id: string;
  created_by_id: string;
  created_by_name: string;
  created_at?: Date;
}
type CompleteDbRequest = Required<DbRequest>

export default class RequestDataMapper {
  private readonly dbConnection = getDbConnection();

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async create(request: RequestInsert): Promise<Request> {
    try {
      const [result] = await this.dbConnection<CompleteDbRequest>('requests')
        .insert({
          id: randomUUID(),
          description: request.description,
          queue_id: request.queueId,
          type: request.type,
          user_id: request.userId,
          channel_id: request.channelId,
          created_by_id: request.createdById,
          created_by_name: request.createdByName,
        })
        .returning('*');

      this.logger.info({ result }, 'Successfully created a new request');
      const requestObj = new Obj(result);
      return requestObj.convertToCamel();
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new request record');
      throw err;
    }
  }

  async list(where?: Partial<Request>): Promise<Request[]> {
    const results = await this.dbConnection
      .select('*')
      .from<CompleteDbRequest>('requests')
      .modify((queryBuilder) => {
        if (where) {
          const whereClause = new Obj(where);
          queryBuilder.where(whereClause.convertToSnake());
        }
      });


    this.logger.info({ count: results.length }, 'Successfully retrieved records in KnexQueryBuilder');

    return results.map((result: CompleteDbRequest) => {
      const request = new Obj(result);
      return request.convertToCamel();
    });
  }

  async delete(requestId: string): Promise<void> {
    try {
      this.logger.debug({ requestId }, 'Attempting to delete a request in KnexQueryBuilder');
      await this.dbConnection('queues')
        .del()
        .where('id', requestId);

      this.logger.info({ requestId }, 'Successfully deleted a request in KnexQueryBuilder');

      return;
    } catch (err) {
      this.logger.error({ err, requestId }, 'There was an error while trying to delete a request in KnexQueryBuilder');
      throw err;
    }
  }
}
