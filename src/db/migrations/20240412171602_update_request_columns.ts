import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('requests', (table) => {
    table.dropColumn('title');
    table.dropColumn('location_id');
    table.text('channel_id');
    table.text('user_id').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('requests', (table) => {
    table.text('title').notNullable();
    table.text('location_id').notNullable();
    table.dropColumn('channel_id');
    table.dropColumn('user_id');
  });
}

