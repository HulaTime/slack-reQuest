import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    table.text('channel_id')
      .notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    table.dropColumn('channel_id');
  });
}

