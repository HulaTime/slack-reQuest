import knex, { Knex } from 'knex';

import {
  DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER,
} from '../config/db.config';

const dbInit = (): () => Knex => {
  let connection: Knex;
  return (): Knex => {
    if (!connection) {
      connection = knex({
        client: 'pg',
        connection: {
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: DB_PASSWORD,
          database: DB_NAME,
        },
        pool: {
          min: 0,
          max: 10,
        },
      });
    }
    return connection;
  };
};

export const getDbConnection = dbInit();

