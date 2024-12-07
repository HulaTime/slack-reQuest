import { InjectionToken } from 'tsyringe';

export class Tokens {
  private constructor() {}

  private static tokenPool = { 
    AppConfig: Symbol('AppConfig'),
    Logger: Symbol('Logger'),
    RepoFactory: Symbol('RepoFactory'),
    DBClient: Symbol('DBClient'),
    ModelFactory: Symbol('ModelFactory'),
    CommandsController: Symbol('CommandsController'),
    InteractionsController: Symbol('InteractionsController'),
  };

  static Get<T>(name: keyof typeof Tokens.tokenPool): InjectionToken<T> {
    if (!Tokens.tokenPool[name]) {
      Tokens.tokenPool[name] = Symbol(name);
    }
    return Tokens.tokenPool[name];
  } 
}

