import { inject, singleton } from 'tsyringe';
import { Knex } from 'knex';

import { IRepository, SupportedModels } from './IRepository';

import { Tokens } from '@Ioc/Tokens';
import { ILogger } from '@Lib/logger';
import { AppError, AppErrorCodes } from '@Lib/errors';
import { ModelFactory } from '@Models/ModelFactory';
import { TableNames } from '@DB/tableNames';

@singleton()
export default class PostgresRepository <T extends SupportedModels> implements IRepository<T> {
  private readonly logDetails: Record<string, unknown> = {};

  constructor(
    private readonly tableName: TableNames,
    @inject(Tokens.Get('DBClient')) private readonly client: Knex,
    @inject(Tokens.Get('Logger')) private readonly logger: ILogger,
    @inject(Tokens.Get('ModelFactory')) private readonly modelFactory: ModelFactory,
  ) {
    this.logDetails.tableName = this.tableName;
  }

  async create(model: T): Promise<void> {
    await this.client(this.tableName).insert({
      ...model,
      created_at: new Date(),
      updated_at: new Date(),
    });    
  }

  async getById(id: string): Promise<T | undefined> {
    try {
      this.logger.debug(`Attempting to query ${this.tableName} by id`, { ...this.logDetails, id });
      const result = await this.client(this.tableName)
        .select('*')
        .where({ id });

      const [record] = result;

      if (!record) {
        this.logger.debug(`No results found querying ${this.tableName} by id`, { ...this.logDetails, id });
        return;
      }

      if (result.length > 1) {
        this.logger.warn(
          `Queried ${this.tableName} by id but found more than 1 result!`, { ...this.logDetails, id },
        );
      }
      return this.modelFactory.Create({ tableName: this.tableName, data: record }) as T;
    } catch (err) {
      this.logger.error(`Error attempting to query ${this.tableName} by id`, { ...this.logDetails, id, err });
      throw new AppError(AppErrorCodes.DataAccess, { cause: err, msg: 'Failed to get record by id' });
    }
  }

  async list(where?: Partial<T>): Promise<T[]> {
    try {
      this.logger.debug(`Attempting to list ${this.tableName}`, { ...this.logDetails, where });
      const results = await this.client
        .select('*')
        .from(this.tableName)
        .modify((queryBuilder) => {
          if (where) {
            queryBuilder.where(where);
          }
        });

      if (results.length === 0) {
        this.logger.debug(`No results found listing ${this.tableName}`, { ...this.logDetails, where });
        return results;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return results.map((record: any) => 
        this.modelFactory.Create({ tableName: this.tableName, data: record }));
    } catch (err) {
      this.logger.error(`Error attempting to list ${this.tableName}`, { ...this.logDetails, where, err });
      throw new AppError(AppErrorCodes.DataAccess, { cause: err, msg: 'Failed to list records' });
    }
  }

  async update(id: string, model: T): Promise<void> {
    try {
      this.logger.debug(`Attempting to update record in table ${this.tableName}`, { ...this.logDetails, id });
      await this.client(this.tableName)
        .where({ id })
        .update(model); 
    } catch (err) {
      this.logger.error(
        `Error attempting to update a record in table ${this.tableName}`, { ...this.logDetails, err },
      );
      throw new AppError(
        AppErrorCodes.DataAccess,
        { cause: err, msg: `Failed to update record in table ${this.tableName}` },
      );
    }
  }

  async delete(id: string): Promise<void> {
    try{
      this.logger.debug(`Attempting to delete record in table ${this.tableName}`, { ...this.logDetails, id });
      await this.client(this.tableName)
        .where({ id })
        .delete(); 
    } catch (err) {
      this.logger.error(
        `Error attempting to delete a record from table ${this.tableName}`, { ...this.logDetails, id, err },
      );
      throw new AppError(
        AppErrorCodes.DataAccess, 
        { cause: err, msg: `Failed to delete a record in table ${this.tableName}` },
      );
    }
  }
}
