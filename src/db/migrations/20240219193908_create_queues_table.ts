import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('queues', table => {
    table.text('id').primary();
    table.string('name');
    table.string('user_id');
    table.timestamp('created_at', { useTz: true });
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('queues');
}

