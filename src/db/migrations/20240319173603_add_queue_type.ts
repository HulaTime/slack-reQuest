import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    table.text('type')
      .notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    table.dropColumn('type');
  });
}
