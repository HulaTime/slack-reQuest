import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { getDbConnection } from '@DB/init';
import Obj from '@Lib/utils/Obj';

type RequestStatus = 'idle' | 'in_progress' | 'done' | 'rejected'

export type RequestInsert = {
  description: string;
  queueId: string;
  type: string;
  ownerId: string;
  channelId: string;
  status: RequestStatus;
  assignee?: string;
}

export interface Request extends RequestInsert {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

type DbRequest = Omit<Request, 'queueId' | 'ownerId' | 'channelId' | 'createdAt' | 'updatedAt'> & {
  queue_id: string;
  owner_id: string;
  channel_id: string;
  created_at?: Date;
  updated_at: Date;
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
          owner_id: request.ownerId,
          channel_id: request.channelId,
          updated_at: new Date(Date.now()),
          status: 'idle',
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

  async update(requestId: string, data: Partial<RequestInsert>): Promise<Request> {
    try {
      const updateData = new Obj(data);
      const [result] = await this.dbConnection<CompleteDbRequest>('requests')
        .update({ ...updateData.convertToSnake() })
        .where({ id: requestId })
        .returning('*');

      this.logger.info({ result }, 'Successfully updated a request');
      const resultObj = new Obj(result);
      return resultObj.convertToCamel();
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new request record');
      throw err;
    }
  }
}
