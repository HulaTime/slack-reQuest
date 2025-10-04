import type { Knex } from 'knex';

import { TableNames } from '../tableNames';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TableNames.Queues, (table) => {
    table.string('id').primary();
    table.string('owner').notNullable()
      .references('id')
      .inTable(TableNames.Users);
    table.string('channel_id').notNullable();
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.string('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TableNames.Queues);
}

