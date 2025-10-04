import type { Knex } from 'knex';

import { TableNames } from '../tableNames';

exports.up = function(knex: Knex): Promise<void> {
  return knex.schema.createTable(TableNames.Users, (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
  });
};

exports.down = function(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TableNames.Users);
};

