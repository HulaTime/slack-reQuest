import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { getDbConnection } from '../db/init';

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

type DbQueue = Omit<Queue, 'userId' | 'createdAt'> & { user_id: string; created_at: Date }

export default class QueueDataMapper {
  private readonly dbConnection = getDbConnection();

  constructor(private readonly logger: Logger) { }

  async create(queue: QueueInsert): Promise<Queue> {
    try {
      const [result] = await this.dbConnection<DbQueue>('queues')
        .insert({
          id: randomUUID(),
          name: queue.name,
          user_id: queue.userId,
        })
        .returning('*');
      this.logger.info({ result }, 'Successfully created a new queue');
      return snakeToCamelCase(result);
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a new queue record');
      throw err;
    }
  }
}
