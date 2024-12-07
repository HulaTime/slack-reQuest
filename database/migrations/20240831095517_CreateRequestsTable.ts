import type { Knex } from 'knex';

import { TableNames } from '../tableNames';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TableNames.Requests, (table) => {
    table.string('id').primary();
    table.string('queue_id').notNullable()
      .references('id')
      .inTable(TableNames.Queues);
    table.string('created_by').notNullable()
      .references('id')
      .inTable(TableNames.Users);
    table.string('name').notNullable();
    table.text('details');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TableNames.Requests);
}

