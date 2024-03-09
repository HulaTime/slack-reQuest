import { Logger } from 'pino';
import { } from 'knex';

import { getDbConnection } from '../init';

import { IQueryBuilder } from '.';

export default class KnexQueryBuilder implements IQueryBuilder {
  private readonly dbConnection = getDbConnection();

  constructor(private readonly logger: Logger) {}

  async insert<T extends Record<string, unknown>>(table: string, data: T): Promise<T> {
    try {
      const [result] = await this.dbConnection(table)
        .insert(data)
        .returning('*');
      this.logger.debug({ result }, 'Successfully created a new queue in KnexQueryBuilder');
      return result;
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new queue record in KnexQueryBuilder');
      throw err;
    }
  }
}
