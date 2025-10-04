import 'reflect-metadata';

import { container, FactoryFunction } from 'tsyringe';
import { Knex } from 'knex';
import { Request } from 'express';

import { Tokens } from './Tokens';

import RepositoryFactory from '@Repos/RepositoryFactory';
import { ILogger, PinoLogger } from '@Lib/logger';
import { getDbConnection } from '@DB/init';
import { ModelFactory } from '@Models/index';
import CommandsController from '@Api/commands/commands.controller';
import { SlashCommand } from '@Lib/slack/slashCommands';
import InteractionsController from '@Api/interactions/interactions.controller';
import { AppConfig } from '@Config/app.config';

export const AppConfigToken = Tokens.Get<AppConfig>('AppConfig');
export const CommandControllerToken = Tokens.Get<(command: SlashCommand) => CommandsController>('CommandsController');
export const InteractionControllerToken = Tokens.Get<(req: Request) => InteractionsController>('InteractionsController');
export const ModelFactoryToken = Tokens.Get<ModelFactory>('ModelFactory');
export const RepoFactoryToken = Tokens.Get<RepositoryFactory>('RepoFactory');
export const LoggerToken = Tokens.Get<ILogger>('Logger');
export const DBClientToken = Tokens.Get<Knex>('DBClient');

// Create a factory to partially inject the logger and repo factory, and allow supplying command at runtime
const CommandControllerFactory: FactoryFunction<
(command: SlashCommand) => CommandsController
> = (dependencyContainer) => 
  (command: SlashCommand) =>
    new CommandsController(
      dependencyContainer.resolve(LoggerToken),
      dependencyContainer.resolve(RepoFactoryToken),
      command,
    );

const InteractionControllerFactory: FactoryFunction<
(req: Request) => InteractionsController
> = (dependencyContainer) => 
  (req: Request) =>
    new InteractionsController(
      dependencyContainer.resolve(LoggerToken),
      dependencyContainer.resolve(RepoFactoryToken),
      req,
    );

export const iocContainer = container
  .register(AppConfigToken, { useClass: AppConfig })
  .register(ModelFactoryToken, { useClass: ModelFactory })
  .register(RepoFactoryToken, { useClass: RepositoryFactory })
  .register(DBClientToken, { useValue: getDbConnection() })
  .register(LoggerToken, { useClass: PinoLogger })
  .register(CommandControllerToken, { useFactory: CommandControllerFactory })
  .register(InteractionControllerToken, { useFactory: InteractionControllerFactory });
