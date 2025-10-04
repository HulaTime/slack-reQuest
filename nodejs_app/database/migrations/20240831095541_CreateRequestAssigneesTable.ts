import type { Knex } from 'knex';

import { TableNames } from '../tableNames';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TableNames.RequestAssignees, (table) => {
    table.string('request_id').notNullable()
      .references('id')
      .inTable(TableNames.Requests);
    table.string('user_id').notNullable()
      .references('id')
      .inTable(TableNames.Users);
    table.primary(['request_id', 'user_id']);
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TableNames.RequestAssignees);
}

