import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('requests', table => {
      table.dropColumn('created_by_id');
      table.dropColumn('created_by_name');
    });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('requests', table => {
      table.text('created_by_id');
      table.text('created_by_name');
    });
}

