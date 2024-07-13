import { Logger } from 'pino';

import { IRepository } from './IRepositroy';

import { getDbConnection } from '@DB/init';
import { IRequest, RequestModel } from 'src/models/Request';
import { REQUESTS_TABLE_NAME } from '@Constants/app';

export default class RequestRepository implements IRepository <RequestModel> {
  private readonly dbConnection = getDbConnection();

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async create(request: RequestModel): Promise<void> {
    try {
      const [result] = await this.dbConnection<IRequest>(REQUESTS_TABLE_NAME)
        .insert(request)
        .returning('*');

      this.logger.info({ result }, 'Successfully created a new request');
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new request record');
      throw err;
    }
  }

  async list(where?: Partial<IRequest>): Promise<RequestModel[]> {
    const results = await this.dbConnection
      .select('*')
      .from<IRequest>(REQUESTS_TABLE_NAME)
      .modify((queryBuilder) => {
        if (where) {
          queryBuilder.where(where);
        }
      });


    this.logger.info({ count: results.length }, 'Successfully retrieved records in KnexQueryBuilder');

    return results.map((result: IRequest) => new RequestModel(result));
  }

  async delete(requestId: string): Promise<void> {
    try {
      this.logger.debug({ requestId }, 'Attempting to delete a request in KnexQueryBuilder');
      await this.dbConnection(REQUESTS_TABLE_NAME)
        .del()
        .where('id', requestId);

      this.logger.info({ requestId }, 'Successfully deleted a request in KnexQueryBuilder');

      return;
    } catch (err) {
      this.logger.error({ err, requestId }, 'There was an error while trying to delete a request in KnexQueryBuilder');
      throw err;
    }
  }

  async update(requestId: string, data: Partial<IRequest>): Promise<RequestModel> {
    try {
      const [result] = await this.dbConnection<IRequest>(REQUESTS_TABLE_NAME)
        .update(data)
        .where({ id: requestId })
        .returning('*');

      this.logger.info({ result }, 'Successfully updated a request');
      return new RequestModel(result);
    } catch (err) {
      this.logger.error({ err, requestId }, 'Failed to update a request record');
      throw err;
    }
  }
}
