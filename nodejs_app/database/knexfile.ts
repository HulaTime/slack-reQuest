import type { Knex } from 'knex';

import {
  DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, 
} from '../src/config/db.config';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    },
    migrations: { tableName: 'migrations' },
    seeds: { directory: './seeds' },
  },

  staging: {
    client: 'pg',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    },
    migrations: { tableName: 'migrations' },
    seeds: { directory: './seeds' },
  },

  production: {
    client: 'pg',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    },
    migrations: { tableName: 'migrations' },
    seeds: { directory: './seeds' },
  },
};

module.exports = config;
