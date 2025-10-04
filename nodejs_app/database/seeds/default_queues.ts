import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Inserts seed entries
  await knex('users').insert([
    { id: '4466c9b5-c250-4236-b3f0-a24c6356fc55', name: 'admin' },
  ]);
  await knex('queues').insert([
    {
      id: '00a31aa9-7430-45da-b9cf-67e7ef45a65a',
      name: 'Code Review',
      type: 'default',
      owner: '4466c9b5-c250-4236-b3f0-a24c6356fc55',
    },
    { 
      id: '23483b34-ac25-4c1a-8415-b912acc93434',
      name: 'Release',
      type: 'default',
      owner: '4466c9b5-c250-4236-b3f0-a24c6356fc55',
    },
  ]);
};
