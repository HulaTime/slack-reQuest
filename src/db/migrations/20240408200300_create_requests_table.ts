import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('requests', table => {
    table.text('id').primary();
    table.text('description').notNullable();
    table.text('type').notNullable(); // type should be user or channel
    table.text('created_by_id').notNullable();
    table.text('created_by_name').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('requests');
}

