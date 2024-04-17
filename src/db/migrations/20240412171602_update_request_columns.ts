import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('requests', (table) => {
    table.text('channel_id');
    table.text('user_id').notNullable();
    table.text('queue_id').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('requests', (table) => {
    table.dropColumn('channel_id');
    table.dropColumn('user_id');
    table.dropColumn('queue_id');
  });
}

