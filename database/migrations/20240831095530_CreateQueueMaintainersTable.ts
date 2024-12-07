import type { Knex } from 'knex';

import { TableNames } from '../tableNames';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TableNames.QueueMaintainers, (table) => {
    table.string('queue_id').notNullable()
      .references('id')
      .inTable(TableNames.Queues);
    table.string('user_id').notNullable()
      .references('id')
      .inTable(TableNames.Users);
    table.primary(['queue_id', 'user_id']);
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TableNames.QueueMaintainers);
}

