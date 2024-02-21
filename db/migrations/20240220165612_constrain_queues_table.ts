import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('queues').whereNull('name')
    .update({ name: 'Default Name' });
  await knex('queues').whereNull('user_id')
    .update({ user_id: 'Default UserID' });
  return knex.schema.alterTable('queues', (table) => {
    table.string('name')
      .notNullable()
      .alter();
    table.string('user_id')
      .notNullable()
      .alter();

    table.unique(['name']);

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    table.string('name').nullable()
      .alter();
    table.string('user_id').nullable()
      .alter();

    table.timestamp('created_at', { useTz: true }).defaultTo(null)
      .alter();
  });
}
