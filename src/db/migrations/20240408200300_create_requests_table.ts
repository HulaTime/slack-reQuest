import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('requests', table => {
    table.text('id').primary();
    table.text('title').notNullable();
    table.text('description');
    table.text('type').notNullable(); // type should be user or channel
    table.text('location_id').notNullable(); // If type is user this should be userId, otherwise channelId
    table.text('created_by_id').notNullable();
    table.text('created_by_name').notNullable();
    table.timestamp('created_at', { useTz: true });
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('requests');
}

