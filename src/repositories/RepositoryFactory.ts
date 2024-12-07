import { inject, singleton } from 'tsyringe';
import { Knex } from 'knex';

import { IRepository, PostgresRepository, SupportedModels } from './';

import { TableNames } from '@DB/tableNames';
import { Tokens } from '@Ioc/Tokens';
import { ILogger } from '@Lib/logger';
import { ModelFactory } from '@Models/index';

@singleton()
export default class RepositoryFactory {
  constructor(
    @inject(Tokens.Get('DBClient')) private readonly client: Knex,
    @inject(Tokens.Get('Logger')) private readonly logger: ILogger,
    @inject(Tokens.Get('ModelFactory')) private readonly modelFactory: ModelFactory,
  ) {}

  Create<T extends SupportedModels>(tableName: TableNames): IRepository<T> {
    return new PostgresRepository<T>(tableName, this.client, this.logger, this.modelFactory);
  }
}
