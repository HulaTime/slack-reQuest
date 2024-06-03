import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('requests', table => {
      table.text('status');
    });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('requests', table => {
      table.dropColumn('status');
    });
}

