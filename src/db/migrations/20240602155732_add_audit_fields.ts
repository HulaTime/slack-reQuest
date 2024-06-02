import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('queues', table => {
      table.timestamp('updated_at', { useTz: true });
      table.text('last_updated_by');
    })
    .alterTable('requests', table => {
      table.timestamp('updated_at', { useTz: true });
      table.text('last_updated_by');
    });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('queues', table => {
      table.dropColumn('updated_at');
      table.dropColumn('last_updated_by');
    })
    .alterTable('requests', table => {
      table.dropColumn('updated_at');
      table.dropColumn('last_updated_by');
    });
}

