import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('queues', (table) => {
      table.renameColumn('user_id', 'owner_id');
    })
    .alterTable('requests', (table) => {
      table.renameColumn('user_id', 'owner_id');
    });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('queues', (table) => {
      table.renameColumn('owner_id', 'user_id');
    })
    .alterTable('requests', (table) => {
      table.renameColumn('owner_id', 'user_id');
    });
}

