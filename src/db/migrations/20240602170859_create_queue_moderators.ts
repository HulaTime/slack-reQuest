import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('queue_moderators', table => {
    table.text('queue_id').primary();
    table.string('user_id');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('queue_moderators');
}

