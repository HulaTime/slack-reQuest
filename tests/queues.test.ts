import { randomUUID } from 'node:crypto';

import supertest from 'supertest';

import { app } from '../src/app';
import { SlashCommandReq } from '../src/common/types';
import { getDbConnection } from '../db/init';

type TestRequest = Partial<SlashCommandReq>;

describe('POST /queues', () => {
  const queueNameSuffix = randomUUID();

  afterAll(async () => {
    const db = getDbConnection();
    await db('queues').del()
      .where('name', 'like', `%${queueNameSuffix}` );
    await db.destroy();
  });

  test('I can create a new queue with minimum required parameters', async () => {
    const payload: TestRequest = { text: `new queue${queueNameSuffix}`, user_id: '1234' };
    await supertest(app)
      .post('/queues')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(payload)
      .expect(201);
  });

  test('I should get the newly created resource in the response', async () => {
    const payload: TestRequest = { text: `new queue 2${queueNameSuffix}`, user_id: '1234' };
    const { body } = await supertest(app)
      .post('/queues')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(payload);
    expect(body).toEqual({
      id: expect.any(String),
      name: payload.text,
      userId: payload.user_id,
      createdAt: expect.any(String),
    });
  });
});

