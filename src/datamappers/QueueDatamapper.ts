import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { IQueryBuilder } from '../db/queryBuilders';
import KnexQueryBuilder from '../db/queryBuilders/KnexQueryBuilder';

export interface Queue {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

type QueueInsert = {
  id: string;
  name: string;
  userId: string;
}

type CamelCase<S extends string> =
  S extends `${infer P}_${infer Q}${infer R}`
  ? `${P}${Capitalize<Q>}${CamelCase<R>}`
  : S;

type SnakeToCamelCase<T> = {
  [K in keyof T as CamelCase<K & string>]: T[K]
};

const snakeToCamelCase = <T extends Record<string, unknown>>(input: T): SnakeToCamelCase<T> => {
  const output: Record<string, unknown> = {};
  for (const key in input) {
    let newKey = '';
    let shouldUpperCase = false;
    for (const letter of key) {
      if (letter !== '_') {
        if (shouldUpperCase) {
          newKey += letter.toUpperCase();
          shouldUpperCase = false;
        } else {
          newKey += letter;
        }
      } else {
        shouldUpperCase = true;
      }
    }
    output[newKey] = input[key];
  }
  return output as SnakeToCamelCase<T>;
};

type DbQueue = Omit<Queue, 'userId' | 'createdAt'> & { user_id: string; created_at?: Date }
type CompleteDbQueue = Required<DbQueue>

export default class QueueDataMapper {
  private readonly logger: Logger;

  private readonly queryBuilder: IQueryBuilder;

  constructor(logger: Logger, queryBuilder?: IQueryBuilder) {
    this.logger = logger;
    this.queryBuilder = queryBuilder ?? new KnexQueryBuilder(logger);
  }

  async create(queue: QueueInsert): Promise<Queue> {
    try {
      const result = await this.queryBuilder
        .insert<DbQueue>('queues', {
          id: randomUUID(),
          name: queue.name,
          user_id: queue.userId,
        });
      this.logger.info({ result }, 'Successfully created a new queue');
      return snakeToCamelCase(result as CompleteDbQueue);
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new queue record');
      throw err;
    }
  }
}
